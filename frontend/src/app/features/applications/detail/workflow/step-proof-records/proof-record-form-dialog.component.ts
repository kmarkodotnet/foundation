import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProofRecordDto } from '../../../models/application.model';
import { ProofRecordService } from '../../../services/proof-record.service';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff'];
const MAX_BYTES = 50 * 1024 * 1024;

export interface ProofRecordFormDialogData {
  applicationId: string;
}

@Component({
  selector: 'gm-proof-record-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Igazolás rögzítése</h2>

    <mat-dialog-content>
      @if (saving()) {
        <mat-progress-bar mode="indeterminate" style="margin-bottom:12px" />
      }

      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;min-width:440px">

        <mat-form-field>
          <mat-label>Igazolás típusa *</mat-label>
          <mat-select formControlName="proofType">
            @for (opt of proofTypeOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
          @if (form.controls.proofType.hasError('required') && form.controls.proofType.touched) {
            <mat-error>A típus kiválasztása kötelező.</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Esemény dátuma *</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="eventDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.eventDate.hasError('required') && form.controls.eventDate.touched) {
            <mat-error>A dátum megadása kötelező.</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Megjegyzés</mat-label>
          <textarea matInput formControlName="notes" rows="3" maxlength="2000"
                    placeholder="Opcionális megjegyzés..."></textarea>
          @if (form.controls.notes.hasError('maxlength')) {
            <mat-error>A megjegyzés legfeljebb 2000 karakter lehet.</mat-error>
          }
          <mat-hint align="end">{{ form.controls.notes.value?.length ?? 0 }}/2000</mat-hint>
        </mat-form-field>

        <!-- File upload -->
        <div class="file-upload-section">
          <input
            #fileInput
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.tiff,.tif"
            style="display:none"
            (change)="onFilesSelected($event)"
          />

          <button mat-stroked-button type="button" (click)="fileInput.click()">
            <mat-icon>attach_file</mat-icon>
            Fotók kiválasztása
          </button>

          @if (fileErrors().length > 0) {
            <div class="file-errors">
              @for (err of fileErrors(); track err) {
                <p class="file-error">{{ err }}</p>
              }
            </div>
          }

          @if (selectedFiles().length > 0) {
            <div class="file-list">
              @for (file of selectedFiles(); track file.name; let i = $index) {
                <div class="file-item">
                  <mat-icon class="file-icon">image</mat-icon>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ fileSizeLabel(file.size) }})</span>
                  <button mat-icon-button type="button" (click)="removeFile(i)" [disabled]="saving()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>
          } @else {
            <p style="color:rgba(0,0,0,0.54);font-size:13px;margin:8px 0 0">
              Legalább egy fotó szükséges (JPG, PNG, TIFF — max. 50 MB/db).
            </p>
          }
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [disabled]="saving()" (click)="cancel()">Mégse</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || selectedFiles().length === 0 || saving()"
        (click)="submit()"
      >
        <mat-icon>save</mat-icon>
        Mentés
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .file-upload-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-errors {
      margin-top: 4px;
    }
    .file-error {
      color: #d32f2f;
      font-size: 13px;
      margin: 2px 0;
    }
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }
    .file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f5f5f5;
      border-radius: 4px;
      padding: 4px 8px;
    }
    .file-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0,0,0,0.54);
    }
    .file-name {
      flex: 1;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-size {
      font-size: 12px;
      color: rgba(0,0,0,0.54);
      white-space: nowrap;
    }
  `],
})
export class ProofRecordFormDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ProofRecordFormDialogComponent, ProofRecordDto | null>>(MatDialogRef);
  private readonly data = inject<ProofRecordFormDialogData>(MAT_DIALOG_DATA);
  private readonly proofRecordService = inject(ProofRecordService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly fileErrors = signal<string[]>([]);

  readonly proofTypeOptions = [
    { value: 'Event', label: 'Esemény' },
    { value: 'Asset', label: 'Tárgyi teljesítés' },
  ];

  readonly form = new FormGroup({
    proofType: new FormControl<string | null>(null, [Validators.required]),
    eventDate: new FormControl<Date | null>(null, [Validators.required]),
    notes: new FormControl<string>('', [Validators.maxLength(2000)]),
  });

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const errors: string[] = [];
    const valid: File[] = [];

    Array.from(input.files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Ez a fájlformátum nem támogatott.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`"${file.name}": A fájl mérete meghaladja az 50 MB-os korlátot.`);
        return;
      }
      valid.push(file);
    });

    this.fileErrors.set(errors);
    this.selectedFiles.update((existing) => [...existing, ...valid]);

    // reset input so same file can be re-selected after removal
    input.value = '';
    this.cdr.markForCheck();
  }

  removeFile(index: number): void {
    this.selectedFiles.update((list) => list.filter((_, i) => i !== index));
    this.cdr.markForCheck();
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid || this.selectedFiles().length === 0 || this.saving()) return;

    this.saving.set(true);
    const v = this.form.getRawValue();

    const fd = new FormData();
    fd.append('proofType', v.proofType!);
    fd.append('eventDate', (v.eventDate as Date).toISOString().substring(0, 10));
    if (v.notes) fd.append('notes', v.notes);
    this.selectedFiles().forEach((f) => fd.append('photos', f, f.name));

    this.proofRecordService.createProofRecord(this.data.applicationId, fd).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.snackBar.open('Igazolás sikeresen rögzítve.', 'Bezár', { duration: 4000 });
        this.dialogRef.close(result);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült rögzíteni az igazolást.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  fileSizeLabel(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
