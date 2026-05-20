import { Component, input, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApplicationDetail, WorkflowStep, WorkflowStepDetail, WorkflowStepType } from '../../models/application.model';
import { DateHuPipe } from '../../../../shared/pipes/date-hu.pipe';
import { StepSubmissionComponent } from './step-submission/step-submission.component';
import { ApprovalPanelComponent } from '../../../../shared/components/approval-panel/approval-panel.component';
import { StepResultComponent } from './step-result/step-result.component';
import { StepContractGranterComponent } from './step-contract-granter/step-contract-granter.component';
import { StepBudgetPlanComponent } from './step-budget-plan/step-budget-plan.component';
import { SkipStepButtonComponent } from '../../../../shared/components/skip-step-button/skip-step-button.component';

const STEP_LABELS: Record<WorkflowStepType, string> = {
  Call: '[1] Pályázati felhívás',
  Submission: '[2] Beadás',
  Result: '[3] Eredmény',
  Contract: '[4] Szerz./Pályáztató',
  BudgetPlan: '[5] Költési terv',
  VendorContracts: '[6] Alvállalkozói szerz.',
  Invoices: '[7] Számlák',
  Proof: '[8] Teljesítés igazolása',
  Settlement: '[9] Elszámolás',
};

const STEP_STATUS_ICONS: Record<string, string> = {
  Pending: 'radio_button_unchecked',
  Active: 'play_circle',
  Completed: 'check_circle',
  Skipped: 'skip_next',
  NotApplicable: 'do_not_disturb',
  Locked: 'lock',
};

@Component({
  selector: 'gm-workflow-tab',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    DateHuPipe,
    StepSubmissionComponent,
    ApprovalPanelComponent,
    StepResultComponent,
    StepContractGranterComponent,
    StepBudgetPlanComponent,
    SkipStepButtonComponent,
  ],
  template: `
    <div style="padding:16px">
      <mat-accordion multi>
        @for (step of steps(); track step.id) {
          <mat-expansion-panel [expanded]="step.status === 'Active'">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon [style.color]="stepColor(step.status)">
                  {{ stepIcon(step.status) }}
                </mat-icon>
                <span style="margin-left:8px">{{ stepLabel(step.stepType) }}</span>
              </mat-panel-title>
              <mat-panel-description>
                {{ step.status === 'Completed' ? 'Lezárva: ' + (step.completedAt | dateHu) : '' }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            @if (step.stepType === 'Submission') {
              <gm-step-submission
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
              />
              @if (step.status === 'Active') {
                <gm-approval-panel
                  [applicationId]="applicationId()"
                  stepType="submission"
                  approveSuccessMessage="Beadás jóváhagyva."
                  rejectSuccessMessage="Beadás visszautasítva."
                  (stepApproved)="onStepUpdated($event)"
                />
              }
            } @else if (step.stepType === 'Result') {
              @if (application()) {
                <gm-step-result
                  [applicationId]="applicationId()"
                  [application]="application()!"
                  [step]="step"
                  [isLocked]="isLocked()"
                  (applicationUpdated)="onApplicationUpdated($event)"
                />
              }
            } @else if (step.stepType === 'Contract') {
              @if (application()) {
                <gm-step-contract-granter
                  [applicationId]="applicationId()"
                  [application]="application()!"
                  [step]="step"
                  [isLocked]="isLocked()"
                  (stepUpdated)="onStepUpdated($event)"
                />
              }
              @if (!isLocked() && step.isSkippable) {
                <gm-skip-step-button
                  [applicationId]="applicationId()"
                  [stepType]="step.stepType"
                  [stepStatus]="step.status"
                  [skippedReason]="step.skippedReason"
                  (stepUpdated)="onStepUpdated($event)"
                />
              }
            } @else if (step.stepType === 'BudgetPlan') {
              <gm-step-budget-plan
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
              />
              @if (step.status === 'Active') {
                <gm-approval-panel
                  [applicationId]="applicationId()"
                  stepType="BudgetPlan"
                  approveSuccessMessage="Költési terv jóváhagyva."
                  rejectSuccessMessage="Költési terv visszautasítva."
                  (stepApproved)="onStepUpdated($event)"
                />
              }
              @if (!isLocked() && step.isSkippable) {
                <gm-skip-step-button
                  [applicationId]="applicationId()"
                  [stepType]="step.stepType"
                  [stepStatus]="step.status"
                  [skippedReason]="step.skippedReason"
                  (stepUpdated)="onStepUpdated($event)"
                />
              }
            } @else {
              <p style="color:rgba(0,0,0,0.54)">
                A lépés tartalma itt jelenik majd meg.
              </p>
              @if (!isLocked() && step.isSkippable) {
                <gm-skip-step-button
                  [applicationId]="applicationId()"
                  [stepType]="step.stepType"
                  [stepStatus]="step.status"
                  [skippedReason]="step.skippedReason"
                  (stepUpdated)="onStepUpdated($event)"
                />
              }
            }
          </mat-expansion-panel>
        }
      </mat-accordion>
    </div>
  `,
})
export class WorkflowTabComponent {
  readonly applicationId = input.required<string>();
  readonly application = input<ApplicationDetail | null>(null);
  readonly steps = input<WorkflowStep[]>([]);
  readonly isLocked = input(false);
  readonly stepChanged = output<void>();
  readonly applicationUpdated = output<ApplicationDetail>();

  stepLabel(type: WorkflowStepType): string {
    return STEP_LABELS[type] ?? type;
  }

  stepIcon(status: string): string {
    return STEP_STATUS_ICONS[status] ?? 'radio_button_unchecked';
  }

  stepColor(status: string): string {
    const colors: Record<string, string> = {
      Pending: '#bdbdbd',
      Active: '#1976d2',
      Completed: '#388e3c',
      Skipped: '#f57c00',
      NotApplicable: '#bdbdbd',
      Locked: '#9e9e9e',
    };
    return colors[status] ?? '#bdbdbd';
  }

  onStepUpdated(_detail: WorkflowStepDetail): void {
    this.stepChanged.emit();
  }

  onApplicationUpdated(app: ApplicationDetail): void {
    this.applicationUpdated.emit(app);
  }
}
