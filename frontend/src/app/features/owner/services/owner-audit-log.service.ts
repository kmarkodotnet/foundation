import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { environment } from '../../../../environments/environment';

export interface OwnerAuditLogEntry {
  id: number;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  foundationId: string | null;
  foundationName: string | null;
  entityType: string;
  action: string;
  isBreakGlass: boolean;
}

export interface OwnerAuditLogFilter {
  page: number;
  pageSize: number;
  foundationId?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerAuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/owner/audit-logs`;

  list(filter: OwnerAuditLogFilter) {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.foundationId) params = params.set('foundationId', filter.foundationId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get<PagedResult<OwnerAuditLogEntry>>(this.base, { params });
  }

  exportCsv(filter: Omit<OwnerAuditLogFilter, 'page' | 'pageSize'>) {
    let params = new HttpParams();
    if (filter.foundationId) params = params.set('foundationId', filter.foundationId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.action) params = params.set('action', filter.action);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
