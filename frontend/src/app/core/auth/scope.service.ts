import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'gm_token';

export interface FoundationScopeItem {
  foundationId: string;
  foundationName: string;
  role: string;
}

export interface AvailableScopesResponse {
  platformRole: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerRole: string | null;
  foundations: FoundationScopeItem[];
}

export interface ScopeSwitchResponse {
  accessToken: string;
  audience: string;
  foundationId: string | null;
  foundationName: string | null;
}

@Injectable({ providedIn: 'root' })
export class ScopeService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  getAvailableScopes(): Observable<AvailableScopesResponse> {
    return this.http.get<AvailableScopesResponse>(`${environment.apiUrl}/me/available-scopes`);
  }

  switchFoundation(targetFoundationId: string | null): Observable<ScopeSwitchResponse> {
    return this.http.post<ScopeSwitchResponse>(`${environment.apiUrl}/me/scope-switch`, {
      targetFoundationId,
    }).pipe(
      tap((result) => {
        sessionStorage.setItem(TOKEN_KEY, result.accessToken);
      })
    );
  }
}
