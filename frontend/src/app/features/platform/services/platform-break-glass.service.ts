import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BreakGlassGrantListItem,
  IssueBreakGlassRequest,
  IssueBreakGlassResponse,
  RevokeBreakGlassResponse,
} from '../models/break-glass.model';
import { environment } from '../../../../environments/environment';

const BREAK_GLASS_TOKEN_KEY = 'gm_break_glass_token';

@Injectable({ providedIn: 'root' })
export class PlatformBreakGlassService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/break-glass`;

  list() {
    return this.http.get<BreakGlassGrantListItem[]>(this.base);
  }

  issueGrant(request: IssueBreakGlassRequest) {
    return this.http.post<IssueBreakGlassResponse>(this.base, request);
  }

  revoke(id: string) {
    return this.http.post<RevokeBreakGlassResponse>(`${this.base}/${id}/revoke`, {});
  }

  storeToken(token: string): void {
    localStorage.setItem(BREAK_GLASS_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(BREAK_GLASS_TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(BREAK_GLASS_TOKEN_KEY);
  }
}
