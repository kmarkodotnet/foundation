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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { WorkflowService } from '../../../services/workflow.service';
import { ApplicationDetail, DocumentDto, WorkflowStep, WorkflowStepDetail } from '../../../models/application.model';
import { HasRoleDirective } from '../../../../../shared/directives/has-role.directive';
import { AuthService } from '../../../../../core/auth/auth.service';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';

@Component({
  selector: 'gm-step-contract-granter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  templateUrl: './step-contract-granter.component.html',
})
export class StepContractGranterComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly application = input.required<ApplicationDetail>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly workflowService = inject(WorkflowService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  readonly saving = signal(false);
  readonly docRefreshTick = signal(0);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  readonly form = new FormGroup({
    contractIdentifier: new FormControl(''),
    contractDate: new FormControl<Date | null>(null),
    notificationReceived: new FormControl(false),
    notificationDate: new FormControl<Date | null>(null),
    complete: new FormControl(false),
  });

  ngOnInit(): void {
    this.prefillFromApplication();

    this.form.controls.notificationReceived.valueChanges.subscribe((checked) => {
      const dateCtrl = this.form.controls.notificationDate;
      if (checked) {
        dateCtrl.setValidators([Validators.required]);
      } else {
        dateCtrl.clearValidators();
        dateCtrl.setValue(null);
      }
      dateCtrl.updateValueAndValidity();
    });

  }

  private prefillFromApplication(): void {
    const app = this.application();
    if (app.granterContractIdentifier || app.granterContractDate || app.granterNotificationReceived != null) {
      this.form.patchValue({
        contractIdentifier: app.granterContractIdentifier ?? '',
        contractDate: app.granterContractDate ? new Date(app.granterContractDate) : null,
        notificationReceived: app.granterNotificationReceived ?? false,
        notificationDate: app.granterNotificationDate ? new Date(app.granterNotificationDate) : null,
      });
    }
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;

    const v = this.form.getRawValue();
    this.saving.set(true);

    const request = {
      contractIdentifier: v.contractIdentifier || undefined,
      contractDate: v.contractDate ? this.toDateOnly(v.contractDate) : undefined,
      notificationReceived: v.notificationReceived ?? false,
      notificationDate: v.notificationDate ? this.toDateOnly(v.notificationDate) : undefined,
      complete: v.complete ?? false,
    };

    this.workflowService.updateContractStep(this.applicationId(), request).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.stepUpdated.emit(detail);
        const msg = v.complete ? 'Szerz./Értesítő lépés lezárva.' : 'Adatok elmentve.';
        this.snackBar.open(msg, 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni az adatokat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
