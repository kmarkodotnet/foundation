import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AddTemplateItemRequest,
  ApplyToFoundationRequest,
  ApplyToFoundationResponse,
  CodeListTemplate,
  CodeListTemplateItem,
  UpdateTemplateItemRequest,
} from '../models/code-list-template.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerCodeListTemplateService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/owner/code-list-templates`;

  list() {
    return this.http.get<CodeListTemplate[]>(this.base);
  }

  getItems(templateId: string) {
    return this.http.get<CodeListTemplateItem[]>(`${this.base}/${templateId}`);
  }

  addItem(templateId: string, request: AddTemplateItemRequest) {
    return this.http.post<CodeListTemplateItem>(`${this.base}/${templateId}/items`, request);
  }

  updateItem(templateId: string, itemId: string, request: UpdateTemplateItemRequest) {
    return this.http.put<void>(`${this.base}/${templateId}/items/${itemId}`, request);
  }

  deleteItem(templateId: string, itemId: string) {
    return this.http.delete<void>(`${this.base}/${templateId}/items/${itemId}`);
  }

  applyToFoundation(templateId: string, request: ApplyToFoundationRequest) {
    return this.http.post<ApplyToFoundationResponse>(`${this.base}/${templateId}/apply-to-foundation`, request);
  }
}
