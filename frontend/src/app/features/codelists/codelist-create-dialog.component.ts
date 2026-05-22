import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeListDto } from './models/codelist.model';
import { CodelistService } from './services/codelist.service';

@Component({
  selector: 'gm-codelist-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Új kódszótár</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Név</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Kötelező mező</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Leírás (opcionális)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Mégsem</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        @if (saving) {
          <mat-spinner diameter="20" />
        } @else {
          Létrehozás
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 360px;
      padding-top: 8px;
    }
    mat-form-field { width: 100%; }
  `],
})
export class CodelistCreateDialogComponent {
  private readonly service = inject(CodelistService);
  private readonly dialogRef = inject(MatDialogRef<CodelistCreateDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  saving = false;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string | null>(null),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const { name, description } = this.form.getRawValue();
    this.service.createCodeList({ name, description }).subscribe({
      next: (list: CodeListDto) => {
        this.saving = false;
        this.dialogRef.close(list);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Hiba történt a mentés során.', 'OK', { duration: 4000 });
      },
    });
  }
}
