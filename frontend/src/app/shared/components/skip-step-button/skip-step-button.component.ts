import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkflowService } from '../../../features/applications/services/workflow.service';
import { WorkflowStepDetail } from '../../../features/applications/models/application.model';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { SkipReasonDialogComponent } from './skip-reason-dialog/skip-reason-dialog.component';

@Component({
  selector: 'gm-skip-step-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
  ],
  template: `
    <div class="skip-step-actions">
      @if (stepStatus() === 'Active' || stepStatus() === 'Pending') {
        <button
          mat-stroked-button
          color="warn"
          [disabled]="loading()"
          (click)="openSkipDialog()"
          *hasRole="['Admin', 'PalyazatiMunkatars']"
        >
          <mat-icon>skip_next</mat-icon>
          Lépés kihagyása
        </button>
      }
      @if (stepStatus() === 'Skipped') {
        <div class="skip-info">
          @if (skippedReason()) {
            <span class="skip-reason">Kihagyás indoka: <em>{{ skippedReason() }}</em></span>
          }
          <button
            mat-stroked-button
            [disabled]="loading()"
            (click)="restore()"
            *hasRole="['Admin', 'Elnok']"
          >
            @if (loading()) {
              <mat-progress-spinner diameter="18" mode="indeterminate" />
            } @else {
              <ng-container>
                <mat-icon>restore</mat-icon>
                Visszaállítás
              </ng-container>
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .skip-step-actions { margin-top: 12px; }
    .skip-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .skip-reason { color: rgba(0,0,0,0.6); font-size: 0.875rem; }
  `],
})
export class SkipStepButtonComponent {
  readonly applicationId = input.required<string>();
  readonly stepType = input.required<string>();
  readonly stepStatus = input.required<string>();
  readonly skippedReason = input<string | null>(null);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly workflowService = inject(WorkflowService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);

  openSkipDialog(): void {
    const ref = this.dialog.open(SkipReasonDialogComponent);
    ref.afterClosed().subscribe((result: { confirmed: boolean; reason?: string } | undefined) => {
      if (result?.confirmed) {
        this.skip(result.reason);
      }
    });
  }

  private skip(reason?: string): void {
    this.loading.set(true);
    this.workflowService.skipStep(this.applicationId(), this.stepType(), { skipReason: reason }).subscribe({
      next: (detail) => {
        this.loading.set(false);
        this.stepUpdated.emit(detail);
        this.snackBar.open('Lépés kihagyva.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült kihagyni a lépést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  restore(): void {
    this.loading.set(true);
    this.workflowService.restoreStep(this.applicationId(), this.stepType()).subscribe({
      next: (detail) => {
        this.loading.set(false);
        this.stepUpdated.emit(detail);
        this.snackBar.open('Lépés visszaállítva.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült visszaállítani a lépést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
