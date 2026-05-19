import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminUser, UpdateUserRoleRequest } from '../models/admin-user.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getAll() {
    return this.http.get<AdminUser[]>(this.base);
  }

  updateRole(id: string, request: UpdateUserRoleRequest) {
    return this.http.put(`${this.base}/${id}/role`, request);
  }

  activate(id: string) {
    return this.http.put(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: string) {
    return this.http.put(`${this.base}/${id}/deactivate`, {});
  }
}
