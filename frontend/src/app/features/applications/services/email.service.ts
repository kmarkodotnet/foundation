import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEmailRequest,
  EmailRecordDto,
  EmlPreviewDto,
} from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getEmails(appId: string, workflowStepId?: string): Observable<EmailRecordDto[]> {
    const params: Record<string, string> = {};
    if (workflowStepId) params['stepId'] = workflowStepId;
    return this.http.get<EmailRecordDto[]>(`${this.base}/${appId}/emails`, { params });
  }

  createEmail(appId: string, data: CreateEmailRequest): Observable<EmailRecordDto> {
    return this.http.post<EmailRecordDto>(`${this.base}/${appId}/emails`, data);
  }

  attachFile(appId: string, emailId: string, data: FormData): Observable<EmailRecordDto> {
    return this.http.post<EmailRecordDto>(
      `${this.base}/${appId}/emails/${emailId}/attachment`,
      data
    );
  }

  getPreview(appId: string, emailId: string): Observable<EmlPreviewDto> {
    return this.http.get<EmlPreviewDto>(`${this.base}/${appId}/emails/${emailId}/preview`);
  }

  downloadAttachment(appId: string, emailId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${appId}/emails/${emailId}/download`, {
      responseType: 'blob',
    });
  }

  deleteEmail(appId: string, emailId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${appId}/emails/${emailId}`);
  }
}
