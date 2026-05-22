import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentDto } from '../../../features/applications/models/application.model';
import { DocumentService } from '../../../features/applications/services/document.service';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CallDocument: 'Pályázati felhívás',
  SubmissionDocument: 'Beadási dokumentum',
  ContractDocument: 'Szerződés',
  Invoice: 'Számla',
  ProofPhoto: 'Teljesítési igazolás',
  SettlementDocument: 'Elszámolási dokumentum',
  Other: 'Egyéb',
};

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/vnd.ms-outlook',
  'message/rfc822',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

@Component({
  selector: 'gm-document-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
})
export class DocumentUploadComponent {
  readonly appId = input.required<string>();
  readonly stepId = input.required<string>();
  readonly uploaded = output<DocumentDto>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly documentService = inject(DocumentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly selectedFile = signal<File | null>(null);
  readonly showForm = signal(false);

  readonly documentTypeOptions = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  readonly form = new FormGroup({
    documentType: new FormControl<string>('Other', [Validators.required]),
    displayName: new FormControl<string>(''),
  });

  openForm(): void {
    this.showForm.set(true);
    this.form.reset({ documentType: 'Other', displayName: '' });
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.cdr.markForCheck();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.form.reset({ documentType: 'Other', displayName: '' });
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      this.snackBar.open(
        'Nem támogatott fájlformátum. Elfogadott: PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML.',
        'Bezár',
        { duration: 6000, panelClass: ['gm-snack-error'] }
      );
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.snackBar.open('A fájl mérete nem lehet nagyobb 50 MB-nál.', 'Bezár', {
        duration: 6000,
        panelClass: ['gm-snack-error'],
      });
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
    this.cdr.markForCheck();
    input.value = '';
  }

  submitUpload(): void {
    if (this.form.invalid || !this.selectedFile() || this.uploading()) return;

    const v = this.form.getRawValue();
    const file = this.selectedFile()!;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workflowStepId', this.stepId());
    formData.append('documentType', v.documentType!);
    if (v.displayName) {
      formData.append('displayName', v.displayName);
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.cdr.markForCheck();

    this.documentService.uploadDocument(this.appId(), formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? file.size;
          this.uploadProgress.set(Math.round((100 * event.loaded) / total));
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          const doc = event.body as DocumentDto;
          this.uploading.set(false);
          this.showForm.set(false);
          this.selectedFile.set(null);
          this.uploadProgress.set(0);
          this.form.reset({ documentType: 'Other', displayName: '' });
          this.snackBar.open('Dokumentum feltöltve.', 'Bezár', { duration: 4000 });
          this.uploaded.emit(doc);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.uploading.set(false);
        this.snackBar.open('A feltöltés sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }
}
