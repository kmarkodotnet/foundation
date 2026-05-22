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

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.granterId) params = params.set('granterId', filter.granterId);
    if (filter.applicationTypeId) params = params.set('applicationTypeId', filter.applicationTypeId);
    if (filter.statuses?.length) {
      filter.statuses.forEach((s) => (params = params.append('statuses', s)));
    }
    if (filter.submissionDeadlineFrom) params = params.set('submissionDeadlineFrom', filter.submissionDeadlineFrom);
    if (filter.submissionDeadlineTo) params = params.set('submissionDeadlineTo', filter.submissionDeadlineTo);
    if (filter.awardedAmountMin != null) params = params.set('awardedAmountMin', filter.awardedAmountMin);
    if (filter.awardedAmountMax != null) params = params.set('awardedAmountMax', filter.awardedAmountMax);
    if (filter.includeArchived) params = params.set('includeArchived', true);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);

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

  exportApplications(filter: Omit<ApplicationFilter, 'page' | 'pageSize' | 'sortBy' | 'sortDirection'>) {
    let params = new HttpParams();

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.granterId) params = params.set('granterId', filter.granterId);
    if (filter.applicationTypeId) params = params.set('applicationTypeId', filter.applicationTypeId);
    if (filter.statuses?.length) {
      filter.statuses.forEach((s) => (params = params.append('statuses', s)));
    }
    if (filter.submissionDeadlineFrom) params = params.set('submissionDeadlineFrom', filter.submissionDeadlineFrom);
    if (filter.submissionDeadlineTo) params = params.set('submissionDeadlineTo', filter.submissionDeadlineTo);
    if (filter.awardedAmountMin != null) params = params.set('awardedAmountMin', filter.awardedAmountMin);
    if (filter.awardedAmountMax != null) params = params.set('awardedAmountMax', filter.awardedAmountMax);
    if (filter.includeArchived) params = params.set('includeArchived', true);

    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
