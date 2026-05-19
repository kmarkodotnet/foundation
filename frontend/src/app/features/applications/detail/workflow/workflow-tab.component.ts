import { Component, input, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { WorkflowStep, WorkflowStepType } from '../../models/application.model';
import { DateHuPipe } from '../../../../shared/pipes/date-hu.pipe';

const STEP_LABELS: Record<WorkflowStepType, string> = {
  Call: '[1] Pályázati felhívás',
  Submission: '[2] Beadás',
  Result: '[3] Eredmény',
  ContractGranter: '[4] Szerz./Pályáztató',
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
  imports: [MatExpansionModule, MatIconModule, MatChipsModule, DateHuPipe],
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
            <p style="color:rgba(0,0,0,0.54)">
              A lépés tartalma itt jelenik majd meg.
            </p>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </div>
  `,
})
export class WorkflowTabComponent {
  readonly applicationId = input.required<string>();
  readonly steps = input<WorkflowStep[]>([]);
  readonly stepChanged = output<void>();

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
}
