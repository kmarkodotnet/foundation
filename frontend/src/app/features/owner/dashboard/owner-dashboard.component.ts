import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnerDashboardService } from '../services/owner-dashboard.service';
import { ScopeService } from '../../../core/auth/scope.service';
import { FoundationDashboardItem, OwnerDashboardResponse } from '../models/owner-dashboard.model';

@Component({
  selector: 'gm-owner-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe],
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Owner áttekintés</h1>
        <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon></button>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else if (dashboard()) {
        <div class="summary-row">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">Összesen nyert</div>
              <div class="summary-value">{{ dashboard()!.totalWonAmount | currency:'HUF':'symbol':'0.0-0':'hu' }}</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">Elszámolatlan</div>
              <div class="summary-value">{{ dashboard()!.totalUnaccounted | currency:'HUF':'symbol':'0.0-0':'hu' }}</div>
            </mat-card-content>
          </mat-card>
        </div>

        <h2>Alapítványok</h2>
        <div class="foundation-grid">
          @for (f of dashboard()!.foundations; track f.id) {
            <mat-card class="foundation-card">
              <mat-card-header>
                <mat-card-title>{{ f.name }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="stats-row">
                  <div class="stat"><span class="stat-label">Folyamatban</span><span class="stat-value">{{ f.inProgress }}</span></div>
                  <div class="stat"><span class="stat-label">Beadva</span><span class="stat-value">{{ f.submitted }}</span></div>
                  <div class="stat"><span class="stat-label">Nyert</span><span class="stat-value won">{{ f.won }}</span></div>
                  <div class="stat"><span class="stat-label">Elveszett</span><span class="stat-value lost">{{ f.lost }}</span></div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-flat-button color="primary" (click)="enterFoundation(f)">Belépés</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .summary-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 200px; }
    .summary-label { font-size: 13px; color: #666; margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; }
    .foundation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .foundation-card {}
    .stats-row { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; align-items: center; min-width: 48px; }
    .stat-label { font-size: 11px; color: #888; }
    .stat-value { font-size: 20px; font-weight: 600; }
    .stat-value.won { color: #2e7d32; }
    .stat-value.lost { color: #c62828; }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  private readonly dashboardService = inject(OwnerDashboardService);
  private readonly scopeService = inject(ScopeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly dashboard = signal<OwnerDashboardResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dashboardService.getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.dashboard.set(data); this.loading.set(false); },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Nem sikerült betölteni a dashboardot.', 'Újra', { duration: 5000 });
        },
      });
  }

  enterFoundation(f: FoundationDashboardItem): void {
    this.scopeService.switchFoundation(f.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/applications']).then(() => window.location.reload()),
        error: () => this.snackBar.open('Sikertelen scope-váltás.', 'OK', { duration: 3000 }),
      });
  }
}
