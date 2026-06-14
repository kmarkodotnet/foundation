import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformBreakGlassService } from '../services/platform-break-glass.service';
import { BreakGlassGrantListItem, BreakGlassStatus } from '../models/break-glass.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const STATUS_LABELS: Record<BreakGlassStatus, string> = {
  Active: 'Aktív',
  Revoked: 'Visszavonva',
  Expired: 'Lejárt',
};

@Component({
  selector: 'gm-break-glass-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Break-glass grant-ek</h1>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (grants().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>vpn_key</mat-icon>
                <p>Nincs aktív break-glass hozzáférés.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="grants()" class="full-width">
                <ng-container matColumnDef="targetOwnerName">
                  <th mat-header-cell *matHeaderCellDef>Owner</th>
                  <td mat-cell *matCellDef="let row">{{ row.targetOwnerName }}</td>
                </ng-container>
                <ng-container matColumnDef="issuedByEmail">
                  <th mat-header-cell *matHeaderCellDef>Kiállító</th>
                  <td mat-cell *matCellDef="let row">{{ row.issuedByEmail }}</td>
                </ng-container>
                <ng-container matColumnDef="issuedAt">
                  <th mat-header-cell *matHeaderCellDef>Kiállítva</th>
                  <td mat-cell *matCellDef="let row">{{ row.issuedAt | date:'yyyy-MM-dd HH:mm' }}</td>
                </ng-container>
                <ng-container matColumnDef="expiresAt">
                  <th mat-header-cell *matHeaderCellDef>Lejárat</th>
                  <td mat-cell *matCellDef="let row" [class.expired-cell]="isExpiredClient(row)">
                    {{ row.expiresAt | date:'yyyy-MM-dd HH:mm' }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Státusz</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-' + effectiveStatus(row).toLowerCase()">
                      {{ statusLabel(effectiveStatus(row)) }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.status === 'Active' && !isExpiredClient(row)) {
                      <button mat-stroked-button color="warn" (click)="revoke(row)">
                        Visszavonás
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: columns"
                  [class.active-row]="row.status === 'Active' && !isExpiredClient(row)"
                ></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .gm-empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; color: #888; }
    .gm-empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .active-row { background: #fff8e1; }
    .expired-cell { color: #f44336; }
    .status-active { background: #fff3e0; color: #e65100; }
    .status-revoked { background: #f5f5f5; color: #616161; }
    .status-expired { background: #ffebee; color: #c62828; }
  `],
})
export class BreakGlassListComponent implements OnInit {
  private readonly service = inject(PlatformBreakGlassService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly grants = signal<BreakGlassGrantListItem[]>([]);
  readonly columns = ['targetOwnerName', 'issuedByEmail', 'issuedAt', 'expiresAt', 'status', 'actions'];

  isExpiredClient(grant: BreakGlassGrantListItem): boolean {
    return grant.status === 'Active' && new Date(grant.expiresAt) < new Date();
  }

  effectiveStatus(grant: BreakGlassGrantListItem): BreakGlassStatus {
    if (this.isExpiredClient(grant)) return 'Expired';
    return grant.status;
  }

  statusLabel(status: BreakGlassStatus): string {
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
        next: (data) => { this.grants.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  revoke(grant: BreakGlassGrantListItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Break-glass visszavonása',
        message: `Biztosan visszavonod a(z) "${grant.targetOwnerName}" Owner-hez kiállított break-glass hozzáférést?`,
        confirmLabel: 'Visszavonás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.revoke(grant.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Break-glass visszavonva.', 'OK', { duration: 3000 });
          this.load();
        });
    });
  }
}
