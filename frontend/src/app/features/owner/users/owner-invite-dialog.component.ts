import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnerUserService } from '../services/owner-user.service';
import { OwnerFoundationService } from '../services/owner-foundation.service';
import { FoundationListItem } from '../models/foundation.model';
import { FoundationRole } from '../models/owner-user.model';

@Component({
  selector: 'gm-owner-invite-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Owner-szintű felhasználó meghívása</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="owner-invite-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail cím</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Az e-mail kötelező.</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>Érvénytelen e-mail cím.</mat-error>
          }
          @if (form.controls.email.hasError('emailTaken')) {
            <mat-error>Ez az e-mail más Owner-hez tartozik.</mat-error>
          }
        </mat-form-field>

        <h4 class="section-title">Foundation-hozzárendelések</h4>

        <div formArrayName="foundationAssignments">
          @for (ctrl of assignmentsArray.controls; track $index; let i = $index) {
            <div [formGroupName]="i" class="assignment-row">
              <mat-form-field appearance="outline" class="flex-field">
                <mat-label>Alapítvány</mat-label>
                <mat-select formControlName="foundationId">
                  @for (f of activeFoundations(); track f.id) {
                    <mat-option [value]="f.id">{{ f.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="role-field">
                <mat-label>Szerepkör</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="FoundationAdmin">FoundationAdmin</mat-option>
                  <mat-option value="Megtekinto">Megtekintő</mat-option>
                </mat-select>
              </mat-form-field>
              <button
                mat-icon-button
                color="warn"
                type="button"
                [disabled]="assignmentsArray.length <= 1"
                (click)="removeRow(i)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>

        <button mat-button type="button" (click)="addRow()">
          <mat-icon>add</mat-icon>
          Hozzáad
        </button>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Mégsem</button>
      <button
        mat-flat-button
        color="primary"
        form="owner-invite-form"
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Meghívás }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; display: block; margin-bottom: 8px; }
    .section-title { margin: 8px 0 4px; font-size: 14px; font-weight: 500; }
    .assignment-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 4px; }
    .flex-field { flex: 2; }
    .role-field { flex: 1; }
  `],
})
export class OwnerInviteDialogComponent implements OnInit {
  private readonly service = inject(OwnerUserService);
  private readonly foundationService = inject(OwnerFoundationService);
  private readonly dialogRef = inject(MatDialogRef<OwnerInviteDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly activeFoundations = signal<FoundationListItem[]>([]);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    foundationAssignments: new FormArray([this.createRow()]),
  });

  get assignmentsArray(): FormArray {
    return this.form.get('foundationAssignments') as FormArray;
  }

  ngOnInit(): void {
    this.foundationService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.activeFoundations.set(data.filter((f) => f.status === 'Active')));
  }

  private createRow() {
    return new FormGroup({
      foundationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      role: new FormControl<FoundationRole>('FoundationAdmin', { nonNullable: true, validators: [Validators.required] }),
    });
  }

  addRow(): void {
    this.assignmentsArray.push(this.createRow());
  }

  removeRow(index: number): void {
    if (this.assignmentsArray.length > 1) {
      this.assignmentsArray.removeAt(index);
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.service.invite({
      email: v.email,
      foundationAssignments: v.foundationAssignments as { foundationId: string; role: FoundationRole }[],
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Meghívó elküldve.', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (err?.status === 409) {
            this.form.controls.email.setErrors({ emailTaken: true });
          }
        },
      });
  }
}
