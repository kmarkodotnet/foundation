import { ChangeDetectionStrategy, Component, DestroyRef, Inject, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlatformBreakGlassService } from '../services/platform-break-glass.service';
import { IssueBreakGlassResponse } from '../models/break-glass.model';

export interface BreakGlassIssueDialogData {
  targetOwnerId: string;
  targetOwnerName: string | undefined;
}

@Component({
  selector: 'gm-break-glass-issue-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="warn-header">
      <mat-icon class="warn-icon">warning</mat-icon>
      <h2 mat-dialog-title>Break-glass hozzáférés kiállítása</h2>
    </div>
    <mat-dialog-content>
      <p class="warn-text">
        Ez a művelet auditálásra kerül. A hozzáférés 1 órán belül lejár.
        <br />Owner: <strong>{{ data.targetOwnerName ?? data.targetOwnerId }}</strong>
      </p>
      <form id="bg-issue-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Indoklás</mat-label>
          <textarea
            matInput
            [formControl]="reasonControl"
            rows="4"
            placeholder="Minimum 20 karakter szükséges..."
          ></textarea>
          <mat-hint align="end" [class.warn]="charCount() < 20">
            {{ charCount() }} / 20 min
          </mat-hint>
          @if (reasonControl.hasError('required')) {
            <mat-error>Az indoklás kötelező.</mat-error>
          }
          @if (reasonControl.hasError('minlength')) {
            <mat-error>Legalább 20 karakter szükséges.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="warn"
        form="bg-issue-form"
        type="submit"
        [disabled]="reasonControl.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Megerősítés }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warn-header { display: flex; align-items: center; gap: 8px; padding: 16px 24px 0; }
    .warn-header h2 { margin: 0; }
    .warn-icon { color: #f57f17; font-size: 28px; width: 28px; height: 28px; }
    .warn-text { color: #e65100; margin: 0 0 16px; }
    .full-width { width: 100%; display: block; }
    .warn { color: #f44336; }
  `],
})
export class BreakGlassIssueDialogComponent implements OnInit {
  readonly data = inject<BreakGlassIssueDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(PlatformBreakGlassService);
  private readonly dialogRef = inject(MatDialogRef<BreakGlassIssueDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly charCount = signal(0);

  readonly reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(20)],
  });

  ngOnInit(): void {
    this.reasonControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.charCount.set(v.length));
  }

  submit(): void {
    if (this.reasonControl.invalid || this.saving()) return;
    this.saving.set(true);
    this.service.issueGrant({
      targetOwnerId: this.data.targetOwnerId,
      reason: this.reasonControl.value,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: IssueBreakGlassResponse) => {
          this.saving.set(false);
          this.dialogRef.close(result);
        },
        error: () => this.saving.set(false),
      });
  }
}
