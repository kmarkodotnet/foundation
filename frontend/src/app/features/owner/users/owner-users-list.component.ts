import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { OwnerUserService } from '../services/owner-user.service';
import { OwnerInviteDialogComponent } from './owner-invite-dialog.component';
import { OwnerUserListItem } from '../models/owner-user.model';

@Component({
  selector: 'gm-owner-users-list',
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
        <h1>Felhasználók</h1>
        <button mat-flat-button color="primary" (click)="openInvite()">
          <mat-icon>person_add</mat-icon>
          Meghívás
        </button>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (users().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>group</mat-icon>
                <p>Nincsenek felhasználók.</p>
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
                <ng-container matColumnDef="ownerRole">
                  <th mat-header-cell *matHeaderCellDef>Owner szerepkör</th>
                  <td mat-cell *matCellDef="let row">{{ row.ownerRole ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="foundations">
                  <th mat-header-cell *matHeaderCellDef>Alapítványok</th>
                  <td mat-cell *matCellDef="let row">
                    @for (a of row.foundationAssignments; track a.foundationId) {
                      <mat-chip class="foundation-chip">{{ a.foundationName }} ({{ a.role }})</mat-chip>
                    }
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
    .foundation-chip { font-size: 11px; margin: 2px; }
  `],
})
export class OwnerUsersListComponent implements OnInit {
  private readonly service = inject(OwnerUserService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly users = signal<OwnerUserListItem[]>([]);
  readonly columns = ['email', 'fullName', 'ownerRole', 'foundations'];

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
    const ref = this.dialog.open(OwnerInviteDialogComponent, { width: '560px' });
    ref.afterClosed().subscribe((sent) => { if (sent) this.load(); });
  }
}
