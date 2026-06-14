import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { OwnerCodeListTemplateService } from '../services/owner-code-list-template.service';
import { ApplyToFoundationDialogComponent } from './apply-to-foundation-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CodeListTemplateItem } from '../models/code-list-template.model';

@Component({
  selector: 'gm-code-list-template-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <button mat-icon-button (click)="back()"><mat-icon>arrow_back</mat-icon></button>
        <h1>Kódszótár-sablon szerkesztése</h1>
        <button mat-stroked-button (click)="applyToFoundation()">
          <mat-icon>publish</mat-icon>
          Alkalmazás alapítványra
        </button>
      </div>

      <mat-card class="add-card">
        <mat-card-content>
          <form [formGroup]="addForm" (ngSubmit)="addItem()" class="add-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Kód (value)</mat-label>
              <input matInput formControlName="value" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Megnevezés (label)</mat-label>
              <input matInput formControlName="label" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="order-field">
              <mat-label>Sorrend</mat-label>
              <input matInput type="number" formControlName="order" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="addForm.invalid || adding()">
              @if (adding()) { <mat-spinner diameter="18" /> } @else { Hozzáad }
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (items().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>list</mat-icon>
                <p>Nincsenek tételek. Adj hozzá egyet a fenti formmal.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="items()" class="full-width">
                <ng-container matColumnDef="order">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let row">{{ row.order }}</td>
                </ng-container>
                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Kód</th>
                  <td mat-cell *matCellDef="let row">{{ row.value }}</td>
                </ng-container>
                <ng-container matColumnDef="label">
                  <th mat-header-cell *matHeaderCellDef>Megnevezés</th>
                  <td mat-cell *matCellDef="let row">{{ row.label }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button color="warn" (click)="deleteItem(row)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .add-card { margin-bottom: 16px; }
    .add-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .add-row mat-form-field { flex: 1; min-width: 120px; }
    .order-field { max-width: 100px; flex: 0 1 100px; }
    .full-width { width: 100%; }
    .gm-empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; color: #888; }
    .gm-empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
  `],
})
export class CodeListTemplateEditorComponent implements OnInit {
  private readonly service = inject(OwnerCodeListTemplateService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly adding = signal(false);
  readonly items = signal<CodeListTemplateItem[]>([]);
  readonly columns = ['order', 'value', 'label', 'actions'];

  private get templateId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly addForm = new FormGroup({
    value: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    order: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getItems(this.templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.items.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  addItem(): void {
    if (this.addForm.invalid || this.adding()) return;
    this.adding.set(true);
    this.service.addItem(this.templateId, this.addForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.adding.set(false);
          this.addForm.reset({ order: (this.items().length + 2) });
          this.load();
        },
        error: () => this.adding.set(false),
      });
  }

  deleteItem(item: CodeListTemplateItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Tétel törlése', message: `Törlöd a(z) "${item.label}" tételt?`, confirmLabel: 'Törlés' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.deleteItem(this.templateId, item.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Tétel törölve.', 'OK', { duration: 2000 });
          this.load();
        });
    });
  }

  applyToFoundation(): void {
    this.dialog.open(ApplyToFoundationDialogComponent, {
      data: this.templateId,
      width: '400px',
    });
  }

  back(): void {
    this.router.navigate(['/owner/code-list-templates']);
  }
}
