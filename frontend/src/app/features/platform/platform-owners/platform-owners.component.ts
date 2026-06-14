import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface OwnerItem { id: string; name: string; status: string; }

@Component({
  selector: 'gm-platform-owners',
  standalone: true,
  template: `
    <h1>Owner-ök kezelése</h1>
    <table>
      <thead><tr><th>Név</th><th>Státusz</th><th>Műveletek</th></tr></thead>
      <tbody>
        @for (o of owners(); track o.id) {
          <tr>
            <td>{{ o.name }}</td>
            <td>{{ o.status }}</td>
            <td><button>Break-Glass</button></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PlatformOwnersComponent implements OnInit {
  private http = inject(HttpClient);
  readonly owners = signal<OwnerItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: OwnerItem[] }>(`${environment.apiUrl}/platform/owners`)
      .subscribe({ next: (r) => this.owners.set(r?.items ?? []) });
  }
}
