import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApplicationDetail,
  ApproveStepRequest,
  CorrectResultRequest,
  RecordResultRequest,
  SkipStepRequest,
  UpdateContractStepRequest,
  UpdateSubmissionRequest,
  WorkflowStepDetail,
} from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  updateSubmissionStep(appId: string, data: UpdateSubmissionRequest): Observable<WorkflowStepDetail> {
    return this.http.put<WorkflowStepDetail>(`${this.base}/${appId}/workflow/submission`, data);
  }

  requestApproval(appId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${appId}/workflow/submission/request-approval`, {});
  }

  approveStep(appId: string, stepType: string, data: ApproveStepRequest): Observable<WorkflowStepDetail> {
    return this.http.post<WorkflowStepDetail>(`${this.base}/${appId}/workflow/${stepType}/approve`, data);
  }

  recordResult(appId: string, data: RecordResultRequest): Observable<ApplicationDetail> {
    return this.http.put<ApplicationDetail>(`${this.base}/${appId}/workflow/result`, data);
  }

  closeLost(appId: string): Observable<ApplicationDetail> {
    return this.http.put<ApplicationDetail>(`${this.base}/${appId}/workflow/close-lost`, {});
  }

  correctResult(appId: string, data: CorrectResultRequest): Observable<ApplicationDetail> {
    return this.http.put<ApplicationDetail>(`${this.base}/${appId}/workflow/result/correct`, data);
  }

  updateContractStep(appId: string, data: UpdateContractStepRequest): Observable<WorkflowStepDetail> {
    return this.http.put<WorkflowStepDetail>(`${this.base}/${appId}/workflow/contract-granter`, data);
  }

  skipStep(appId: string, stepType: string, data: SkipStepRequest): Observable<WorkflowStepDetail> {
    return this.http.post<WorkflowStepDetail>(`${this.base}/${appId}/workflow/${stepType}/skip`, data);
  }

  restoreStep(appId: string, stepType: string): Observable<WorkflowStepDetail> {
    return this.http.post<WorkflowStepDetail>(`${this.base}/${appId}/workflow/${stepType}/restore`, {});
  }
}
