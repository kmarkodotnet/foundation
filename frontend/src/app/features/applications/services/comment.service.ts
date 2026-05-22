import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddCommentRequest, CommentDto } from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getComments(appId: string, workflowStepId?: string): Observable<CommentDto[]> {
    const params: Record<string, string> = {};
    if (workflowStepId) params['stepId'] = workflowStepId;
    return this.http.get<CommentDto[]>(`${this.base}/${appId}/comments`, { params });
  }

  addComment(appId: string, data: AddCommentRequest): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.base}/${appId}/comments`, data);
  }

  updateComment(appId: string, commentId: string, body: string): Observable<CommentDto> {
    return this.http.put<CommentDto>(
      `${this.base}/${appId}/comments/${commentId}`,
      { body }
    );
  }

  deleteComment(appId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${appId}/comments/${commentId}`);
  }
}
