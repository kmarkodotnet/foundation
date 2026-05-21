import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProofRecordDto } from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProofRecordService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getProofRecords(appId: string): Observable<ProofRecordDto[]> {
    return this.http.get<ProofRecordDto[]>(`${this.base}/${appId}/proof-records`);
  }

  createProofRecord(appId: string, data: FormData): Observable<ProofRecordDto> {
    return this.http.post<ProofRecordDto>(`${this.base}/${appId}/proof-records`, data);
  }

  getPhoto(appId: string, recordId: string, photoId: string): Observable<Blob> {
    return this.http.get(
      `${this.base}/${appId}/proof-records/${recordId}/photos/${photoId}`,
      { responseType: 'blob' }
    );
  }

  downloadAll(appId: string, recordId: string): Observable<Blob> {
    return this.http.get(
      `${this.base}/${appId}/proof-records/${recordId}/photos/download-all`,
      { responseType: 'blob' }
    );
  }
}
