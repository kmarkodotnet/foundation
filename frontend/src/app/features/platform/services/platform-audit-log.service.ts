import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PlatformAuditLogEntry, PlatformAuditLogFilter } from '../models/platform-audit-log.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformAuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/audit-logs`;

  list(filter: PlatformAuditLogFilter) {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.ownerId) params = params.set('ownerId', filter.ownerId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get<PagedResult<PlatformAuditLogEntry>>(this.base, { params });
  }

  exportCsv(filter: Omit<PlatformAuditLogFilter, 'page' | 'pageSize'>) {
    let params = new HttpParams();
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.ownerId) params = params.set('ownerId', filter.ownerId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
