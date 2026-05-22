import { Injectable, OnDestroy, inject, signal, computed } from '@angular/core';
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

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter((n) => !n.isRead).length
  );

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalrHubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('notification', (notification: AppNotification) => {
      this._notifications.update((list) => [notification, ...list]);
    });

    this.hubConnection.start().catch(console.error);
  }

  stopConnection(): void {
    this.hubConnection?.stop();
  }

  loadNotifications() {
    return this.http
      .get<AppNotification[]>(`${environment.apiUrl}/notifications?includeRead=false`)
      .pipe(
        tap((notifications) => this._notifications.set(notifications))
      );
  }

  markAsRead(id: string) {
    return this.http
      .patch(`${environment.apiUrl}/notifications/${id}/read`, {})
      .pipe(
        tap(() => {
          this._notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          );
        })
      );
  }

  markAllAsRead() {
    return this.http
      .patch(`${environment.apiUrl}/notifications/read-all`, {})
      .pipe(
        tap(() => {
          this._notifications.update((list) =>
            list.map((n) => ({ ...n, isRead: true }))
          );
        })
      );
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
