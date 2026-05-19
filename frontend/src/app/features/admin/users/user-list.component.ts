import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUser } from '../models/admin-user.model';
import { UserRole } from '../../../core/auth/models/user.model';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';

@Component({
  selector: 'gm-user-list',
  imports: [
    MatButtonModule, MatCardModule, MatChipsModule, MatIconModule,
    MatProgressSpinnerModule, MatSelectModule, MatTableModule, MatTooltipModule,
    DateHuPipe,
  ],
  template: `
    <div class="gm-page-container">
      <h1>Felhasználók kezelése</h1>
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="users()" style="width:100%">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Név</th>
                <td mat-cell *matCellDef="let row">
                  <strong>{{ row.name }}</strong><br>
                  <small>{{ row.email }}</small>
                </td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Szerepkör</th>
                <td mat-cell *matCellDef="let row">
                  <mat-select [value]="row.role" (selectionChange)="changeRole(row.id, $event.value)" style="min-width:160px">
                    @for (r of roleOptions; track r) {
                      <mat-option [value]="r">{{ r }}</mat-option>
                    }
                  </mat-select>
                </td>
              </ng-container>
              <ng-container matColumnDef="isActive">
                <th mat-header-cell *matHeaderCellDef>Státusz</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [color]="row.isActive ? 'primary' : 'warn'" highlighted>
                    {{ row.isActive ? 'Aktív' : 'Inaktív' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="lastLoginAt">
                <th mat-header-cell *matHeaderCellDef>Utolsó bejelentkezés</th>
                <td mat-cell *matCellDef="let row">{{ row.lastLoginAt | dateHu: 'datetime' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  @if (row.isActive) {
                    <button mat-icon-button color="warn" matTooltip="Deaktiválás" (click)="toggleActive(row, false)">
                      <mat-icon>block</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button color="primary" matTooltip="Aktiválás" (click)="toggleActive(row, true)">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private readonly service = inject(AdminUserService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly users = signal<AdminUser[]>([]);
  readonly columns = ['name', 'role', 'isActive', 'lastLoginAt', 'actions'];
  readonly roleOptions: UserRole[] = ['Admin', 'Elnok', 'PalyazatiMunkatars', 'Penzugyes', 'Megtekinto'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeRole(id: string, role: UserRole): void {
    this.service.updateRole(id, { role }).subscribe(() =>
      this.snackBar.open('Szerepkör frissítve.', 'OK', { duration: 3000 })
    );
  }

  toggleActive(user: AdminUser, activate: boolean): void {
    const op = activate ? this.service.activate(user.id) : this.service.deactivate(user.id);
    op.subscribe(() => {
      this.users.update((list) =>
        list.map((u) => u.id === user.id ? { ...u, isActive: activate } : u)
      );
    });
  }
}
