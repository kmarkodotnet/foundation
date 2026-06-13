import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AdminUser, Invitation, InvitationStatus, SystemSettings } from '../models/admin-user.model';
import { UserRole } from '../../../core/auth/models/user.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly usersBase = `${environment.apiUrl}/users`;
  private readonly settingsBase = `${environment.apiUrl}/system-settings`;
  private readonly invitationsBase = `${environment.apiUrl}/invitations`;

  getAll(searchTerm?: string, role?: UserRole) {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (role) params = params.set('role', role);
    return this.http.get<AdminUser[]>(this.usersBase, { params });
  }

  updateRole(id: string, role: UserRole) {
    return this.http.put(`${this.usersBase}/${id}/role`, { role });
  }

  activate(id: string) {
    return this.http.put(`${this.usersBase}/${id}/activate`, {});
  }

  deactivate(id: string) {
    return this.http.put(`${this.usersBase}/${id}/deactivate`, {});
  }

  getSettings() {
    return this.http.get<SystemSettings>(this.settingsBase);
  }

  updateSettings(settings: Omit<SystemSettings, 'updatedAt'>) {
    return this.http.put<SystemSettings>(this.settingsBase, settings);
  }

  getInvitations(status?: InvitationStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Invitation[]>(this.invitationsBase, { params });
  }

  createInvitation(email: string, role: UserRole) {
    return this.http.post<Invitation>(this.invitationsBase, { email, role });
  }

  revokeInvitation(id: string) {
    return this.http.put<Invitation>(`${this.invitationsBase}/${id}/revoke`, {});
  }

  resendInvitation(id: string) {
    return this.http.post<Invitation>(`${this.invitationsBase}/${id}/resend`, {});
  }
}
