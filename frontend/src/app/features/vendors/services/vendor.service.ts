import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vendor, CreateVendorRequest, UpdateVendorRequest } from '../models/vendor.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vendors`;

  getAll() {
    return this.http.get<Vendor[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<Vendor>(`${this.base}/${id}`);
  }

  create(request: CreateVendorRequest) {
    return this.http.post<Vendor>(this.base, request);
  }

  update(id: string, request: UpdateVendorRequest) {
    return this.http.put<Vendor>(`${this.base}/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
