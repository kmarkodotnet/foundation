import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface OwnerUserItem { id: string; name: string; email: string; role: string; ownerId: string; }

@Component({
  selector: 'gm-owner-users',
  standalone: true,
  template: `
    <h1>Felhasználók</h1>
    <table>
      <thead><tr><th>Név</th><th>Email</th><th>Szerepkör</th><th>Műveletek</th></tr></thead>
      <tbody>
        @for (u of users(); track u.id) {
          <tr>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.role }}</td>
            <td><button (click)="delete(u.id)">Törlés</button></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class OwnerUsersComponent implements OnInit {
  private http = inject(HttpClient);
  readonly users = signal<OwnerUserItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: OwnerUserItem[] }>(`${environment.apiUrl}/owner/users`)
      .subscribe({ next: (r) => this.users.set(r?.items ?? []) });
  }

  delete(id: string): void {
    this.http.delete(`${environment.apiUrl}/owner/users/${id}`).subscribe();
  }
}
