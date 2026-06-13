import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AuthResultDto, UserProfileDto } from './models/auth-result.model';
import { CurrentUser, UserRole } from './models/user.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'gm_token';
const OAUTH_STATE_KEY = 'gm_oauth_state';
const INVITATION_TOKEN_KEY = 'gm_invitation_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Internal reactive store — holds the raw DTO from the backend / decoded JWT */
  private readonly _profile$ = new BehaviorSubject<UserProfileDto | null>(null);

  /**
   * Signal that exposes the current user as a CurrentUser (legacy shape).
   * All existing templates rely on .name, .email, .role — this mapping keeps them intact.
   */
  private readonly _currentUserSignal = signal<CurrentUser | null>(null);
  readonly currentUser: Signal<CurrentUser | null> = this._currentUserSignal.asReadonly();

  // -----------------------------------------------------------------------
  // Session management
  // -----------------------------------------------------------------------

  restoreSession(): void {
    if (this.isAuthenticated()) {
      const token = this.getToken()!;
      const payload = this.decodeToken(token);
      if (payload) {
        const profile = this.buildProfileFromClaims(payload);
        this.setProfile(profile);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Google OAuth
  // -----------------------------------------------------------------------

  initiateGoogleLogin(): void {
    const state = this.generateNonce();
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: environment.google.clientId,
      redirect_uri: environment.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  handleGoogleCallback(code: string, redirectUri: string): Observable<void> {
    return this.http
      .post<AuthResultDto>(`${environment.apiUrl}/auth/google-callback`, {
        authorizationCode: code,
        redirectUri,
      })
      .pipe(
        tap((result: AuthResultDto) => {
          sessionStorage.setItem(TOKEN_KEY, result.accessToken);
          this.setProfile(result.user);
        }),
        map(() => undefined as void)
      );
  }

  acceptInvitation(code: string, redirectUri: string, invitationToken: string): Observable<void> {
    return this.http
      .post<AuthResultDto>(`${environment.apiUrl}/auth/accept-invitation`, {
        authorizationCode: code,
        redirectUri,
        invitationToken,
      })
      .pipe(
        tap((result: AuthResultDto) => {
          sessionStorage.setItem(TOKEN_KEY, result.accessToken);
          this.setProfile(result.user);
        }),
        map(() => undefined as void)
      );
  }

  storeInvitationToken(token: string): void {
    sessionStorage.setItem(INVITATION_TOKEN_KEY, token);
  }

  getStoredInvitationToken(): string | null {
    return sessionStorage.getItem(INVITATION_TOKEN_KEY);
  }

  clearInvitationToken(): void {
    sessionStorage.removeItem(INVITATION_TOKEN_KEY);
  }

  // -----------------------------------------------------------------------
  // Token helpers
  // -----------------------------------------------------------------------

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const payload = this.decodeToken(token);
    if (!payload || payload['exp'] === undefined) {
      return false;
    }
    return (payload['exp'] as number) > Math.floor(Date.now() / 1000);
  }

  // -----------------------------------------------------------------------
  // Role helpers
  // -----------------------------------------------------------------------

  hasRole(role: UserRole): boolean {
    return this._currentUserSignal()?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const role = this._currentUserSignal()?.role;
    return role !== undefined && roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        this._profile$.next(null);
        this._currentUserSignal.set(null);
        this.router.navigate(['/login']);
      });
  }

  // -----------------------------------------------------------------------
  // OAuth state helpers
  // -----------------------------------------------------------------------

  getStoredOAuthState(): string | null {
    return sessionStorage.getItem(OAUTH_STATE_KEY);
  }

  clearOAuthState(): void {
    sessionStorage.removeItem(OAUTH_STATE_KEY);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private setProfile(profile: UserProfileDto): void {
    this._profile$.next(profile);
    this._currentUserSignal.set({
      userId: profile.id,
      email: profile.email,
      name: profile.fullName,
      role: profile.role as UserRole,
    });
  }

  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private buildProfileFromClaims(payload: Record<string, unknown>): UserProfileDto {
    return {
      id: (payload['sub'] as string | undefined) ?? (payload['userId'] as string | undefined) ?? '',
      email: (payload['email'] as string | undefined) ?? '',
      fullName: (payload['name'] as string | undefined) ?? '',
      role: (payload['role'] as string | undefined) ?? '',
    };
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}
