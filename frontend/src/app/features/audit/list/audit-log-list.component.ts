import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuditService } from '../services/audit.service';
import {
  ACTION_LABELS,
  AuditAction,
  AuditFilter,
  AuditLogEntry,
  ENTITY_TYPE_OPTIONS,
} from '../models/audit-log.model';
import { AuditLogViewerComponent } from '../../../shared/components/audit-log-viewer/audit-log-viewer.component';
import { PagedResult } from '../../../shared/models/paged-result.model';

@Component({
  selector: 'gm-audit-log-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    AuditLogViewerComponent,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Audit napló</h1>
        <button
          mat-stroked-button
          [disabled]="exporting()"
          (click)="exportCsv()"
          matTooltip="CSV export"
        >
          @if (exporting()) {
            <mat-spinner diameter="18" />
          } @else {
            <mat-icon>download</mat-icon>
          }
          Export CSV
        </button>
      </div>

      <mat-card class="gm-filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="gm-filter-row" (ngSubmit)="applyFilters()">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Entitás típusa</mat-label>
              <mat-select formControlName="entityType">
                <mat-option value="">Mind</mat-option>
                @for (et of entityTypes; track et) {
                  <mat-option [value]="et">{{ et }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Művelet</mat-label>
              <mat-select formControlName="action">
                <mat-option value="">Mind</mat-option>
                @for (a of actionOptions; track a.value) {
                  <mat-option [value]="a.value">{{ a.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Dátumtól</mat-label>
              <input matInput [matDatepicker]="pickerFrom" formControlName="dateFrom" />
              <mat-datepicker-toggle matSuffix [for]="pickerFrom" />
              <mat-datepicker #pickerFrom />
            </mat-form-field>

            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Dátumig</mat-label>
              <input matInput [matDatepicker]="pickerTo" formControlName="dateTo" />
              <mat-datepicker-toggle matSuffix [for]="pickerTo" />
              <mat-datepicker #pickerTo />
            </mat-form-field>

            <div class="gm-filter-actions">
              <button mat-flat-button color="primary" type="submit">Szűrés</button>
              <button mat-button type="button" (click)="resetFilters()">Törlés</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <gm-audit-log-viewer [entries]="entries()" />
          </mat-card-content>
        </mat-card>

        @if (result()) {
          <mat-paginator
            [length]="result()!.totalCount"
            [pageSize]="currentPageSize"
            [pageIndex]="currentPage - 1"
            [pageSizeOptions]="[20, 50, 100]"
            showFirstLastButtons
            (page)="onPage($event)"
          />
        }
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .gm-filter-card { margin-bottom: 16px; }
    .gm-filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
    .gm-filter-row mat-form-field { flex: 1; min-width: 160px; }
    .gm-filter-actions { display: flex; gap: 8px; align-items: center; padding-top: 4px; }
  `],
})
export class AuditLogListComponent implements OnInit {
  private readonly service = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly result = signal<PagedResult<AuditLogEntry> | null>(null);
  readonly entries = signal<AuditLogEntry[]>([]);

  private page = 1;
  private pageSize = 50;

  get currentPage() { return this.page; }
  get currentPageSize() { return this.pageSize; }

  readonly entityTypes = ENTITY_TYPE_OPTIONS;
  readonly actionOptions = Object.entries(ACTION_LABELS).map(([value, label]) => ({
    value: value as AuditAction,
    label,
  }));

  readonly filterForm = new FormGroup({
    entityType: new FormControl(''),
    action: new FormControl<AuditAction | ''>(''),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.load();
  }

  private buildFilter(): AuditFilter {
    const v = this.filterForm.getRawValue();
    return {
      page: this.page,
      pageSize: this.pageSize,
      entityType: v.entityType || undefined,
      action: (v.action as AuditAction) || undefined,
      dateFrom: v.dateFrom ? v.dateFrom.toISOString() : undefined,
      dateTo: v.dateTo ? v.dateTo.toISOString() : undefined,
    };
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.buildFilter())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.entries.set(data.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filterForm.reset({ entityType: '', action: '', dateFrom: null, dateTo: null });
    this.page = 1;
    this.load();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  exportCsv(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    const v = this.filterForm.getRawValue();
    this.service.exportCsv({
      entityType: v.entityType || undefined,
      action: (v.action as AuditAction) || undefined,
      dateFrom: v.dateFrom ? v.dateFrom.toISOString() : undefined,
      dateTo: v.dateTo ? v.dateTo.toISOString() : undefined,
    }).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_naplo_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.exporting.set(false),
    });
  }
}
