import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AssignFoundationRequest, InviteOwnerUserRequest, OwnerUserListItem } from '../models/owner-user.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerUserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/owner/users`;

  list() {
    return this.http.get<OwnerUserListItem[]>(this.base);
  }

  invite(request: InviteOwnerUserRequest) {
    return this.http.post<void>(`${this.base}/invite`, request);
  }

  assignToFoundation(userId: string, request: AssignFoundationRequest) {
    return this.http.post<void>(`${this.base}/${userId}/assignments`, request);
  }

  revokeAssignment(userId: string, foundationId: string) {
    return this.http.delete<void>(`${this.base}/${userId}/assignments/${foundationId}`);
  }
}
