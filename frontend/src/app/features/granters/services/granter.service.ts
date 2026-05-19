import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Granter, CreateGranterRequest, UpdateGranterRequest } from '../models/granter.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GranterService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/granters`;

  getAll() {
    return this.http.get<Granter[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<Granter>(`${this.base}/${id}`);
  }

  create(request: CreateGranterRequest) {
    return this.http.post<Granter>(this.base, request);
  }

  update(id: string, request: UpdateGranterRequest) {
    return this.http.put<Granter>(`${this.base}/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
