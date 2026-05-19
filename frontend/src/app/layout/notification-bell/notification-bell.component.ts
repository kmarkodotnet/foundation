import { Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService } from '../../core/notifications/notification.service';
import { DateHuPipe } from '../../shared/pipes/date-hu.pipe';

@Component({
  selector: 'gm-notification-bell',
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatMenuModule, DateHuPipe],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="menu"
      [matBadge]="unreadCount() || ''"
      matBadgeColor="warn"
    >
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #menu>
      <div style="min-width:320px; max-height:400px; overflow-y:auto">
        @for (n of notifications().slice(0, 10); track n.id) {
          <button mat-menu-item (click)="markAsRead(n.id)" [style.fontWeight]="n.isRead ? 'normal' : 'bold'">
            <span>{{ n.message }}</span>
            <small style="display:block;color:gray">{{ n.createdAt | dateHu: 'datetime' }}</small>
          </button>
        } @empty {
          <button mat-menu-item disabled>Nincs értesítés</button>
        }
        @if (unreadCount() > 0) {
          <button mat-menu-item (click)="markAllAsRead()">
            Összes olvasottnak jelölése
          </button>
        }
      </div>
    </mat-menu>
  `,
})
export class NotificationBellComponent {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
}
