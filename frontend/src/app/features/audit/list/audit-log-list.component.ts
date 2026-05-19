import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditService, AuditFilter } from '../services/audit.service';
import { AuditLogEntry } from '../../../shared/components/audit-log-viewer/audit-log-viewer.component';
import { AuditLogViewerComponent } from '../../../shared/components/audit-log-viewer/audit-log-viewer.component';
import { PagedResult } from '../../../shared/models/paged-result.model';

@Component({
  selector: 'gm-audit-log-list',
  imports: [MatCardModule, MatPaginatorModule, MatProgressSpinnerModule, AuditLogViewerComponent],
  template: `
    <div class="gm-page-container">
      <h1>Audit napló</h1>
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <gm-audit-log-viewer [entries]="result()?.items ?? []" />
          </mat-card-content>
        </mat-card>
        @if (result()) {
          <mat-paginator
            [length]="result()!.totalCount"
            [pageSize]="filter.pageSize"
            [pageIndex]="filter.page - 1"
            [pageSizeOptions]="[20, 50, 100]"
            (page)="onPage($event)"
          />
        }
      }
    </div>
  `,
})
export class AuditLogListComponent implements OnInit {
  private readonly service = inject(AuditService);

  readonly loading = signal(false);
  readonly result = signal<PagedResult<AuditLogEntry> | null>(null);
  filter: AuditFilter = { page: 1, pageSize: 50 };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.filter).subscribe({
      next: (data) => { this.result.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.filter = { ...this.filter, page: event.pageIndex + 1, pageSize: event.pageSize };
    this.load();
  }
}
