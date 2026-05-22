import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentDto, DocumentVersionDto } from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getDocuments(appId: string, stepId?: string, includeArchived = false): Observable<DocumentDto[]> {
    let url = `${this.base}/${appId}/documents?includeArchived=${includeArchived}`;
    if (stepId) {
      url += `&stepId=${stepId}`;
    }
    return this.http.get<DocumentDto[]>(url);
  }

  uploadDocument(appId: string, data: FormData): Observable<HttpEvent<DocumentDto>> {
    return this.http.post<DocumentDto>(`${this.base}/${appId}/documents`, data, {
      reportProgress: true,
      observe: 'events',
    });
  }

  downloadDocument(appId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${appId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  uploadVersion(appId: string, documentId: string, data: FormData): Observable<HttpEvent<DocumentDto>> {
    return this.http.post<DocumentDto>(
      `${this.base}/${appId}/documents/${documentId}/versions`,
      data,
      { reportProgress: true, observe: 'events' }
    );
  }

  getVersions(appId: string, documentId: string): Observable<DocumentVersionDto[]> {
    return this.http.get<DocumentVersionDto[]>(
      `${this.base}/${appId}/documents/${documentId}/versions`
    );
  }

  archiveDocument(appId: string, documentId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${appId}/documents/${documentId}/archive`, {});
  }
}
