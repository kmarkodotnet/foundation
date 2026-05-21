import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateVendorContractRequest, VendorContract } from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VendorContractService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getContracts(appId: string): Observable<VendorContract[]> {
    return this.http.get<VendorContract[]>(`${this.base}/${appId}/vendor-contracts`);
  }

  createContract(appId: string, data: CreateVendorContractRequest): Observable<VendorContract> {
    return this.http.post<VendorContract>(`${this.base}/${appId}/vendor-contracts`, data);
  }

  deleteContract(appId: string, contractId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${appId}/vendor-contracts/${contractId}`);
  }
}
