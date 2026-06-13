import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUser, Invitation, InvitationStatus, ROLE_LABELS } from '../models/admin-user.model';
import { UserRole } from '../../../core/auth/models/user.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CreateInvitationDialogComponent } from './create-invitation-dialog.component';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';

const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  Pending: 'Függőben',
  Accepted: 'Elfogadva',
  Expired: 'Lejárt',
  Revoked: 'Visszavonva',
};

const INVITATION_STATUS_COLORS: Record<InvitationStatus, string> = {
  Pending: 'accent',
  Accepted: 'primary',
  Expired: '',
  Revoked: 'warn',
};

@Component({
  selector: 'gm-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    DateHuPipe,
  ],
  template: `
    <div class="gm-page-container">
      <h1>Felhasználók kezelése</h1>

      <mat-tab-group>
        <!-- ─── Felhasználók tab ─────────────────────────────────────────── -->
        <mat-tab label="Felhasználók">
          <div class="gm-tab-content">
            <mat-card class="gm-filter-card">
              <mat-card-content>
                <form [formGroup]="filterForm" class="gm-filter-row">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="gm-search-field">
                    <mat-icon matPrefix>search</mat-icon>
                    <mat-label>Keresés (név, e-mail)</mat-label>
                    <input matInput formControlName="searchTerm" />
                  </mat-form-field>

                  @if (canManageUsers()) {
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>Szerepkör</mat-label>
                      <mat-select formControlName="role">
                        <mat-option value="">Mind</mat-option>
                        @for (r of roleOptions; track r.value) {
                          <mat-option [value]="r.value">{{ r.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                </form>
              </mat-card-content>
            </mat-card>

            @if (loading()) {
              <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
            } @else {
              <mat-card>
                <mat-card-content>
                  <table mat-table [dataSource]="users()" style="width:100%">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Felhasználó</th>
                      <td mat-cell *matCellDef="let row" [class.gm-inactive-row]="!row.isActive">
                        <div class="gm-user-cell">
                          @if (row.profilePictureUrl) {
                            <img [src]="row.profilePictureUrl" class="gm-avatar" alt="" />
                          } @else {
                            <div class="gm-avatar-placeholder">
                              <mat-icon>account_circle</mat-icon>
                            </div>
                          }
                          <div>
                            <strong>{{ row.name }}</strong>
                            @if (!row.isActive) {
                              <mat-chip class="gm-inactive-chip" color="warn" highlighted>Inaktív</mat-chip>
                            }
                            <br>
                            <small class="gm-email">{{ row.email }}</small>
                          </div>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="role">
                      <th mat-header-cell *matHeaderCellDef>Szerepkör</th>
                      <td mat-cell *matCellDef="let row">
                        @if (canManageUsers()) {
                          <mat-select
                            [value]="row.role"
                            (selectionChange)="changeRole(row, $event.value)"
                            style="min-width: 190px"
                          >
                            @for (r of roleOptions; track r.value) {
                              <mat-option [value]="r.value">{{ r.label }}</mat-option>
                            }
                          </mat-select>
                        } @else {
                          <span>{{ roleLabels[row.role] || row.role }}</span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="lastLoginAt">
                      <th mat-header-cell *matHeaderCellDef>Utolsó belépés</th>
                      <td mat-cell *matCellDef="let row">
                        {{ row.lastLoginAt ? (row.lastLoginAt | dateHu: 'datetime') : '–' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let row">
                        @if (canManageUsers() && row.id !== currentUserId()) {
                          @if (row.isActive) {
                            <button
                              mat-icon-button
                              color="warn"
                              matTooltip="Inaktiválás"
                              (click)="confirmDeactivate(row)"
                            >
                              <mat-icon>block</mat-icon>
                            </button>
                          } @else {
                            <button
                              mat-icon-button
                              color="primary"
                              matTooltip="Reaktiválás"
                              (click)="activate(row)"
                            >
                              <mat-icon>check_circle</mat-icon>
                            </button>
                          }
                        }
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: userColumns"
                        [class.gm-inactive-row]="!row.isActive"></tr>
                  </table>

                  @if (users().length === 0) {
                    <p class="gm-empty">Nincs találat.</p>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- ─── Meghívók tab ─────────────────────────────────────────────── -->
        <mat-tab label="Meghívók">
          <div class="gm-tab-content">
            <div class="gm-invitations-header">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Állapot szűrő</mat-label>
                <mat-select [formControl]="invitationStatusFilter">
                  <mat-option value="">Mind</mat-option>
                  @for (s of invitationStatusOptions; track s.value) {
                    <mat-option [value]="s.value">{{ s.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (canManageUsers()) {
                <button mat-flat-button color="primary" (click)="openCreateInvitationDialog()">
                  <mat-icon>send</mat-icon>
                  Új meghívó küldése
                </button>
              }
            </div>

            @if (invitationsLoading()) {
              <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
            } @else {
              <mat-card>
                <mat-card-content>
                  <table mat-table [dataSource]="invitations()" style="width:100%">
                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>E-mail</th>
                      <td mat-cell *matCellDef="let row">{{ row.email }}</td>
                    </ng-container>

                    <ng-container matColumnDef="role">
                      <th mat-header-cell *matHeaderCellDef>Szerepkör</th>
                      <td mat-cell *matCellDef="let row">{{ roleLabels[row.role] || row.role }}</td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Állapot</th>
                      <td mat-cell *matCellDef="let row">
                        <mat-chip [color]="invStatusColor(row.status)" [highlighted]="row.status !== 'Expired'">
                          {{ invStatusLabel(row.status) }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="expiresAt">
                      <th mat-header-cell *matHeaderCellDef>Lejárat</th>
                      <td mat-cell *matCellDef="let row">
                        {{ row.expiresAt | dateHu: 'datetime' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="createdAt">
                      <th mat-header-cell *matHeaderCellDef>Létrehozva</th>
                      <td mat-cell *matCellDef="let row">
                        {{ row.createdAt | dateHu: 'date' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let row">
                        @if (canManageUsers()) {
                          @if (row.status === 'Pending' || row.status === 'Expired') {
                            <button
                              mat-icon-button
                              matTooltip="Újraküldés"
                              (click)="resendInvitation(row)"
                            >
                              <mat-icon>refresh</mat-icon>
                            </button>
                          }
                          @if (row.status === 'Pending') {
                            <button
                              mat-icon-button
                              color="warn"
                              matTooltip="Visszavonás"
                              (click)="confirmRevokeInvitation(row)"
                            >
                              <mat-icon>cancel</mat-icon>
                            </button>
                          }
                        }
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="invitationColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: invitationColumns"></tr>
                  </table>

                  @if (invitations().length === 0) {
                    <p class="gm-empty">Nincs meghívó.</p>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .gm-tab-content { padding-top: 16px; }
    .gm-filter-card { margin-bottom: 16px; }
    .gm-filter-row { display: flex; flex-wrap: wrap; gap: 12px; }
    .gm-search-field { flex: 1; min-width: 220px; }
    .gm-user-cell { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .gm-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .gm-avatar-placeholder { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--mat-sys-on-surface-variant); }
    .gm-inactive-chip { font-size: 10px; margin-left: 8px; }
    .gm-email { color: var(--mat-sys-on-surface-variant); }
    .gm-inactive-row { opacity: 0.55; }
    .gm-empty { color: var(--mat-sys-on-surface-variant); padding: 24px; text-align: center; }
    .gm-invitations-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  `],
})
export class UserListComponent implements OnInit {
  private readonly service = inject(AdminUserService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly users = signal<AdminUser[]>([]);
  readonly invitationsLoading = signal(false);
  readonly invitations = signal<Invitation[]>([]);

  readonly currentUserId = computed(() => this.auth.currentUser()?.userId ?? '');
  readonly canManageUsers = computed(() => this.auth.currentUser()?.role === 'Admin');
  readonly roleLabels: Record<string, string> = ROLE_LABELS;

  readonly userColumns = ['name', 'role', 'lastLoginAt', 'actions'];
  readonly invitationColumns = ['email', 'role', 'status', 'expiresAt', 'createdAt', 'actions'];

  readonly roleOptions: { value: UserRole; label: string }[] = Object.entries(ROLE_LABELS).map(
    ([value, label]) => ({ value: value as UserRole, label })
  );

  readonly invitationStatusOptions: { value: InvitationStatus; label: string }[] =
    (Object.keys(INVITATION_STATUS_LABELS) as InvitationStatus[]).map((s) => ({
      value: s,
      label: INVITATION_STATUS_LABELS[s],
    }));

  readonly filterForm = new FormGroup({
    searchTerm: new FormControl('', { nonNullable: true }),
    role: new FormControl<UserRole | ''>(''),
  });

  readonly invitationStatusFilter = new FormControl<InvitationStatus | ''>('');

  ngOnInit(): void {
    this.load();
    this.loadInvitations();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());

    this.invitationStatusFilter.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadInvitations());
  }

  load(): void {
    const { searchTerm, role } = this.filterForm.getRawValue();
    this.loading.set(true);
    this.service.getAll(searchTerm || undefined, (role as UserRole) || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.users.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  loadInvitations(): void {
    const status = this.invitationStatusFilter.value as InvitationStatus | '';
    this.invitationsLoading.set(true);
    this.service.getInvitations(status || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.invitations.set(data); this.invitationsLoading.set(false); },
        error: () => this.invitationsLoading.set(false),
      });
  }

  invStatusLabel(status: InvitationStatus): string {
    return INVITATION_STATUS_LABELS[status] ?? status;
  }

  invStatusColor(status: InvitationStatus): string {
    return INVITATION_STATUS_COLORS[status] ?? '';
  }

  openCreateInvitationDialog(): void {
    const ref = this.dialog.open(CreateInvitationDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((invitation) => {
      if (invitation) this.loadInvitations();
    });
  }

  resendInvitation(invitation: Invitation): void {
    this.service.resendInvitation(invitation.id).subscribe({
      next: (updated) => {
        this.invitations.update((list) =>
          list.map((i) => i.id === updated.id ? updated : i)
        );
        this.snackBar.open('Meghívó újraküldve.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült újraküldeni.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
      },
    });
  }

  confirmRevokeInvitation(invitation: Invitation): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Meghívó visszavonása',
        message: `Biztosan visszavonja ${invitation.email} meghívóját?`,
        confirmLabel: 'Visszavonás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.revokeInvitation(invitation);
    });
  }

  private revokeInvitation(invitation: Invitation): void {
    this.service.revokeInvitation(invitation.id).subscribe({
      next: (updated) => {
        this.invitations.update((list) =>
          list.map((i) => i.id === updated.id ? updated : i)
        );
        this.snackBar.open('Meghívó visszavonva.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült visszavonni.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
      },
    });
  }

  changeRole(user: AdminUser, role: UserRole): void {
    this.service.updateRole(user.id, role).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => u.id === user.id ? { ...u, role } : u)
        );
        this.snackBar.open('Szerepkör frissítve.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült módosítani a szerepkört.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
        this.load();
      },
    });
  }

  confirmDeactivate(user: AdminUser): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Felhasználó inaktiválása',
        message: `Biztosan inaktiválja ${user.name} fiókját? A felhasználó nem tud bejelentkezni.`,
        confirmLabel: 'Inaktiválás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deactivate(user);
    });
  }

  private deactivate(user: AdminUser): void {
    this.service.deactivate(user.id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => u.id === user.id ? { ...u, isActive: false } : u)
        );
        this.snackBar.open('Felhasználó inaktiválva.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült inaktiválni.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
      },
    });
  }

  activate(user: AdminUser): void {
    this.service.activate(user.id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => u.id === user.id ? { ...u, isActive: true } : u)
        );
        this.snackBar.open('Felhasználó reaktiválva.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült reaktiválni.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
      },
    });
  }
}
