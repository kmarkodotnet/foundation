import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../../core/auth/auth.service';
import { DateHuPipe } from '../../../../../shared/pipes/date-hu.pipe';
import { DocumentDto, ProofPhotoDto, ProofRecordDto, WorkflowStep, WorkflowStepDetail } from '../../../models/application.model';
import { ProofRecordService } from '../../../services/proof-record.service';
import { ProofRecordFormDialogComponent } from './proof-record-form-dialog.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';

interface LightboxState {
  url: string;
  photoIndex: number;
  recordId: string;
}

@Component({
  selector: 'gm-step-proof-records',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DateHuPipe,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  templateUrl: './step-proof-records.component.html',
  styleUrl: './step-proof-records.component.scss',
})
export class StepProofRecordsComponent implements OnInit, OnDestroy {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly proofRecordService = inject(ProofRecordService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly records = signal<ProofRecordDto[]>([]);
  readonly thumbnailUrls = signal<Map<string, string>>(new Map());
  readonly downloadingAll = signal<string | null>(null);
  readonly lightboxPhoto = signal<LightboxState | null>(null);
  readonly docRefreshTick = signal(0);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  ngOnInit(): void {
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.revokeAllUrls();
  }

  proofTypeLabel(type: string): string {
    return type === 'Event' ? 'Esemény' : 'Tárgyi teljesítés';
  }

  openAddForm(): void {
    const ref = this.dialog.open<ProofRecordFormDialogComponent, { applicationId: string }, ProofRecordDto | null>(
      ProofRecordFormDialogComponent,
      {
        width: '560px',
        data: { applicationId: this.applicationId() },
      }
    );
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.records.update((list) => [result, ...list]);
        this.loadThumbnailsForRecord(result);
        this.cdr.markForCheck();
      }
    });
  }

  loadThumbnailsForRecord(record: ProofRecordDto): void {
    record.photos.forEach((photo) => {
      this.proofRecordService.getPhoto(this.applicationId(), record.id, photo.id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.thumbnailUrls.update((map) => {
            const newMap = new Map(map);
            newMap.set(photo.id, url);
            return newMap;
          });
          this.cdr.markForCheck();
        },
        error: () => {},
      });
    });
  }

  openLightbox(record: ProofRecordDto, photoIndex: number): void {
    const photo = record.photos[photoIndex];
    if (!photo) return;
    const url = this.thumbnailUrls().get(photo.id);
    if (!url) return;
    this.lightboxPhoto.set({ url, photoIndex, recordId: record.id });
    this.cdr.markForCheck();
  }

  closeLightbox(): void {
    this.lightboxPhoto.set(null);
    this.cdr.markForCheck();
  }

  prevPhoto(): void {
    const lb = this.lightboxPhoto();
    if (!lb) return;
    const record = this.records().find((r) => r.id === lb.recordId);
    if (!record || record.photos.length === 0) return;
    const newIndex = (lb.photoIndex - 1 + record.photos.length) % record.photos.length;
    const photo = record.photos[newIndex];
    const url = this.thumbnailUrls().get(photo.id);
    if (url) {
      this.lightboxPhoto.set({ url, photoIndex: newIndex, recordId: lb.recordId });
      this.cdr.markForCheck();
    }
  }

  nextPhoto(): void {
    const lb = this.lightboxPhoto();
    if (!lb) return;
    const record = this.records().find((r) => r.id === lb.recordId);
    if (!record || record.photos.length === 0) return;
    const newIndex = (lb.photoIndex + 1) % record.photos.length;
    const photo = record.photos[newIndex];
    const url = this.thumbnailUrls().get(photo.id);
    if (url) {
      this.lightboxPhoto.set({ url, photoIndex: newIndex, recordId: lb.recordId });
      this.cdr.markForCheck();
    }
  }

  downloadCurrentPhoto(): void {
    const lb = this.lightboxPhoto();
    if (!lb) return;
    const record = this.records().find((r) => r.id === lb.recordId);
    if (!record) return;
    const photo = record.photos[lb.photoIndex];
    if (!photo) return;
    this.downloadPhoto(record.id, photo);
  }

  downloadPhoto(recordId: string, photo: ProofPhotoDto): void {
    this.proofRecordService.getPhoto(this.applicationId(), recordId, photo.id).subscribe({
      next: (blob) => this.triggerBlobDownload(blob, photo.fileName),
      error: () => {
        this.snackBar.open('A fénykép letöltése sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  downloadAll(record: ProofRecordDto): void {
    this.downloadingAll.set(record.id);
    this.cdr.markForCheck();
    this.proofRecordService.downloadAll(this.applicationId(), record.id).subscribe({
      next: (blob) => {
        this.downloadingAll.set(null);
        this.triggerBlobDownload(blob, `igazolasok-${record.id}.zip`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.downloadingAll.set(null);
        this.snackBar.open('A letöltés sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  fileSizeLabel(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadRecords(): void {
    this.proofRecordService.getProofRecords(this.applicationId()).subscribe({
      next: (records) => {
        this.records.set(records);
        this.loading.set(false);
        records.forEach((r) => this.loadThumbnailsForRecord(r));
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni az igazolásokat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private revokeAllUrls(): void {
    this.thumbnailUrls().forEach((url) => URL.revokeObjectURL(url));
  }
}
