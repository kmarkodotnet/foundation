import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../core/notifications/notification.service';
import { AppNotification } from '../../core/notifications/notification.model';
import { DateHuPipe } from '../../shared/pipes/date-hu.pipe';

const TYPE_ICON: Record<string, string> = {
  SubmissionDeadlineApproaching: 'schedule',
  SubmissionDeadlineMissed: 'alarm_off',
  SpendingDeadlineApproaching: 'payments',
  ResultRecorded: 'emoji_events',
  SettlementAwaitingApproval: 'task_alt',
  ApprovalRequired: 'approval',
  NewComment: 'chat_bubble',
  DocumentUploaded: 'upload_file',
};

@Component({
  selector: 'gm-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    DateHuPipe,
  ],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="menu"
      [matBadge]="unreadCount() > 0 ? unreadCount() : null"
      matBadgeColor="warn"
      aria-label="Értesítések"
    >
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #menu="matMenu" class="gm-notification-menu">
      <div class="gm-notif-header">
        <span class="gm-notif-title">Értesítések</span>
        @if (unreadCount() > 0) {
          <button mat-button color="primary" (click)="markAllAsRead(); $event.stopPropagation()">
            Összes olvasott
          </button>
        }
      </div>
      <mat-divider />

      @if (notifications().length === 0) {
        <div class="gm-notif-empty">Nincs értesítés</div>
      }

      @for (n of notifications().slice(0, 15); track n.id) {
        <button
          mat-menu-item
          class="gm-notif-item"
          [class.gm-notif-unread]="!n.isRead"
          (click)="onNotificationClick(n)"
        >
          <mat-icon class="gm-notif-icon">{{ iconFor(n) }}</mat-icon>
          <div class="gm-notif-content">
            <div class="gm-notif-item-title">{{ n.title }}</div>
            <div class="gm-notif-item-body">{{ n.body }}</div>
            <div class="gm-notif-item-time">{{ n.createdAt | dateHu: 'datetime' }}</div>
          </div>
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .gm-notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
    }
    .gm-notif-title { font-weight: 600; font-size: 14px; }
    .gm-notif-empty { padding: 16px; color: var(--mat-sys-on-surface-variant); text-align: center; }
    .gm-notif-item {
      display: flex;
      align-items: flex-start !important;
      height: auto !important;
      padding: 8px 16px !important;
      min-width: 360px;
      max-width: 420px;
      white-space: normal !important;
    }
    .gm-notif-unread { background: rgba(var(--mat-sys-primary-rgb), 0.05); }
    .gm-notif-icon { margin-right: 12px; flex-shrink: 0; color: var(--mat-sys-primary); }
    .gm-notif-content { flex: 1; min-width: 0; }
    .gm-notif-item-title { font-weight: 500; font-size: 13px; }
    .gm-notif-item-body { font-size: 12px; color: var(--mat-sys-on-surface-variant); white-space: normal; line-height: 1.4; }
    .gm-notif-item-time { font-size: 11px; color: var(--mat-sys-on-surface-variant); margin-top: 2px; }
  `],
})
export class NotificationBellComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  iconFor(n: AppNotification): string {
    return TYPE_ICON[n.type] ?? 'notifications';
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.id).subscribe();
    }

    if (n.relatedEntityId && n.relatedEntityType === 'Application') {
      this.router.navigate(['/applications', n.relatedEntityId]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
}
