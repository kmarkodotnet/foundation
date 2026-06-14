import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface FoundationSummary { foundationId: string; name: string; activeApplications: number; }
interface DashboardData { ownerName: string; totalApplications: number; foundations: FoundationSummary[]; }

@Component({
  selector: 'gm-owner-dashboard',
  standalone: true,
  template: `
    @if (data()) {
      <h1>{{ data()!.ownerName }} – Dashboard</h1>
      <p>Összes pályázat: {{ data()!.totalApplications }}</p>
      <ul>
        @for (f of data()!.foundations; track f.foundationId) {
          <li>{{ f.name }} — {{ f.activeApplications }} aktív</li>
        }
      </ul>
    } @else {
      <h1>Owner Dashboard</h1>
    }
  `,
})
export class OwnerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  readonly data = signal<DashboardData | null>(null);

  ngOnInit(): void {
    this.http
      .get<DashboardData>(`${environment.apiUrl}/owner/reports/dashboard`)
      .subscribe({ next: (r) => this.data.set(r) });
  }
}
