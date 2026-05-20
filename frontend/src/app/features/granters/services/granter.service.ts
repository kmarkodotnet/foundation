import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Granter, GranterDetail, CreateGranterRequest, UpdateGranterRequest } from '../models/granter.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GranterService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/granters`;

  getAll(activeOnly = false) {
    const params = activeOnly ? new HttpParams().set('activeOnly', 'true') : undefined;
    return this.http.get<Granter[]>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<GranterDetail>(`${this.base}/${id}`);
  }

  create(request: CreateGranterRequest) {
    return this.http.post<Granter>(this.base, request);
  }

  update(id: string, request: UpdateGranterRequest) {
    return this.http.put<Granter>(`${this.base}/${id}`, request);
  }

  deactivate(id: string) {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }
}
