import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformOwnerService } from '../services/platform-owner.service';

@Component({
  selector: 'gm-owner-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Új Owner létrehozása</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="owner-create-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Név</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>A név kötelező.</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>Legfeljebb 200 karakter.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Kapcsolattartói e-mail</mat-label>
          <input matInput formControlName="contactEmail" type="email" autocomplete="off" />
          @if (form.controls.contactEmail.hasError('required')) {
            <mat-error>Az e-mail kötelező.</mat-error>
          }
          @if (form.controls.contactEmail.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Első OwnerAdmin e-mail</mat-label>
          <input matInput formControlName="initialOwnerAdminEmail" type="email" autocomplete="off" />
          @if (form.controls.initialOwnerAdminEmail.hasError('required')) {
            <mat-error>Az admin e-mail kötelező.</mat-error>
          }
          @if (form.controls.initialOwnerAdminEmail.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
          @if (form.controls.initialOwnerAdminEmail.hasError('emailTaken')) {
            <mat-error>Ez az e-mail cím már egy másik Owner-hez tartozik.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        form="owner-create-form"
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Létrehozás }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class OwnerCreateDialogComponent {
  private readonly service = inject(PlatformOwnerService);
  private readonly dialogRef = inject(MatDialogRef<OwnerCreateDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    initialOwnerAdminEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.service.create(v)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Owner sikeresen létrehozva.', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (err?.status === 409) {
            this.form.controls.initialOwnerAdminEmail.setErrors({ emailTaken: true });
          }
        },
      });
  }
}
