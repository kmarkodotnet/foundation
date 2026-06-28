import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ResendInvitationConfirmDialogData {
  email: string;
}

@Component({
  selector: 'gm-resend-invitation-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Függőben lévő meghívó</h2>
    <mat-dialog-content>
      <p>Erre az e-mail címre már van függőben lévő meghívó:</p>
      <strong>{{ data.email }}</strong>
      <p>Szeretnéd újraküldeni?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">Mégsem</button>
      <button mat-flat-button color="primary" (click)="close(true)">Újraküldés</button>
    </mat-dialog-actions>
  `,
})
export class ResendInvitationConfirmDialogComponent {
  readonly data = inject<ResendInvitationConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResendInvitationConfirmDialogComponent>);

  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
