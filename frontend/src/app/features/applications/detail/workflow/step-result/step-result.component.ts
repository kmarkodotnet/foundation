import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { WorkflowService } from '../../../services/workflow.service';
import { ApplicationDetail, DocumentDto, WorkflowStep } from '../../../models/application.model';
import { HasRoleDirective } from '../../../../../shared/directives/has-role.directive';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { CurrencyHuPipe } from '../../../../../shared/pipes/currency-hu.pipe';
import { DateHuPipe } from '../../../../../shared/pipes/date-hu.pipe';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';

@Component({
  selector: 'gm-step-result',
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
    MatRadioModule,
    HasRoleDirective,
    CurrencyHuPipe,
    DateHuPipe,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
  ],
  templateUrl: './step-result.component.html',
})
export class StepResultComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly application = input.required<ApplicationDetail>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly applicationUpdated = output<ApplicationDetail>();

  private readonly workflowService = inject(WorkflowService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly saving = signal(false);
  readonly closing = signal(false);
  readonly correcting = signal(false);
  readonly correctionMode = signal(false);
  readonly docRefreshTick = signal(0);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'Admin');

  readonly canModify = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  private readonly _isWonValue = signal<boolean | null>(null);
  readonly isWonSelected = computed(() => this._isWonValue() === true);
  readonly isLostSelected = computed(() => this._isWonValue() === false);

  readonly form = new FormGroup({
    isWon: new FormControl<boolean | null>(null, [Validators.required]),
    awardedAmount: new FormControl<number | null>(null),
    resultDate: new FormControl<Date | null>(null),
    resultIdentifier: new FormControl(''),
  });

  get canCorrect(): boolean {
    const status = this.application().status;
    return (
      this.isAdmin() &&
      (status === 'Won' || status === 'Lost') &&
      !this.correctionMode()
    );
  }

  get canCloseLost(): boolean {
    return (
      (this.auth.currentUser()?.role === 'Admin' ||
        this.auth.currentUser()?.role === 'Elnok') &&
      this.application().status === 'Lost'
    );
  }

  ngOnInit(): void {
    this.form.controls.isWon.valueChanges.subscribe((v) => {
      this._isWonValue.set(v);
      this.updateConditionalValidators(v);
    });

    if (this.correctionMode()) {
      this.prefillFromApplication();
    }
  }

  private updateConditionalValidators(isWon: boolean | null): void {
    const amountCtrl = this.form.controls.awardedAmount;
    const dateCtrl = this.form.controls.resultDate;

    if (isWon === true) {
      amountCtrl.setValidators([Validators.required, Validators.min(1)]);
      dateCtrl.setValidators([Validators.required]);
    } else {
      amountCtrl.clearValidators();
      amountCtrl.setValue(null);
      dateCtrl.clearValidators();
    }
    amountCtrl.updateValueAndValidity();
    dateCtrl.updateValueAndValidity();
  }

  private prefillFromApplication(): void {
    const app = this.application();
    if (app.awardedAmount != null) {
      this.form.patchValue({
        isWon: true,
        awardedAmount: app.awardedAmount,
        resultDate: app.resultDate ? new Date(app.resultDate) : null,
        resultIdentifier: app.resultIdentifier ?? '',
      });
    } else if (app.status === 'Lost' || app.status === 'Won') {
      this.form.patchValue({
        isWon: app.awardedAmount != null,
        resultDate: app.resultDate ? new Date(app.resultDate) : null,
        resultIdentifier: app.resultIdentifier ?? '',
      });
    }
  }

  openCorrectionMode(): void {
    this.correctionMode.set(true);
    this.prefillFromApplication();
  }

  cancelCorrection(): void {
    this.correctionMode.set(false);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;

    const v = this.form.getRawValue();

    if (v.isWon === false && !this.correctionMode()) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Nem nyert eredmény rögzítése',
          message: 'Biztosan rögzíted a nem nyert eredményt? A lépések [4]–[9] Nem alkalmazható állapotra váltanak.',
          confirmLabel: 'Rögzítés',
        },
      });
      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) this.submitResult();
      });
      return;
    }

    if (v.isWon === false && this.correctionMode() && this.application().status === 'Won') {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Eredmény korrekciója',
          message: 'A módosítás lezárja a folyamat [4]–[9] lépéseit (Nem alkalmazható). Biztosan folytatod?',
          confirmLabel: 'Módosítás',
        },
      });
      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) this.submitCorrection();
      });
      return;
    }

    if (this.correctionMode()) {
      this.submitCorrection();
    } else {
      this.submitResult();
    }
  }

  private submitResult(): void {
    this.saving.set(true);
    const v = this.form.getRawValue();

    const request = {
      isWon: v.isWon!,
      ...(v.awardedAmount != null ? { awardedAmount: v.awardedAmount } : {}),
      ...(v.resultDate ? { resultDate: this.toDateOnly(v.resultDate) } : {}),
      ...(v.resultIdentifier ? { resultIdentifier: v.resultIdentifier } : {}),
    };

    this.workflowService.recordResult(this.applicationId(), request).subscribe({
      next: (app) => {
        this.saving.set(false);
        this.applicationUpdated.emit(app);
        const msg = v.isWon
          ? 'Nyert eredmény rögzítve. A pályázat WON státuszba került.'
          : 'Nem nyert eredmény rögzítve. A pályázat LOST státuszba került.';
        this.snackBar.open(msg, 'Bezár', { duration: 5000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült rögzíteni az eredményt.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  private submitCorrection(): void {
    this.correcting.set(true);
    const v = this.form.getRawValue();

    const request = {
      isWon: v.isWon!,
      ...(v.awardedAmount != null ? { awardedAmount: v.awardedAmount } : {}),
      ...(v.resultDate ? { resultDate: this.toDateOnly(v.resultDate) } : {}),
      ...(v.resultIdentifier ? { resultIdentifier: v.resultIdentifier } : {}),
    };

    this.workflowService.correctResult(this.applicationId(), request).subscribe({
      next: (app) => {
        this.correcting.set(false);
        this.correctionMode.set(false);
        this.applicationUpdated.emit(app);
        this.snackBar.open('Eredmény sikeresen javítva.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.correcting.set(false);
        this.snackBar.open('Nem sikerült javítani az eredményt.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  openCloseLostConfirm(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Pályázat lezárása',
        message: 'Biztosan lezárod a pályázatot CLOSED_LOST állapotba? Minden lépés LOCKED-ra vált.',
        confirmLabel: 'Lezárás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.closing.set(true);
      this.workflowService.closeLost(this.applicationId()).subscribe({
        next: () => {
          this.closing.set(false);
          this.snackBar.open('Pályázat CLOSED_LOST állapotba került.', 'Bezár', { duration: 4000 });
          this.router.navigate(['/applications']);
        },
        error: () => {
          this.closing.set(false);
          this.snackBar.open('Nem sikerült lezárni a pályázatot.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
    });
  }

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
