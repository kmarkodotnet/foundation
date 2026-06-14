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
import { OwnerFoundationService } from '../services/owner-foundation.service';
import { FoundationListItem } from '../models/foundation.model';

@Component({
  selector: 'gm-foundation-create-dialog',
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
    <h2 mat-dialog-title>Új alapítvány létrehozása</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="foundation-create-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Alapítvány neve</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>A név kötelező.</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>Legfeljebb 200 karakter.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Első FoundationAdmin e-mail</mat-label>
          <input matInput formControlName="initialFoundationAdminEmail" type="email" autocomplete="off" />
          @if (form.controls.initialFoundationAdminEmail.hasError('required')) {
            <mat-error>Az e-mail kötelező.</mat-error>
          }
          @if (form.controls.initialFoundationAdminEmail.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
        </mat-form-field>

        @if (activeFoundations().length > 0) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Sablon-alapítvány (opcionális)</mat-label>
            <mat-select formControlName="templateFoundationId">
              <mat-option [value]="null">Nincs sablon</mat-option>
              @for (f of activeFoundations(); track f.id) {
                <mat-option [value]="f.id">{{ f.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        form="foundation-create-form"
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Létrehozás }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class FoundationCreateDialogComponent {
  private readonly service = inject(OwnerFoundationService);
  private readonly dialogRef = inject(MatDialogRef<FoundationCreateDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly activeFoundations = signal<FoundationListItem[]>([]);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    initialFoundationAdminEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    templateFoundationId: new FormControl<string | null>(null),
  });

  constructor() {
    this.service.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.activeFoundations.set(data.filter((f) => f.status === 'Active')));
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.service.create({
      name: v.name,
      initialFoundationAdminEmail: v.initialFoundationAdminEmail,
      templateFoundationId: v.templateFoundationId ?? undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Alapítvány sikeresen létrehozva.', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
  }
}
