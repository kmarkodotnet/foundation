import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface FoundationItem { id: string; name: string; ownerId: string; status: string; }

@Component({
  selector: 'gm-owner-foundations',
  standalone: true,
  template: `
    <h1>Alapítványok</h1>
    <table>
      <thead><tr><th>Név</th><th>Státusz</th></tr></thead>
      <tbody>
        @for (f of foundations(); track f.id) {
          <tr>
            <td>{{ f.name }}</td>
            <td>{{ f.status }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class OwnerFoundationsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly foundations = signal<FoundationItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: FoundationItem[] }>(`${environment.apiUrl}/owner/foundations`)
      .subscribe({ next: (r) => this.foundations.set(r?.items ?? []) });
  }
}
