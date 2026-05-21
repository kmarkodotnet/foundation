import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApplicationDetail,
  ApproveStepRequest,
  RecordSettlementRequest,
  SettlementDto,
} from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettlementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getSettlement(appId: string): Observable<SettlementDto | null> {
    return this.http.get<SettlementDto | null>(`${this.base}/${appId}/settlement`);
  }

  saveSettlement(appId: string, data: RecordSettlementRequest): Observable<SettlementDto> {
    return this.http.put<SettlementDto>(`${this.base}/${appId}/settlement`, data);
  }

  requestApproval(appId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${appId}/settlement/request-approval`, {});
  }

  approveSettlement(appId: string, data: ApproveStepRequest): Observable<ApplicationDetail> {
    return this.http.post<ApplicationDetail>(`${this.base}/${appId}/settlement/approve`, data);
  }
}
