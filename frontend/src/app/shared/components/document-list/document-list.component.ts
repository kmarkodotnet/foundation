import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { DocumentDto, DocumentVersionDto } from '../../../features/applications/models/application.model';
import { DocumentService } from '../../../features/applications/services/document.service';
import { DOCUMENT_TYPE_LABELS } from '../document-upload/document-upload.component';

interface LightboxState {
  url: string;
  fileName: string;
}

@Component({
  selector: 'gm-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit, OnDestroy {
  readonly appId = input.required<string>();
  readonly stepId = input.required<string>();
  readonly isLocked = input(false);
  readonly refreshTrigger = input(0);

  private readonly documentService = inject(DocumentService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly documents = signal<DocumentDto[]>([]);
  readonly includeArchived = signal(false);
  readonly archiving = signal<string | null>(null);
  readonly downloading = signal<string | null>(null);
  readonly loadingVersionsFor = signal<string | null>(null);
  readonly expandedVersionsFor = signal<string | null>(null);
  readonly versions = signal<Map<string, DocumentVersionDto[]>>(new Map());
  readonly lightbox = signal<LightboxState | null>(null);
  readonly lightboxBlobUrl = signal<string | null>(null);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly canArchive = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin';
  });

  readonly visibleDocuments = computed(() =>
    this.documents().filter((d) => this.includeArchived() || !d.isArchived)
  );

  constructor() {
    effect(() => {
      const tick = this.refreshTrigger();
      if (tick > 0) {
        this.load();
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokeLightboxUrl();
  }

  load(): void {
    this.loading.set(true);
    this.documentService.getDocuments(this.appId(), this.stepId(), true).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni a dokumentumokat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  toggleIncludeArchived(): void {
    this.includeArchived.update((v) => !v);
    this.cdr.markForCheck();
  }

  documentTypeLabel(type: string): string {
    return DOCUMENT_TYPE_LABELS[type] ?? type;
  }

  fileSizeLabel(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  fileIcon(contentType: string): string {
    if (contentType === 'application/pdf') return 'picture_as_pdf';
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.includes('word')) return 'description';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'table_chart';
    if (contentType.includes('outlook') || contentType === 'message/rfc822') return 'email';
    return 'insert_drive_file';
  }

  isImage(contentType: string): boolean {
    return contentType === 'image/jpeg' || contentType === 'image/png' || contentType === 'image/tiff';
  }

  isPdf(contentType: string): boolean {
    return contentType === 'application/pdf';
  }

  downloadDocument(doc: DocumentDto): void {
    if (this.downloading() === doc.id) return;
    this.downloading.set(doc.id);
    this.cdr.markForCheck();

    this.documentService.downloadDocument(this.appId(), doc.id).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        this.triggerBlobDownload(blob, doc.fileName);
        this.cdr.markForCheck();
      },
      error: () => {
        this.downloading.set(null);
        this.snackBar.open('A letöltés sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  previewDocument(doc: DocumentDto): void {
    this.documentService.downloadDocument(this.appId(), doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (this.isPdf(doc.contentType)) {
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        } else if (this.isImage(doc.contentType)) {
          this.revokeLightboxUrl();
          this.lightboxBlobUrl.set(url);
          this.lightbox.set({ url, fileName: doc.fileName });
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.snackBar.open('Az előnézet megnyitása sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  closeLightbox(): void {
    this.lightbox.set(null);
    this.revokeLightboxUrl();
    this.cdr.markForCheck();
  }

  confirmArchive(doc: DocumentDto): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Dokumentum archiválása',
          message: `Biztosan archiválja a következő dokumentumot?\n"${doc.displayName ?? doc.fileName}"`,
          confirmLabel: 'Archiválás',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => {
        this.archiving.set(doc.id);
        this.cdr.markForCheck();
        return this.documentService.archiveDocument(this.appId(), doc.id);
      })
    ).subscribe({
      next: () => {
        this.archiving.set(null);
        this.documents.update((list) =>
          list.map((d) => (d.id === doc.id ? { ...d, isArchived: true } : d))
        );
        this.snackBar.open('Dokumentum archiválva.', 'Bezár', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.archiving.set(null);
        this.snackBar.open('Az archiválás sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  toggleVersions(doc: DocumentDto): void {
    const currentlyExpanded = this.expandedVersionsFor();
    if (currentlyExpanded === doc.id) {
      this.expandedVersionsFor.set(null);
      this.cdr.markForCheck();
      return;
    }

    const cached = this.versions().get(doc.id);
    if (cached) {
      this.expandedVersionsFor.set(doc.id);
      this.cdr.markForCheck();
      return;
    }

    this.loadingVersionsFor.set(doc.id);
    this.cdr.markForCheck();

    this.documentService.getVersions(this.appId(), doc.id).subscribe({
      next: (vers) => {
        this.versions.update((map) => {
          const newMap = new Map(map);
          newMap.set(doc.id, vers);
          return newMap;
        });
        this.loadingVersionsFor.set(null);
        this.expandedVersionsFor.set(doc.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingVersionsFor.set(null);
        this.snackBar.open('Nem sikerült betölteni a verzióelőzményeket.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  downloadVersion(docId: string, versionDocId: string, fileName: string): void {
    this.documentService.downloadDocument(this.appId(), versionDocId).subscribe({
      next: (blob) => this.triggerBlobDownload(blob, fileName),
      error: () => {
        this.snackBar.open('A verzió letöltése sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
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

  private revokeLightboxUrl(): void {
    const url = this.lightboxBlobUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.lightboxBlobUrl.set(null);
    }
  }
}
