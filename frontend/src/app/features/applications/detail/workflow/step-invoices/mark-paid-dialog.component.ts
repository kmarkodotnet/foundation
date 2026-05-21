import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface MarkPaidDialogResult {
  paymentDate: Date;
}

@Component({
  selector: 'gm-mark-paid-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>Megjelölés fizetettnek</h2>
    <mat-dialog-content>
      <div [formGroup]="form" style="padding-top:8px">
        <mat-form-field style="width:100%">
          <mat-label>Fizetés dátuma *</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="paymentDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.paymentDate.hasError('required')) {
            <mat-error>A fizetés dátuma kötelező.</mat-error>
          }
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Mégse</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="confirm()"
      >
        Mentés
      </button>
    </mat-dialog-actions>
  `,
})
export class MarkPaidDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MarkPaidDialogComponent>);

  readonly form = new FormGroup({
    paymentDate: new FormControl<Date | null>(null, [Validators.required]),
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ paymentDate: this.form.controls.paymentDate.value! } as MarkPaidDialogResult);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
