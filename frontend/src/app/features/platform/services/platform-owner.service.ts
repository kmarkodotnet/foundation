import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  OwnerDetails,
  OwnerListItem,
  OwnerStatusResponse,
  ProvisionOwnerRequest,
  ProvisionOwnerResponse,
} from '../models/owner.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformOwnerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/owners`;

  list() {
    return this.http.get<OwnerListItem[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<OwnerDetails>(`${this.base}/${id}`);
  }

  create(request: ProvisionOwnerRequest) {
    return this.http.post<ProvisionOwnerResponse>(this.base, request);
  }

  suspend(id: string) {
    return this.http.post<OwnerStatusResponse>(`${this.base}/${id}/suspend`, {});
  }

  reactivate(id: string) {
    return this.http.post<OwnerStatusResponse>(`${this.base}/${id}/reactivate`, {});
  }

  archive(id: string) {
    return this.http.post<OwnerStatusResponse>(`${this.base}/${id}/archive`, {});
  }
}
