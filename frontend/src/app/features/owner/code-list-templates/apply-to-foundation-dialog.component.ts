import { ChangeDetectionStrategy, Component, DestroyRef, Inject, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnerCodeListTemplateService } from '../services/owner-code-list-template.service';
import { OwnerFoundationService } from '../services/owner-foundation.service';
import { FoundationListItem } from '../models/foundation.model';

@Component({
  selector: 'gm-apply-to-foundation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Sablon alkalmazása alapítványra</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Alapítvány</mat-label>
        <mat-select [formControl]="foundationControl">
          @for (f of foundations(); track f.id) {
            <mat-option [value]="f.id">{{ f.name }}</mat-option>
          }
        </mat-select>
        @if (foundationControl.hasError('required')) {
          <mat-error>Ki kell választani egy alapítványt.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="foundationControl.invalid || applying()"
        (click)="apply()"
      >
        @if (applying()) { <mat-spinner diameter="18" /> } @else { Alkalmazás }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; }`],
})
export class ApplyToFoundationDialogComponent implements OnInit {
  readonly templateId = inject<string>(MAT_DIALOG_DATA);
  private readonly service = inject(OwnerCodeListTemplateService);
  private readonly foundationService = inject(OwnerFoundationService);
  private readonly dialogRef = inject(MatDialogRef<ApplyToFoundationDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly applying = signal(false);
  readonly foundations = signal<FoundationListItem[]>([]);

  readonly foundationControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  ngOnInit(): void {
    this.foundationService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.foundations.set(data.filter((f) => f.status === 'Active')));
  }

  apply(): void {
    if (this.foundationControl.invalid || this.applying()) return;
    this.applying.set(true);
    this.service.applyToFoundation(this.templateId, { foundationId: this.foundationControl.value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.applying.set(false);
          const msg = result.addedCount === 0
            ? 'Nem volt szükség változtatásra — minden tétel már megvan.'
            : `${result.addedCount} tétel hozzáadva az alapítványhoz.`;
          this.snackBar.open(msg, 'OK', { duration: 4000 });
          this.dialogRef.close(true);
        },
        error: () => this.applying.set(false),
      });
  }
}
