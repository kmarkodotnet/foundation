import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { EmailService } from '../../../features/applications/services/email.service';
import {
  CreateEmailRequest,
  EmailRecordDto,
  EmlPreviewDto,
} from '../../../features/applications/models/application.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';
import { EmlPreviewDialogComponent } from './eml-preview-dialog.component';

@Component({
  selector: 'gm-email-record',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './email-record.component.html',
  styleUrl: './email-record.component.scss',
})
export class EmailRecordComponent implements OnInit {
  readonly appId = input.required<string>();
  readonly stepId = input<string | undefined>(undefined);
  readonly isLocked = input(false);

  private readonly emailService = inject(EmailService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly uploading = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly emails = signal<EmailRecordDto[]>([]);

  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? '');
  readonly currentUserRole = computed(() => this.authService.currentUser()?.role ?? '');

  readonly canWrite = computed(() => {
    const role = this.currentUserRole();
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly emailForm = new FormGroup({
    subject: new FormControl<string>('', [Validators.required]),
    senderEmail: new FormControl<string>('', [Validators.required, Validators.email]),
    sentDate: new FormControl<Date | null>(null, [Validators.required]),
    direction: new FormControl<string | null>(null, [Validators.required]),
    contentSummary: new FormControl<string>(''),
  });

  selectedFile: File | null = null;

  ngOnInit(): void {
    this.loadEmails();
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.emailForm.reset();
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  cancelAddForm(): void {
    this.showAddForm.set(false);
    this.emailForm.reset();
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.selectedFile = null;
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'eml' && ext !== 'msg') {
      this.snackBar.open('Csak .eml vagy .msg fájl tölthető fel.', 'Bezár', {
        duration: 4000,
        panelClass: ['gm-snack-error'],
      });
      input.value = '';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  submitEmail(): void {
    if (this.emailForm.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.emailForm.getRawValue();
    const sentDate = v.sentDate
      ? (v.sentDate as Date).toISOString().substring(0, 10)
      : '';

    const payload: CreateEmailRequest = {
      subject: v.subject!,
      senderEmail: v.senderEmail!,
      sentDate,
      direction: v.direction as 'In' | 'Out',
      contentSummary: v.contentSummary || undefined,
      workflowStepId: this.stepId(),
    };

    this.emailService.createEmail(this.appId(), payload).subscribe({
      next: (record) => {
        this.saving.set(false);
        const file = this.selectedFile;
        if (file) {
          this.attachFileToRecord(record.id, file, () => {
            this.finishAdd();
          });
        } else {
          this.emails.update((list) => [record, ...list]);
          this.finishAdd();
        }
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült rögzíteni az e-mailt.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  private attachFileToRecord(emailId: string, file: File, onDone: () => void): void {
    const formData = new FormData();
    formData.append('file', file);
    this.emailService.attachFile(this.appId(), emailId, formData).subscribe({
      next: (updated) => {
        this.emails.update((list) => [updated, ...list]);
        onDone();
      },
      error: () => {
        this.loadEmails();
        this.snackBar.open('E-mail rögzítve, de a fájl feltöltése sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        onDone();
      },
    });
  }

  private finishAdd(): void {
    this.cancelAddForm();
    this.snackBar.open('E-mail rekord rögzítve.', 'Bezár', { duration: 4000 });
    this.cdr.markForCheck();
  }

  uploadAttachment(email: EmailRecordDto): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.eml,.msg';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'eml' && ext !== 'msg') {
        this.snackBar.open('Csak .eml vagy .msg fájl tölthető fel.', 'Bezár', {
          duration: 4000,
          panelClass: ['gm-snack-error'],
        });
        return;
      }
      this.uploading.set(email.id);
      const formData = new FormData();
      formData.append('file', file);
      this.emailService.attachFile(this.appId(), email.id, formData).subscribe({
        next: (updated) => {
          this.uploading.set(null);
          this.emails.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
          this.snackBar.open('Fájl csatolva.', 'Bezár', { duration: 4000 });
          this.cdr.markForCheck();
        },
        error: () => {
          this.uploading.set(null);
          this.snackBar.open('A fájl feltöltése sikertelen.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
    };
    input.click();
  }

  openPreview(email: EmailRecordDto): void {
    this.emailService.getPreview(this.appId(), email.id).subscribe({
      next: (preview: EmlPreviewDto) => {
        this.dialog.open(EmlPreviewDialogComponent, {
          width: '640px',
          data: preview,
        });
      },
      error: () => {
        this.snackBar.open('Az előnézet betöltése sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  downloadAttachment(email: EmailRecordDto): void {
    this.emailService.downloadAttachment(this.appId(), email.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = email.attachmentFileName ?? 'email-attachment';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('A letöltés sikertelen.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  canDelete(email: EmailRecordDto): boolean {
    return (
      email.createdByUserId === this.currentUserId() ||
      this.currentUserRole() === 'Admin'
    );
  }

  confirmDelete(email: EmailRecordDto): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'E-mail rekord törlése',
          message: `Biztosan törölni szeretné a következő e-mailt?\n„${email.subject}"`,
          confirmLabel: 'Törlés',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.deleting.set(email.id);
          return this.emailService.deleteEmail(this.appId(), email.id);
        })
      )
      .subscribe({
        next: () => {
          this.deleting.set(null);
          this.emails.update((list) => list.filter((e) => e.id !== email.id));
          this.snackBar.open('E-mail rekord törölve.', 'Bezár', { duration: 4000 });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.deleting.set(null);
          const msg =
            (err?.status as number) === 403
              ? 'Nincs jogosultságod törölni ezt a rekordot.'
              : 'A törlés sikertelen.';
          this.snackBar.open(msg, 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
  }

  directionLabel(direction: string): string {
    return direction === 'In' ? 'Bejövő' : 'Kimenő';
  }

  directionClass(direction: string): string {
    return direction === 'In' ? 'badge-in' : 'badge-out';
  }

  private loadEmails(): void {
    this.emailService.getEmails(this.appId(), this.stepId()).subscribe({
      next: (records) => {
        this.emails.set(records);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni az e-maileket.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }
}
