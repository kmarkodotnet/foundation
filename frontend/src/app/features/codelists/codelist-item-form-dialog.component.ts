import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeListItemDto } from './models/codelist.model';
import { CodelistService } from './services/codelist.service';

export interface CodelistItemFormDialogData {
  listId: string;
  item?: CodeListItemDto;
}

@Component({
  selector: 'gm-codelist-item-form-dialog',
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
    <h2 mat-dialog-title>{{ data.item ? 'Elem szerkesztése' : 'Új elem' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Kód</mat-label>
          <input matInput formControlName="code" placeholder="pl. TIPUS_01" />
          @if (form.controls.code.hasError('required')) {
            <mat-error>Kötelező mező</mat-error>
          }
        </mat-form-field>
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
          Mentés
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 380px;
      padding-top: 8px;
    }
    mat-form-field { width: 100%; }
  `],
})
export class CodelistItemFormDialogComponent {
  readonly data = inject<CodelistItemFormDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(CodelistService);
  private readonly dialogRef = inject(MatDialogRef<CodelistItemFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  saving = false;

  readonly form = new FormGroup({
    code: new FormControl(this.data.item?.code ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl(this.data.item?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string | null>(this.data.item?.description ?? null),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const { code, name, description } = this.form.getRawValue();
    const request$ = this.data.item
      ? this.service.updateItem(this.data.listId, this.data.item.id, { code, name, description })
      : this.service.createItem(this.data.listId, { code, name, description });

    request$.subscribe({
      next: (item) => {
        this.saving = false;
        this.dialogRef.close(item);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Hiba történt a mentés során.', 'OK', { duration: 4000 });
      },
    });
  }
}
