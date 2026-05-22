import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditFilter, AuditLogEntry } from '../models/audit-log.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-logs`;

  getAll(filter: AuditFilter) {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.entityType) params = params.set('entityType', filter.entityType);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get<PagedResult<AuditLogEntry>>(this.base, { params });
  }

  getForApplication(applicationId: string) {
    return this.http.get<AuditLogEntry[]>(`${this.base}/application/${applicationId}`);
  }

  exportCsv(filter: Omit<AuditFilter, 'page' | 'pageSize'>) {
    let params = new HttpParams();
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.entityType) params = params.set('entityType', filter.entityType);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
