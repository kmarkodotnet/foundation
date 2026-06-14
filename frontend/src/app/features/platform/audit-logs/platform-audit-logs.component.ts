import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PlatformAuditLogService } from '../services/platform-audit-log.service';
import { PlatformAuditLogEntry } from '../models/platform-audit-log.model';
import { PagedResult } from '../../../shared/models/paged-result.model';

@Component({
  selector: 'gm-platform-audit-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), DatePipe],
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Platform audit napló</h1>
        <button mat-stroked-button [disabled]="exporting()" (click)="exportCsv()">
          @if (exporting()) { <mat-spinner diameter="18" /> } @else { <mat-icon>download</mat-icon> }
          Export CSV
        </button>
      </div>

      <mat-card class="filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-row" (ngSubmit)="applyFilters()">
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
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Művelet</mat-label>
              <input matInput formControlName="action" />
            </mat-form-field>
            <div class="filter-actions">
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
            @if (entries().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>history</mat-icon>
                <p>Nincs találat a megadott szűrőkre.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="entries()" class="full-width">
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Időpont</th>
                  <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                </ng-container>
                <ng-container matColumnDef="userEmail">
                  <th mat-header-cell *matHeaderCellDef>Felhasználó</th>
                  <td mat-cell *matCellDef="let row">{{ row.userEmail ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="ownerName">
                  <th mat-header-cell *matHeaderCellDef>Owner</th>
                  <td mat-cell *matCellDef="let row">{{ row.ownerName ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="entityType">
                  <th mat-header-cell *matHeaderCellDef>Entitás</th>
                  <td mat-cell *matCellDef="let row">{{ row.entityType }}</td>
                </ng-container>
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef>Művelet</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.isBreakGlass) {
                      <span class="break-glass-badge">
                        <mat-icon class="break-glass-icon">warning</mat-icon>
                        {{ row.action }}
                      </span>
                    } @else {
                      {{ row.action }}
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: columns"
                  [class.break-glass-row]="row.isBreakGlass"
                ></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

        @if (result()) {
          <mat-paginator
            [length]="result()!.totalCount"
            [pageSize]="pageSize"
            [pageIndex]="page - 1"
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
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
    .filter-row mat-form-field { flex: 1; min-width: 160px; }
    .filter-actions { display: flex; gap: 8px; align-items: center; padding-top: 4px; }
    .full-width { width: 100%; }
    .gm-empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; color: #888; }
    .gm-empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .break-glass-row { background: #fff9c4; }
    .break-glass-badge { display: flex; align-items: center; gap: 4px; color: #f57f17; font-weight: 500; }
    .break-glass-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class PlatformAuditLogsComponent implements OnInit {
  private readonly service = inject(PlatformAuditLogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly entries = signal<PlatformAuditLogEntry[]>([]);
  readonly result = signal<PagedResult<PlatformAuditLogEntry> | null>(null);
  readonly columns = ['createdAt', 'userEmail', 'ownerName', 'entityType', 'action'];

  page = 1;
  pageSize = 50;

  readonly filterForm = new FormGroup({
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
    action: new FormControl(''),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const v = this.filterForm.getRawValue();
    this.service.list({
      page: this.page,
      pageSize: this.pageSize,
      dateFrom: v.dateFrom ? v.dateFrom.toISOString() : undefined,
      dateTo: v.dateTo ? v.dateTo.toISOString() : undefined,
      action: v.action || undefined,
    })
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
    this.filterForm.reset();
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
      dateFrom: v.dateFrom ? v.dateFrom.toISOString() : undefined,
      dateTo: v.dateTo ? v.dateTo.toISOString() : undefined,
      action: v.action || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.exporting.set(false);
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const url = URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `platform_audit_${date}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.exporting.set(false),
      });
  }
}
