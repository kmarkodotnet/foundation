import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ApplicationService } from '../services/application.service';
import { ApplicationDetail } from '../models/application.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { WorkflowTabComponent } from './workflow/workflow-tab.component';

@Component({
  selector: 'gm-application-detail',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    StatusBadgeComponent,
    DateHuPipe,
    CurrencyHuPipe,
    WorkflowTabComponent,
  ],
  templateUrl: './application-detail.component.html',
})
export class ApplicationDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(ApplicationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly application = signal<ApplicationDetail | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getById(this.id()).subscribe({
      next: (app) => {
        this.application.set(app);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/applications']);
  }
}
