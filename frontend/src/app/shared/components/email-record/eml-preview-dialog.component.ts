import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { EmlPreviewDto } from '../../../features/applications/models/application.model';

@Component({
  selector: 'gm-eml-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>E-mail előnézet</h2>
    <mat-dialog-content>
      <div class="preview-field">
        <span class="preview-label">Feladó:</span>
        <span>{{ data.from ?? '—' }}</span>
      </div>
      <mat-divider />
      <div class="preview-field">
        <span class="preview-label">Tárgy:</span>
        <span>{{ data.subject ?? '—' }}</span>
      </div>
      <mat-divider />
      <div class="preview-field">
        <span class="preview-label">Dátum:</span>
        <span>{{ data.date ? (data.date | date: 'yyyy. MM. dd. HH:mm') : '—' }}</span>
      </div>
      <mat-divider />
      <div class="preview-body">
        <span class="preview-label">Törzsszöveg:</span>
        <pre class="body-text">{{ data.body ?? '—' }}</pre>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Bezárás</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-field {
      display: flex;
      gap: 8px;
      padding: 8px 0;
      align-items: flex-start;
    }
    .preview-label {
      font-weight: 500;
      min-width: 80px;
      color: rgba(0,0,0,0.6);
    }
    .preview-body {
      padding: 8px 0;
    }
    .body-text {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      font-size: 0.875rem;
      margin: 4px 0 0;
      max-height: 300px;
      overflow-y: auto;
    }
  `],
})
export class EmlPreviewDialogComponent {
  readonly data = inject<EmlPreviewDto>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EmlPreviewDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }
}
