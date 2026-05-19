import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CodeList, CodeListItem, CreateCodeListItemRequest, UpdateCodeListItemRequest } from '../models/codelist.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CodelistService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/codelists`;

  getAll() {
    return this.http.get<CodeList[]>(this.base);
  }

  getItems(codeListId: string) {
    return this.http.get<CodeListItem[]>(`${this.base}/${codeListId}/items`);
  }

  createItem(codeListId: string, request: CreateCodeListItemRequest) {
    return this.http.post<CodeListItem>(`${this.base}/${codeListId}/items`, request);
  }

  updateItem(codeListId: string, itemId: string, request: UpdateCodeListItemRequest) {
    return this.http.put<CodeListItem>(`${this.base}/${codeListId}/items/${itemId}`, request);
  }

  deleteItem(codeListId: string, itemId: string) {
    return this.http.delete(`${this.base}/${codeListId}/items/${itemId}`);
  }

  reorderItems(codeListId: string, orderedIds: string[]) {
    return this.http.put(`${this.base}/${codeListId}/items/reorder`, { orderedIds });
  }
}
