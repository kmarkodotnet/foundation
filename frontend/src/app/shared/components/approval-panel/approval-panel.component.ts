import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkflowService } from '../../../features/applications/services/workflow.service';
import { WorkflowStepDetail } from '../../../features/applications/models/application.model';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'gm-approval-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
  ],
  templateUrl: './approval-panel.component.html',
  styleUrl: './approval-panel.component.scss',
})
export class ApprovalPanelComponent {
  readonly applicationId = input.required<string>();
  readonly stepType = input.required<string>();
  readonly approveSuccessMessage = input('Jóváhagyva.');
  readonly rejectSuccessMessage = input('Visszautasítva.');
  readonly stepApproved = output<WorkflowStepDetail>();

  private readonly workflowService = inject(WorkflowService);
  private readonly snackBar = inject(MatSnackBar);

  readonly approving = signal(false);
  readonly rejecting = signal(false);
  readonly showRejectionForm = signal(false);

  readonly rejectionNoteControl = new FormControl('', [Validators.required]);

  approve(): void {
    if (this.approving()) return;
    this.approving.set(true);

    this.workflowService.approveStep(this.applicationId(), this.stepType(), { isApproved: true }).subscribe({
      next: (detail) => {
        this.approving.set(false);
        this.stepApproved.emit(detail);
        this.snackBar.open(this.approveSuccessMessage(), 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.approving.set(false);
        this.snackBar.open('Nem sikerült jóváhagyni.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  openRejectionForm(): void {
    this.showRejectionForm.set(true);
  }

  cancelRejection(): void {
    this.showRejectionForm.set(false);
    this.rejectionNoteControl.reset();
  }

  submitRejection(): void {
    if (this.rejectionNoteControl.invalid || this.rejecting()) return;
    this.rejecting.set(true);

    this.workflowService.approveStep(this.applicationId(), this.stepType(), {
      isApproved: false,
      rejectionNote: this.rejectionNoteControl.value!,
    }).subscribe({
      next: (detail) => {
        this.rejecting.set(false);
        this.showRejectionForm.set(false);
        this.rejectionNoteControl.reset();
        this.stepApproved.emit(detail);
        this.snackBar.open(this.rejectSuccessMessage(), 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.rejecting.set(false);
        this.snackBar.open('Nem sikerült visszautasítani.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
