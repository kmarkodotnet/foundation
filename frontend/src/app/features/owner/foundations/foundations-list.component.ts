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
import { OwnerFoundationService } from '../services/owner-foundation.service';
import { FoundationCreateDialogComponent } from './foundation-create-dialog.component';
import { FoundationListItem, FoundationStatus } from '../models/foundation.model';

const STATUS_LABELS: Record<FoundationStatus, string> = {
  Active: 'Aktív',
  Archived: 'Archivált',
};

@Component({
  selector: 'gm-foundations-list',
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
        <h1>Alapítványok</h1>
        <button mat-flat-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Új alapítvány
        </button>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (foundations().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>foundation</mat-icon>
                <p>Még nincs egyetlen alapítvány sem. Hozz létre egyet.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="foundations()" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Név</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Státusz</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'status-' + row.status.toLowerCase()">
                      {{ statusLabel(row.status) }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="activeApplicationsCount">
                  <th mat-header-cell *matHeaderCellDef>Aktív pályázatok</th>
                  <td mat-cell *matCellDef="let row">{{ row.activeApplicationsCount }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button (click)="openDetail(row)">
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
    .status-archived { background: #f5f5f5; color: #616161; }
  `],
})
export class FoundationsListComponent implements OnInit {
  private readonly service = inject(OwnerFoundationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly foundations = signal<FoundationListItem[]>([]);
  readonly columns = ['name', 'status', 'activeApplicationsCount', 'actions'];

  statusLabel(status: FoundationStatus): string {
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
        next: (data) => { this.foundations.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openCreate(): void {
    const ref = this.dialog.open(FoundationCreateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created) => { if (created) this.load(); });
  }

  openDetail(f: FoundationListItem): void {
    this.router.navigate(['/owner/foundations', f.id]);
  }
}
