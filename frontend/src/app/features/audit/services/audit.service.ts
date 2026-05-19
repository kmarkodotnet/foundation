import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditLogEntry } from '../../../shared/components/audit-log-viewer/audit-log-viewer.component';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { environment } from '../../../../environments/environment';

export interface AuditFilter {
  page: number;
  pageSize: number;
  entityType?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-logs`;

  getAll(filter: AuditFilter) {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);
    if (filter.entityType) params = params.set('entityType', filter.entityType);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    return this.http.get<PagedResult<AuditLogEntry>>(this.base, { params });
  }

  getForApplication(applicationId: string) {
    return this.http.get<AuditLogEntry[]>(`${this.base}/applications/${applicationId}`);
  }
}
