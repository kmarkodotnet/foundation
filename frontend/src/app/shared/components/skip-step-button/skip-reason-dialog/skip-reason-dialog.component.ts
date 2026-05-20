import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'gm-skip-reason-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Lépés kihagyása</h2>
    <mat-dialog-content>
      <p>Megadhat egy opcionális indokot a kihagyáshoz.</p>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Indok (opcionális)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="cancel()">Mégsem</button>
      <button mat-raised-button color="warn" (click)="confirm()">Kihagyás megerősítése</button>
    </mat-dialog-actions>
  `,
})
export class SkipReasonDialogComponent {
  reason = '';

  constructor(private readonly dialogRef: MatDialogRef<SkipReasonDialogComponent>) {}

  confirm(): void {
    this.dialogRef.close({ confirmed: true, reason: this.reason || undefined });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
