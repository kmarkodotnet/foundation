import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AuditItem { id: number; action: string; entityType: string; createdAt: string; }

@Component({
  selector: 'gm-platform-audit-logs',
  standalone: true,
  template: `
    <h1>Platform audit napló</h1>
    <table>
      <thead><tr><th>Esemény</th><th>Entitás</th><th>Időpont</th></tr></thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <td>{{ item.action }}</td>
            <td>{{ item.entityType }}</td>
            <td>{{ item.createdAt }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PlatformAuditLogsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly items = signal<AuditItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: AuditItem[] }>(`${environment.apiUrl}/platform/audit-logs`)
      .subscribe({ next: (r) => this.items.set(r?.items ?? []) });
  }
}
