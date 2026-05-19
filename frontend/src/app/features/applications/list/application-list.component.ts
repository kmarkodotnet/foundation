import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationService } from '../services/application.service';
import { ApplicationFilter, ApplicationListItem, ApplicationStatus } from '../models/application.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-application-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    StatusBadgeComponent,
    DateHuPipe,
    CurrencyHuPipe,
    HasRoleDirective,
  ],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly result = signal<PagedResult<ApplicationListItem> | null>(null);

  filter: ApplicationFilter = { page: 1, pageSize: 20 };
  searchText = '';

  readonly columns = ['title', 'status', 'granterName', 'submissionDeadline', 'awardedAmount', 'actions'];

  readonly statusOptions: { value: ApplicationStatus; label: string }[] = [
    { value: 'Draft', label: 'Tervezet' },
    { value: 'InProgress', label: 'Folyamatban' },
    { value: 'Submitted', label: 'Beadva' },
    { value: 'Won', label: 'Nyert' },
    { value: 'Lost', label: 'Nem nyert' },
    { value: 'ClosedWon', label: 'Lezárva (nyert)' },
    { value: 'ClosedLost', label: 'Lezárva (nem nyert)' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getList(this.filter).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.filter = { ...this.filter, page: 1, search: this.searchText };
    this.load();
  }

  onPage(event: PageEvent): void {
    this.filter = { ...this.filter, page: event.pageIndex + 1, pageSize: event.pageSize };
    this.load();
  }

  openDetail(id: string): void {
    this.router.navigate(['/applications', id]);
  }

  createNew(): void {
    this.router.navigate(['/applications', 'new']);
  }
}
