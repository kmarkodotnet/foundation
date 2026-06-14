import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PlatformUserService } from '../services/platform-user.service';
import { PlatformInviteDialogComponent } from './platform-invite-dialog.component';
import { PlatformUserListItem, PlatformUserStatus } from '../models/platform-user.model';
import { AuthService } from '../../../core/auth/auth.service';

const STATUS_LABELS: Record<PlatformUserStatus, string> = {
  Active: 'Aktív',
  Inactive: 'Inaktív',
  PendingInvitation: 'Meghívó elküldve',
};

@Component({
  selector: 'gm-platform-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Platform felhasználók</h1>
        @if (isPlatformAdmin()) {
          <button mat-flat-button color="primary" (click)="openInvite()">
            <mat-icon>person_add</mat-icon>
            Meghívás
          </button>
        }
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (users().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>people</mat-icon>
                <p>Nincsenek platform-szintű felhasználók.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="users()" class="full-width">
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>E-mail</th>
                  <td mat-cell *matCellDef="let row">{{ row.email }}</td>
                </ng-container>
                <ng-container matColumnDef="fullName">
                  <th mat-header-cell *matHeaderCellDef>Név</th>
                  <td mat-cell *matCellDef="let row">{{ row.fullName ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Szerepkör</th>
                  <td mat-cell *matCellDef="let row">{{ row.role }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Státusz</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-' + row.status.toLowerCase()">
                      {{ statusLabel(row.status) }}
                    </mat-chip>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .gm-empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; color: #888; }
    .gm-empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-inactive { background: #f5f5f5; color: #616161; }
    .status-pendinginvitation { background: #e3f2fd; color: #1565c0; }
  `],
})
export class PlatformUsersListComponent implements OnInit {
  private readonly service = inject(PlatformUserService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly users = signal<PlatformUserListItem[]>([]);
  readonly columns = ['email', 'fullName', 'role', 'status'];

  isPlatformAdmin(): boolean {
    return this.authService.hasAnyRole(['PlatformAdmin' as any]);
  }

  statusLabel(status: PlatformUserStatus): string {
    return STATUS_LABELS[status];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.users.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openInvite(): void {
    const ref = this.dialog.open(PlatformInviteDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((sent) => { if (sent) this.load(); });
  }
}
