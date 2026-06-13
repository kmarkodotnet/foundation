import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminUserService } from '../services/admin-user.service';
import { ROLE_LABELS } from '../models/admin-user.model';
import { UserRole } from '../../../core/auth/models/user.model';

@Component({
  selector: 'gm-create-invitation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Új meghívó küldése</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="invite-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail cím</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="off" />
          @if (form.controls.email.errors?.['required']) {
            <mat-error>Kötelező mező.</mat-error>
          }
          @if (form.controls.email.errors?.['email']) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Szerepkör</mat-label>
          <mat-select formControlName="role">
            @for (r of roleOptions; track r.value) {
              <mat-option [value]="r.value">{{ r.label }}</mat-option>
            }
          </mat-select>
          @if (form.controls.role.errors?.['required']) {
            <mat-error>Kötelező mező.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="saving()">Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        form="invite-form"
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="18" />
        }
        Meghívó küldése
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 8px; display: block; }`],
})
export class CreateInvitationDialogComponent {
  private readonly service = inject(AdminUserService);
  private readonly dialogRef = inject(MatDialogRef<CreateInvitationDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly roleOptions: { value: UserRole; label: string }[] = Object.entries(ROLE_LABELS).map(
    ([value, label]) => ({ value: value as UserRole, label })
  );

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    role: new FormControl<UserRole | null>(null, {
      validators: [Validators.required],
    }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    const { email, role } = this.form.getRawValue();
    this.saving.set(true);
    this.service.createInvitation(email, role as UserRole).subscribe({
      next: (invitation) => {
        this.saving.set(false);
        this.snackBar.open(`Meghívó elküldve: ${invitation.email}`, 'OK', { duration: 4000 });
        this.dialogRef.close(invitation);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(
          err?.error?.detail ?? 'Nem sikerült elküldeni a meghívót.',
          'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
