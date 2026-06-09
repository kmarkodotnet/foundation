import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationDetail, WorkflowStep, WorkflowStepDetail, WorkflowStepType } from '../../models/application.model';
import { DateHuPipe } from '../../../../shared/pipes/date-hu.pipe';
import { StepSubmissionComponent } from './step-submission/step-submission.component';
import { ApprovalPanelComponent } from '../../../../shared/components/approval-panel/approval-panel.component';
import { StepResultComponent } from './step-result/step-result.component';
import { StepContractGranterComponent } from './step-contract-granter/step-contract-granter.component';
import { StepBudgetPlanComponent } from './step-budget-plan/step-budget-plan.component';
import { StepVendorContractsComponent } from './step-vendor-contracts/step-vendor-contracts.component';
import { StepInvoicesComponent } from './step-invoices/step-invoices.component';
import { StepProofRecordsComponent } from './step-proof-records/step-proof-records.component';
import { StepCallComponent } from './step-call/step-call.component';
import { StepSettlementComponent } from './step-settlement/step-settlement.component';
import { SkipStepButtonComponent } from '../../../../shared/components/skip-step-button/skip-step-button.component';
import { WorkflowService } from '../../services/workflow.service';

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
  styles: [`
    .gm-step-panel-title { display: flex; align-items: center; min-width: 0; flex-wrap: wrap; }
    .gm-step-label { margin-left: 8px; white-space: normal; word-break: break-word; }
    .gm-step-date-chip {
      margin-left: auto;
      font-size: 11px;
      color: #388e3c;
      white-space: nowrap;
      padding-left: 8px;
      flex-shrink: 0;
    }
    .gm-step-completed-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #388e3c;
      padding: 4px 0 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      margin-bottom: 12px;
    }
    .gm-step-completed-bar mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DateHuPipe,
    StepSubmissionComponent,
    ApprovalPanelComponent,
    StepResultComponent,
    StepContractGranterComponent,
    StepBudgetPlanComponent,
    StepCallComponent,
    StepVendorContractsComponent,
    StepInvoicesComponent,
    StepProofRecordsComponent,
    StepSettlementComponent,
    SkipStepButtonComponent,
  ],
  template: `
    <div style="padding:16px">
      <mat-accordion multi>
        @for (step of sortedSteps(); track step.id) {
          <mat-expansion-panel [expanded]="step.status === 'Active'">
            <mat-expansion-panel-header collapsedHeight="auto" expandedHeight="auto">
              <mat-panel-title class="gm-step-panel-title">
                <mat-icon [style.color]="stepColor(step.status)">
                  {{ stepIcon(step.status) }}
                </mat-icon>
                <span class="gm-step-label">{{ stepLabel(step.stepType) }}</span>
                @if (isMobile() && step.status === 'Completed' && step.completedAt) {
                  <span class="gm-step-date-chip">{{ step.completedAt | dateHu: 'short' }}</span>
                }
              </mat-panel-title>
              @if (!isMobile() && step.status === 'Completed') {
                <mat-panel-description>
                  Lezárva: {{ step.completedAt | dateHu }}
                </mat-panel-description>
              }
            </mat-expansion-panel-header>

            @if (isMobile() && step.status === 'Completed' && step.completedAt) {
              <div class="gm-step-completed-bar">
                <mat-icon>check_circle</mat-icon>
                Lezárva: {{ step.completedAt | dateHu }}
              </div>
            }

            @if (step.stepType === 'Call') {
              @if (application()) {
                <gm-step-call
                  [applicationId]="applicationId()"
                  [application]="application()!"
                  [step]="step"
                  [isLocked]="isLocked()"
                />
              }
            } @else if (step.stepType === 'Submission') {
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
            } @else if (step.stepType === 'VendorContracts') {
              <gm-step-vendor-contracts
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
              />
              @if (!isLocked() && step.status === 'Active') {
                <div style="display:flex;gap:8px;padding:8px 0">
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="completing() === step.stepType"
                    (click)="completeStep(step.stepType)"
                  >
                    @if (completing() === step.stepType) {
                      <mat-spinner diameter="18" style="display:inline-block;margin-right:4px" />
                    } @else {
                      <mat-icon>check_circle</mat-icon>
                    }
                    Lépés lezárása
                  </button>
                </div>
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
            } @else if (step.stepType === 'Invoices') {
              <gm-step-invoices
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
              />
              @if (!isLocked() && step.status === 'Active') {
                <div style="display:flex;gap:8px;padding:8px 0">
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="completing() === step.stepType"
                    (click)="completeStep(step.stepType)"
                  >
                    @if (completing() === step.stepType) {
                      <mat-spinner diameter="18" style="display:inline-block;margin-right:4px" />
                    } @else {
                      <mat-icon>check_circle</mat-icon>
                    }
                    Lépés lezárása
                  </button>
                </div>
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
            } @else if (step.stepType === 'Proof') {
              <gm-step-proof-records
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
              />
              @if (!isLocked() && step.status === 'Active') {
                <div style="display:flex;gap:8px;padding:8px 0">
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="completing() === step.stepType"
                    (click)="completeStep(step.stepType)"
                  >
                    @if (completing() === step.stepType) {
                      <mat-spinner diameter="18" style="display:inline-block;margin-right:4px" />
                    } @else {
                      <mat-icon>check_circle</mat-icon>
                    }
                    Lépés lezárása
                  </button>
                </div>
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
            } @else if (step.stepType === 'Settlement') {
              <gm-step-settlement
                [applicationId]="applicationId()"
                [step]="step"
                [isLocked]="isLocked()"
                (stepUpdated)="onStepUpdated($event)"
                (applicationUpdated)="onApplicationUpdated($event)"
              />
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
  private readonly workflowService = inject(WorkflowService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 959px)').pipe(map(r => r.matches)),
    { initialValue: this.breakpointObserver.isMatched('(max-width: 959px)') },
  );

  readonly applicationId = input.required<string>();
  readonly application = input<ApplicationDetail | null>(null);
  readonly steps = input<WorkflowStep[]>([]);
  readonly isLocked = input(false);
  readonly stepChanged = output<void>();
  readonly applicationUpdated = output<ApplicationDetail>();

  readonly completing = signal<string | null>(null);

  readonly sortedSteps = computed(() => [...this.steps()].sort((a, b) => a.order - b.order));

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

  completeStep(stepType: string): void {
    if (this.completing()) return;
    this.completing.set(stepType);
    this.workflowService.completeStep(this.applicationId(), stepType).subscribe({
      next: () => {
        this.completing.set(null);
        this.snackBar.open('Lépés lezárva.', 'Bezár', { duration: 4000 });
        this.stepChanged.emit();
      },
      error: () => {
        this.completing.set(null);
        this.snackBar.open('Nem sikerült lezárni a lépést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  onStepUpdated(_detail: WorkflowStepDetail): void {
    this.stepChanged.emit();
  }

  onApplicationUpdated(app: ApplicationDetail): void {
    this.applicationUpdated.emit(app);
  }
}
