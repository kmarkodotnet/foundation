import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VendorDto } from './models/vendor.model';
import { VendorService } from './services/vendor.service';

@Component({
  selector: 'gm-vendor-quick-add-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Új szerződő cég rögzítése</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;padding-top:8px;min-width:400px">
        <mat-form-field>
          <mat-label>Név *</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>A cég neve kötelező.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Adószám</mat-label>
          <input matInput formControlName="taxNumber" placeholder="pl. 12345678-1-23" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>E-mail</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Telefon</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Cím</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        @if (saving()) {
          <mat-spinner diameter="18" style="display:inline-block;vertical-align:middle;margin-right:4px" />
        }
        Mentés
      </button>
    </mat-dialog-actions>
  `,
})
export class VendorQuickAddDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly vendorService = inject(VendorService);
  private readonly dialogRef = inject(MatDialogRef<VendorQuickAddDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    taxNumber: [''],
    email: ['', Validators.email],
    phone: [''],
    address: [''],
  });

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.vendorService.createVendor({
      name: v.name!,
      taxNumber: v.taxNumber || undefined,
      email: v.email || undefined,
      phone: v.phone || undefined,
      address: v.address || undefined,
    }).subscribe({
      next: (result) => {
        if (result.hasTaxNumberWarning) {
          this.snackBar.open('Az adószám formátuma nem szabványos, de a cég rögzítve lett.', 'Bezár', { duration: 5000 });
        } else {
          this.snackBar.open('Cég rögzítve.', 'Bezár', { duration: 3000 });
        }
        this.dialogRef.close(result.vendor);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült rögzíteni a céget.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
