import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'gm-accept-invitation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="accept-invitation-wrapper">
      <mat-card class="accept-invitation-card">
        <mat-card-header>
          <mat-card-title>Meghívó elfogadása</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          } @else if (isRedirecting()) {
            <div class="spinner-wrapper">
              <mat-spinner diameter="32" />
              <p>Átirányítás Google bejelentkezéshez...</p>
            </div>
          } @else {
            <p>Kattints a gombra a Google fiókod összekapcsolásához és a meghívó elfogadásához.</p>
          }
        </mat-card-content>
        @if (!isRedirecting() && !errorMessage()) {
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="accept()">
              Elfogadás Google-lel
            </button>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .accept-invitation-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .accept-invitation-card {
      max-width: 400px;
      width: 100%;
    }
    .error-message {
      color: var(--mat-sys-error);
    }
    .spinner-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `],
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isRedirecting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private invitationToken: string | null = null;

  ngOnInit(): void {
    this.invitationToken = this.route.snapshot.queryParamMap.get('token');
    if (!this.invitationToken) {
      this.errorMessage.set('Érvénytelen meghívó link. Kérj új meghívót az adminisztrátortól.');
    }
  }

  accept(): void {
    if (!this.invitationToken) return;
    this.isRedirecting.set(true);
    this.authService.storeInvitationToken(this.invitationToken);
    this.authService.initiateGoogleLogin();
  }
}
