import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ApplicationDetail,
  ApplicationFilter,
  ApplicationListItem,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '../models/application.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getList(filter: ApplicationFilter) {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);

    if (filter.search) params = params.set('search', filter.search);
    if (filter.status?.length) params = params.set('status', filter.status.join(','));
    if (filter.granterId) params = params.set('granterId', filter.granterId);
    if (filter.deadlineFrom) params = params.set('deadlineFrom', filter.deadlineFrom);
    if (filter.deadlineTo) params = params.set('deadlineTo', filter.deadlineTo);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDir) params = params.set('sortDir', filter.sortDir);

    return this.http.get<PagedResult<ApplicationListItem>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApplicationDetail>(`${this.base}/${id}`);
  }

  create(request: CreateApplicationRequest) {
    return this.http.post<ApplicationDetail>(this.base, request);
  }

  update(id: string, request: UpdateApplicationRequest) {
    return this.http.put<ApplicationDetail>(`${this.base}/${id}`, request);
  }

  archive(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  exportExcel(filter: Partial<ApplicationFilter>) {
    let params = new HttpParams();
    if (filter.status?.length) params = params.set('status', filter.status.join(','));
    if (filter.granterId) params = params.set('granterId', filter.granterId);
    return this.http.get(`${this.base}/export`, {
      params,
      responseType: 'blob',
    });
  }
}
