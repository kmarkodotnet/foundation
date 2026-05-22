import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  CodeListDto,
  CodeListItemDto,
  CreateCodeListRequest,
  CreateCodeListItemRequest,
  UpdateCodeListItemRequest,
} from '../models/codelist.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CodelistService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/code-lists`;

  getCodeLists() {
    return this.http.get<CodeListDto[]>(this.base);
  }

  getItems(listId: string, includeInactive = false) {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<CodeListItemDto[]>(`${this.base}/${listId}/items`, { params });
  }

  createCodeList(request: CreateCodeListRequest) {
    return this.http.post<CodeListDto>(this.base, request);
  }

  deleteCodeList(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  createItem(listId: string, request: CreateCodeListItemRequest) {
    return this.http.post<CodeListItemDto>(`${this.base}/${listId}/items`, request);
  }

  updateItem(listId: string, itemId: string, request: UpdateCodeListItemRequest) {
    return this.http.put<CodeListItemDto>(`${this.base}/${listId}/items/${itemId}`, request);
  }

  deactivateItem(listId: string, itemId: string) {
    return this.http.patch(`${this.base}/${listId}/items/${itemId}/deactivate`, {});
  }

  activateItem(listId: string, itemId: string) {
    return this.http.patch(`${this.base}/${listId}/items/${itemId}/activate`, {});
  }

  reorderItems(listId: string, orderedItemIds: string[]) {
    return this.http.put(`${this.base}/${listId}/items/reorder`, { orderedItemIds });
  }
}
