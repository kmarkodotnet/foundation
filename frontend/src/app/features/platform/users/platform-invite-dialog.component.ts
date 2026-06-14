import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformUserService } from '../services/platform-user.service';
import { PlatformRole } from '../models/platform-user.model';

@Component({
  selector: 'gm-platform-invite-dialog',
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
    <h2 mat-dialog-title>Platform-szintű meghívó</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="platform-invite-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail cím</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Az e-mail kötelező.</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
          @if (form.controls.email.hasError('emailTaken')) {
            <mat-error>Ez az e-mail cím már egy Owner-hez/Foundation-hoz tartozik.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Szerepkör</mat-label>
          <mat-select formControlName="role">
            <mat-option value="PlatformAdmin">PlatformAdmin</mat-option>
            <mat-option value="PlatformAuditor">PlatformAuditor</mat-option>
          </mat-select>
          @if (form.controls.role.hasError('required')) {
            <mat-error>A szerepkör kötelező.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        form="platform-invite-form"
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Meghívás }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class PlatformInviteDialogComponent {
  private readonly service = inject(PlatformUserService);
  private readonly dialogRef = inject(MatDialogRef<PlatformInviteDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<PlatformRole>('PlatformAuditor', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.service.invite(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Meghívó elküldve.', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (err?.status === 409) {
            this.form.controls.email.setErrors({ emailTaken: true });
          }
        },
      });
  }
}
