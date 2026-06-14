import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface GrantItem { id: string; targetOwnerId: string; status: string; expiresAt: string; }

@Component({
  selector: 'gm-platform-break-glass',
  standalone: true,
  template: `
    <h1>Break-Glass hozzáférés</h1>
    <table>
      <thead><tr><th>Owner</th><th>Státusz</th><th>Lejárat</th><th>Műveletek</th></tr></thead>
      <tbody>
        @for (g of grants(); track g.id) {
          <tr>
            <td>{{ g.targetOwnerId }}</td>
            <td>{{ g.status }}</td>
            <td>{{ g.expiresAt }}</td>
            <td>
              @if (g.status === 'Active') {
                <button (click)="revoke(g.id)">Visszavon</button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PlatformBreakGlassComponent implements OnInit {
  private http = inject(HttpClient);
  readonly grants = signal<GrantItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: GrantItem[] }>(`${environment.apiUrl}/platform/break-glass`)
      .subscribe({ next: (r) => this.grants.set(r?.items ?? []) });
  }

  revoke(id: string): void {
    this.http.post(`${environment.apiUrl}/platform/break-glass/${id}/revoke`, {}).subscribe();
  }
}
