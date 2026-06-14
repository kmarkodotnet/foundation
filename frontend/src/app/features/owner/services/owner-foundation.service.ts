import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AssignFoundationAdminRequest,
  CreateFoundationRequest,
  CreateFoundationResponse,
  FoundationAdmin,
  FoundationDetails,
  FoundationListItem,
} from '../models/foundation.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerFoundationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/owner/foundations`;

  list() {
    return this.http.get<FoundationListItem[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<FoundationDetails>(`${this.base}/${id}`);
  }

  create(request: CreateFoundationRequest) {
    return this.http.post<CreateFoundationResponse>(this.base, request);
  }

  archive(id: string) {
    return this.http.post<{ status: string }>(`${this.base}/${id}/archive`, {});
  }

  getAdmins(id: string) {
    return this.http.get<FoundationAdmin[]>(`${this.base}/${id}/admins`);
  }

  assignAdmin(foundationId: string, request: AssignFoundationAdminRequest) {
    return this.http.post<void>(`${this.base}/${foundationId}/admins`, request);
  }

  revokeAdmin(foundationId: string, userId: string) {
    return this.http.delete<void>(`${this.base}/${foundationId}/admins/${userId}`);
  }
}
