import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  VendorDto,
  VendorDetailDto,
  CreateVendorRequest,
  CreateVendorResult,
  UpdateVendorRequest,
} from '../models/vendor.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vendors`;

  getAll(search?: string, includeInactive = false) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http.get<VendorDto[]>(this.base, { params });
  }

  getVendorDetail(id: string) {
    return this.http.get<VendorDetailDto>(`${this.base}/${id}`);
  }

  createVendor(request: CreateVendorRequest) {
    return this.http.post<CreateVendorResult>(this.base, request);
  }

  updateVendor(id: string, request: UpdateVendorRequest) {
    return this.http.put<VendorDetailDto>(`${this.base}/${id}`, request);
  }

  deactivateVendor(id: string) {
    return this.http.patch<VendorDto>(`${this.base}/${id}/deactivate`, null);
  }

  activateVendor(id: string) {
    return this.http.patch<VendorDto>(`${this.base}/${id}/activate`, null);
  }

  create(request: CreateVendorRequest) {
    return this.createVendor(request);
  }
}
