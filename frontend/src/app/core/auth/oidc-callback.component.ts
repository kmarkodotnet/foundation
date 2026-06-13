import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'gm-oidc-callback',
  imports: [MatProgressSpinnerModule],
  template: `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh">
      <mat-spinner />
    </div>
  `,
})
export class OidcCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const storedState = this.authService.getStoredOAuthState();

    if (!code) {
      this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
      return;
    }

    if (state !== storedState) {
      this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
      return;
    }

    this.authService.clearOAuthState();

    const invitationToken = this.authService.getStoredInvitationToken();
    const call$ = invitationToken
      ? this.authService.acceptInvitation(code, environment.google.redirectUri, invitationToken)
      : this.authService.handleGoogleCallback(code, environment.google.redirectUri);

    if (invitationToken) {
      this.authService.clearInvitationToken();
    }

    call$.subscribe({
      next: () => this.router.navigate(['/applications']),
      error: (err) => {
        const detail: string = err?.error?.detail ?? '';
        if (detail === 'no-invitation') {
          this.router.navigate(['/login'], { queryParams: { error: 'no-invitation' } });
        } else if (detail === 'invitation-expired') {
          this.router.navigate(['/login'], { queryParams: { error: 'invitation-expired' } });
        } else if (detail === 'invitation-revoked') {
          this.router.navigate(['/login'], { queryParams: { error: 'invitation-revoked' } });
        } else if (detail === 'invitation-already-accepted') {
          this.router.navigate(['/login'], { queryParams: { error: 'invitation-already-accepted' } });
        } else if (detail === 'email-mismatch') {
          this.router.navigate(['/login'], { queryParams: { error: 'email-mismatch' } });
        } else if (err?.status === 403) {
          this.router.navigate(['/login'], { queryParams: { error: 'inactive' } });
        } else {
          this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
        }
      },
    });
  }
}
