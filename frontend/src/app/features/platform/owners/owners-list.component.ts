import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformOwnerService } from '../services/platform-owner.service';
import { OwnerCreateDialogComponent } from './owner-create-dialog.component';
import { OwnerListItem, OwnerStatus } from '../models/owner.model';
import { AuthService } from '../../../core/auth/auth.service';

const STATUS_LABELS: Record<OwnerStatus, string> = {
  Active: 'Aktív',
  Suspended: 'Felfüggesztett',
  Archived: 'Archivált',
};

@Component({
  selector: 'gm-owners-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
        <h1>Owner-ek</h1>
        @if (isPlatformAdmin()) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon>
            Új Owner
          </button>
        }
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (owners().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>business</mat-icon>
                <p>Még nincs egyetlen Owner sem. Hozz létre egyet.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="owners()" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Név</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="contactEmail">
                  <th mat-header-cell *matHeaderCellDef>E-mail</th>
                  <td mat-cell *matCellDef="let row">{{ row.contactEmail }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Státusz</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-' + row.status.toLowerCase()">
                      {{ statusLabel(row.status) }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="activeFoundationsCount">
                  <th mat-header-cell *matHeaderCellDef>Aktív alapítványok</th>
                  <td mat-cell *matCellDef="let row">{{ row.activeFoundationsCount }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Részletek" (click)="openDetail(row)">
                      <mat-icon>chevron_right</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns" class="clickable-row" (click)="openDetail(row)"></tr>
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
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,.04); }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-suspended { background: #fff3e0; color: #e65100; }
    .status-archived { background: #f5f5f5; color: #616161; }
  `],
})
export class OwnersListComponent implements OnInit {
  private readonly service = inject(PlatformOwnerService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly owners = signal<OwnerListItem[]>([]);
  readonly columns = ['name', 'contactEmail', 'status', 'activeFoundationsCount', 'actions'];

  isPlatformAdmin(): boolean {
    return this.authService.hasAnyRole(['PlatformAdmin' as any]);
  }

  statusLabel(status: OwnerStatus): string {
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
        next: (data) => { this.owners.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openCreate(): void {
    const ref = this.dialog.open(OwnerCreateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created) => { if (created) this.load(); });
  }

  openDetail(owner: OwnerListItem): void {
    this.router.navigate(['/platform/owners', owner.id]);
  }
}
