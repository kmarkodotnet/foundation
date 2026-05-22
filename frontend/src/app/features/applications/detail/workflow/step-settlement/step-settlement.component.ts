import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ApplicationDetail,
  RecordSettlementRequest,
  SettlementDto,
  WorkflowStep,
  WorkflowStepDetail,
} from '../../../models/application.model';
import { SettlementService } from '../../../services/settlement.service';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';

@Component({
  selector: 'gm-step-settlement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  templateUrl: './step-settlement.component.html',
  styleUrl: './step-settlement.component.scss',
})
export class StepSettlementComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();
  readonly applicationUpdated = output<ApplicationDetail>();

  private readonly settlementService = inject(SettlementService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly requestingApproval = signal(false);
  readonly approving = signal(false);
  readonly rejecting = signal(false);
  readonly showRejectionForm = signal(false);
  readonly settlement = signal<SettlementDto | null>(null);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Penzugyes';
  });

  readonly canApprove = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Elnok';
  });

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  readonly settlementForm = new FormGroup({
    settlementDate: new FormControl<Date | null>(null, [Validators.required]),
    description: new FormControl<string>('', [Validators.maxLength(2000)]),
    notes: new FormControl<string>('', [Validators.maxLength(2000)]),
  });

  readonly rejectionNoteControl = new FormControl<string>('', [
    Validators.required,
    Validators.maxLength(2000),
  ]);

  ngOnInit(): void {
    this.loadSettlement();
  }

  saveSettlement(): void {
    if (this.settlementForm.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.settlementForm.getRawValue();
    const settlementDate = (v.settlementDate as Date).toISOString().substring(0, 10);
    const request: RecordSettlementRequest = {
      settlementDate,
      description: v.description || undefined,
      notes: v.notes || undefined,
    };
    this.settlementService.saveSettlement(this.applicationId(), request).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.settlement.set(data);
        this.snackBar.open('Elszámolás adatai elmentve.', 'Bezár', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni az elszámolást.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  requestApproval(): void {
    if (this.requestingApproval()) return;
    this.requestingApproval.set(true);
    this.settlementService.requestApproval(this.applicationId()).subscribe({
      next: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Jóváhagyási kérés elküldve az Elnöknek.', 'Bezár', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Nem sikerült elküldeni a jóváhagyási kérést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  openApprovalConfirm(): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Pályázat lezárása',
          message: 'Biztosan lezárod a pályázatot? Ez után módosítás nem lehetséges.',
          confirmLabel: 'Jóváhagyás és lezárás',
          cancelLabel: 'Mégsem',
        },
      }
    );
    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => this.submitApproval());
  }

  openRejectionForm(): void {
    this.showRejectionForm.set(true);
    this.cdr.markForCheck();
  }

  cancelRejection(): void {
    this.showRejectionForm.set(false);
    this.rejectionNoteControl.reset();
    this.cdr.markForCheck();
  }

  submitApproval(): void {
    if (this.approving()) return;
    this.approving.set(true);
    this.settlementService.approveSettlement(this.applicationId(), { isApproved: true }).subscribe({
      next: (app) => {
        this.approving.set(false);
        this.snackBar.open('Pályázat sikeresen lezárva. CLOSED_WON státusz.', 'Bezár', {
          duration: 5000,
        });
        this.applicationUpdated.emit(app);
        this.cdr.markForCheck();
      },
      error: () => {
        this.approving.set(false);
        this.snackBar.open('Nem sikerült lezárni a pályázatot.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  submitRejection(): void {
    if (this.rejectionNoteControl.invalid || this.rejecting()) return;
    this.rejecting.set(true);
    this.settlementService
      .approveSettlement(this.applicationId(), {
        isApproved: false,
        rejectionNote: this.rejectionNoteControl.value!,
      })
      .subscribe({
        next: (app) => {
          this.rejecting.set(false);
          this.showRejectionForm.set(false);
          this.rejectionNoteControl.reset();
          this.snackBar.open('Elszámolás visszautasítva.', 'Bezár', { duration: 4000 });
          this.applicationUpdated.emit(app);
          this.cdr.markForCheck();
        },
        error: () => {
          this.rejecting.set(false);
          this.snackBar.open('Nem sikerült visszautasítani.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
  }

  private loadSettlement(): void {
    this.settlementService.getSettlement(this.applicationId()).subscribe({
      next: (data) => {
        this.settlement.set(data);
        this.loading.set(false);
        if (data) {
          const date = data.settlementDate ? new Date(data.settlementDate) : null;
          this.settlementForm.patchValue({
            settlementDate: date,
            description: data.description ?? '',
            notes: data.notes ?? '',
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni az elszámolás adatait.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }
}
