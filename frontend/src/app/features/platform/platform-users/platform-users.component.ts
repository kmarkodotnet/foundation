import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface PlatformUserItem { id: string; name: string; email: string; role: string; }

@Component({
  selector: 'gm-platform-users',
  standalone: true,
  template: `
    <h1>Felhasználók kezelése</h1>
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
export class PlatformUsersComponent implements OnInit {
  private http = inject(HttpClient);
  readonly users = signal<PlatformUserItem[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ items: PlatformUserItem[] }>(`${environment.apiUrl}/platform/users`)
      .subscribe({ next: (r) => this.users.set(r?.items ?? []) });
  }

  delete(id: string): void {
    this.http.delete(`${environment.apiUrl}/platform/users/${id}`).subscribe();
  }
}
