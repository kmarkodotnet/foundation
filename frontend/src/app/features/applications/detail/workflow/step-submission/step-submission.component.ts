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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { WorkflowService } from '../../../services/workflow.service';
import { DocumentDto, WorkflowStep, WorkflowStepDetail } from '../../../models/application.model';
import { CodelistService } from '../../../../../features/codelists/services/codelist.service';
import { CodeListItem } from '../../../../../features/codelists/models/codelist.model';
import { HasRoleDirective } from '../../../../../shared/directives/has-role.directive';
import { AuthService } from '../../../../../core/auth/auth.service';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';

@Component({
  selector: 'gm-step-submission',
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
    MatSelectModule,
    HasRoleDirective,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
  ],
  templateUrl: './step-submission.component.html',
})
export class StepSubmissionComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly workflowService = inject(WorkflowService);
  private readonly codelistService = inject(CodelistService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  readonly saving = signal(false);
  readonly requestingApproval = signal(false);
  readonly submissionMethods = signal<CodeListItem[]>([]);
  readonly savedDetail = signal<WorkflowStepDetail | null>(null);
  readonly docRefreshTick = signal(0);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly form = new FormGroup({
    submittedAt: new FormControl<Date | null>(null, [Validators.required]),
    submissionMethodId: new FormControl<string | null>(null),
    externalIdentifier: new FormControl(''),
    notes: new FormControl(''),
  });

  ngOnInit(): void {
    this.codelistService.getAll().subscribe({
      next: (lists) => {
        const submissionList = lists.find((l) =>
          l.name.toLowerCase().includes('beadás') || l.name.toLowerCase().includes('beadas')
        );
        if (submissionList) {
          this.codelistService.getItems(submissionList.id).subscribe({
            next: (items) => this.submissionMethods.set(items),
          });
        }
      },
    });
  }

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  get hasData(): boolean {
    return this.savedDetail() != null || this.form.value.submittedAt != null;
  }

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const submittedAt = v.submittedAt!;
    submittedAt.setHours(23, 59, 59, 0);

    this.workflowService.updateSubmissionStep(this.applicationId(), {
      submittedAt: submittedAt.toISOString(),
      ...(v.submissionMethodId ? { submissionMethodId: v.submissionMethodId } : {}),
      ...(v.externalIdentifier ? { externalIdentifier: v.externalIdentifier } : {}),
      ...(v.notes ? { notes: v.notes } : {}),
    }).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.savedDetail.set(detail);
        this.stepUpdated.emit(detail);
        this.snackBar.open('Beadás adatai elmentve.', 'Bezár', {
          duration: 4000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni a beadás adatait.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  requestApproval(): void {
    if (this.requestingApproval()) return;
    this.requestingApproval.set(true);

    this.workflowService.requestApproval(this.applicationId()).subscribe({
      next: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Jóváhagyási kérés elküldve az Elnöknek.', 'Bezár', {
          duration: 4000,
        });
      },
      error: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Nem sikerült elküldeni a jóváhagyási kérést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
