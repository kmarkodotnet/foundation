import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { tap } from 'rxjs';
import { AppNotification } from './notification.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private hubConnection: signalR.HubConnection | null = null;
  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalrHubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: AppNotification) => {
      this._notifications.update((list) => [notification, ...list]);
      this._unreadCount.update((count) => count + 1);
    });

    this.hubConnection.start().catch(console.error);
  }

  stopConnection(): void {
    this.hubConnection?.stop();
  }

  loadNotifications() {
    return this.http
      .get<AppNotification[]>(`${environment.apiUrl}/notifications`)
      .pipe(
        tap((notifications) => {
          this._notifications.set(notifications);
          this._unreadCount.set(notifications.filter((n) => !n.isRead).length);
        })
      );
  }

  markAsRead(id: string) {
    return this.http
      .put(`${environment.apiUrl}/notifications/${id}/read`, {})
      .pipe(
        tap(() => {
          this._notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          );
          this._unreadCount.update((count) => Math.max(0, count - 1));
        })
      );
  }

  markAllAsRead() {
    return this.http
      .put(`${environment.apiUrl}/notifications/read-all`, {})
      .pipe(
        tap(() => {
          this._notifications.update((list) =>
            list.map((n) => ({ ...n, isRead: true }))
          );
          this._unreadCount.set(0);
        })
      );
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
