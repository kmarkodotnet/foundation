import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OwnerFoundationService } from '../services/owner-foundation.service';
import { OwnerUserService } from '../services/owner-user.service';
import { FoundationAdmin, FoundationDetails } from '../models/foundation.model';
import { OwnerUserListItem } from '../models/owner-user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'gm-foundation-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="gm-page-container">
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else if (foundation()) {
        <div class="gm-page-header">
          <button mat-icon-button (click)="back()"><mat-icon>arrow_back</mat-icon></button>
          <h1>{{ foundation()!.name }}</h1>
          <mat-chip [class]="'status-' + foundation()!.status.toLowerCase()">
            {{ foundation()!.status === 'Active' ? 'Aktív' : 'Archivált' }}
          </mat-chip>
        </div>

        <mat-tab-group>
          <mat-tab label="Áttekintés">
            <div class="tab-content">
              <mat-card class="detail-card">
                <mat-card-content>
                  <div class="detail-row">
                    <span class="label">Aktív pályázatok</span>
                    <span>{{ foundation()!.activeApplicationsCount }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Létrehozva</span>
                    <span>{{ foundation()!.createdAt | date:'yyyy-MM-dd' }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              @if (foundation()!.status !== 'Archived') {
                <div class="action-bar">
                  <button
                    mat-stroked-button
                    color="warn"
                    [disabled]="foundation()!.activeApplicationsCount > 0"
                    [matTooltip]="foundation()!.activeApplicationsCount > 0
                      ? foundation()!.activeApplicationsCount + ' aktív pályázat van; először zárd le őket.'
                      : ''"
                    (click)="archive()"
                  >
                    <mat-icon>archive</mat-icon>
                    Archiválás
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Adminok">
            <div class="tab-content">
              <div class="section-header">
                <h3>FoundationAdmin-ok</h3>
                <button mat-stroked-button (click)="showAssignForm.set(!showAssignForm())">
                  <mat-icon>person_add</mat-icon>
                  Kinevezés
                </button>
              </div>

              @if (showAssignForm()) {
                <mat-card class="assign-card">
                  <mat-card-content>
                    <form [formGroup]="assignForm" (ngSubmit)="assignAdmin()">
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>Felhasználó</mat-label>
                        <mat-select formControlName="targetUserId">
                          @for (u of ownerUsers(); track u.id) {
                            <mat-option [value]="u.id">{{ u.email }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>Szerepkör</mat-label>
                        <mat-select formControlName="role">
                          <mat-option value="FoundationAdmin">FoundationAdmin</mat-option>
                          <mat-option value="Megtekinto">Megtekintő</mat-option>
                        </mat-select>
                      </mat-form-field>
                      <div class="form-actions">
                        <button mat-flat-button color="primary" type="submit" [disabled]="assignForm.invalid || assigning()">
                          @if (assigning()) { <mat-spinner diameter="18" /> } @else { Kinevezés }
                        </button>
                        <button mat-button type="button" (click)="showAssignForm.set(false)">Mégsem</button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              @if (adminsLoading()) {
                <mat-spinner diameter="32" />
              } @else {
                <table mat-table [dataSource]="admins()" class="full-width">
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>E-mail</th>
                    <td mat-cell *matCellDef="let row">{{ row.email }}</td>
                  </ng-container>
                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Szerepkör</th>
                    <td mat-cell *matCellDef="let row">{{ row.role }}</td>
                  </ng-container>
                  <ng-container matColumnDef="assignedAt">
                    <th mat-header-cell *matHeaderCellDef>Hozzárendelve</th>
                    <td mat-cell *matCellDef="let row">{{ row.assignedAt | date:'yyyy-MM-dd' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row">
                      <button
                        mat-icon-button
                        color="warn"
                        [disabled]="admins().length <= 1"
                        [matTooltip]="admins().length <= 1 ? 'Az utolsó FoundationAdmin nem vonható vissza.' : 'Visszavonás'"
                        (click)="revokeAdmin(row)"
                      >
                        <mat-icon>person_remove</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="adminColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: adminColumns"></tr>
                </table>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .tab-content { padding: 16px 0; }
    .detail-card { margin-bottom: 16px; }
    .detail-row { display: flex; gap: 16px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 500; min-width: 180px; color: #666; }
    .action-bar { display: flex; gap: 12px; }
    .section-header { display: flex; align-items: center; margin-bottom: 12px; }
    .section-header h3 { margin: 0; flex: 1; }
    .assign-card { margin-bottom: 16px; }
    .field { width: 100%; display: block; margin-bottom: 8px; }
    .form-actions { display: flex; gap: 8px; }
    .full-width { width: 100%; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-archived { background: #f5f5f5; color: #616161; }
  `],
})
export class FoundationDetailsComponent implements OnInit {
  private readonly service = inject(OwnerFoundationService);
  private readonly userService = inject(OwnerUserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly adminsLoading = signal(false);
  readonly assigning = signal(false);
  readonly foundation = signal<FoundationDetails | null>(null);
  readonly admins = signal<FoundationAdmin[]>([]);
  readonly ownerUsers = signal<OwnerUserListItem[]>([]);
  readonly showAssignForm = signal(false);
  readonly adminColumns = ['email', 'role', 'assignedAt', 'actions'];

  private get foundationId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly assignForm = new FormGroup({
    targetUserId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl('FoundationAdmin', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.load();
    this.loadAdmins();
    this.userService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.ownerUsers.set(data));
  }

  load(): void {
    this.loading.set(true);
    this.service.getById(this.foundationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.foundation.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  loadAdmins(): void {
    this.adminsLoading.set(true);
    this.service.getAdmins(this.foundationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.admins.set(data); this.adminsLoading.set(false); },
        error: () => this.adminsLoading.set(false),
      });
  }

  back(): void {
    this.router.navigate(['/owner/foundations']);
  }

  archive(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Alapítvány archiválása',
        message: 'Biztosan archiválod az alapítványt? Ez a művelet nem vonható vissza.',
        confirmLabel: 'Archiválás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.archive(this.foundationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Alapítvány archiválva.', 'OK', { duration: 3000 });
          this.router.navigate(['/owner/foundations']);
        });
    });
  }

  assignAdmin(): void {
    if (this.assignForm.invalid || this.assigning()) return;
    this.assigning.set(true);
    const v = this.assignForm.getRawValue();
    this.service.assignAdmin(this.foundationId, v)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.snackBar.open('Admin kinevezve.', 'OK', { duration: 3000 });
          this.showAssignForm.set(false);
          this.assignForm.reset({ role: 'FoundationAdmin' });
          this.loadAdmins();
        },
        error: () => this.assigning.set(false),
      });
  }

  revokeAdmin(admin: FoundationAdmin): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Admin visszavonása',
        message: `Biztosan visszavonod ${admin.email} admin jogosultságát?`,
        confirmLabel: 'Visszavonás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.revokeAdmin(this.foundationId, admin.userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Admin visszavonva.', 'OK', { duration: 3000 });
          this.loadAdmins();
        });
    });
  }
}
