import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { InvitationPreview, InvitationService } from '../invitation.service';

@Component({
  selector: 'gm-accept-invitation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="accept-invitation-wrapper">
      <mat-card class="accept-invitation-card">
        <mat-card-header>
          <mat-card-title>Meghívó elfogadása</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          } @else if (isLoading()) {
            <div class="spinner-wrapper">
              <mat-spinner diameter="32" />
              <p>Meghívó betöltése...</p>
            </div>
          } @else if (isRedirecting()) {
            <div class="spinner-wrapper">
              <mat-spinner diameter="32" />
              <p>Átirányítás Google bejelentkezéshez...</p>
            </div>
          } @else if (preview()) {
            <div class="invitation-scope-info">
              <p class="scope-description">{{ scopeDescription() }}</p>
              <mat-chip-set>
                <mat-chip [highlighted]="true">{{ scopeBadgeLabel() }}</mat-chip>
                @if (preview()!.role) {
                  <mat-chip>{{ preview()!.role }}</mat-chip>
                }
              </mat-chip-set>
              @if (preview()!.isExpired) {
                <p class="warning-message">Ez a meghívó lejárt. Kérj új meghívót az adminisztrátortól.</p>
              } @else {
                <p class="email-info">E-mail cím: <strong>{{ preview()!.email }}</strong></p>
                <p>Kattints a gombra a Google fiókod összekapcsolásához és a meghívó elfogadásához.</p>
              }
            </div>
          } @else {
            <p>Kattints a gombra a Google fiókod összekapcsolásához és a meghívó elfogadásához.</p>
          }
        </mat-card-content>
        @if (!isRedirecting() && !errorMessage() && !isLoading() && !preview()?.isExpired) {
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="accept()">
              Elfogadás Google-lel
            </button>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styles: [
    `
      .accept-invitation-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .accept-invitation-card {
        max-width: 480px;
        width: 100%;
      }
      .error-message {
        color: var(--mat-sys-error);
      }
      .warning-message {
        color: var(--mat-sys-tertiary);
        font-weight: 500;
      }
      .spinner-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .invitation-scope-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .scope-description {
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
      }
      .email-info {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
        margin: 0;
      }
    `,
  ],
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService);

  readonly isLoading = signal(false);
  readonly isRedirecting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly preview = signal<InvitationPreview | null>(null);

  private invitationToken: string | null = null;

  ngOnInit(): void {
    this.invitationToken = this.route.snapshot.queryParamMap.get('token');
    if (!this.invitationToken) {
      this.errorMessage.set(
        'Érvénytelen meghívó link. Kérj új meghívót az adminisztrátortól.'
      );
      return;
    }

    this.isLoading.set(true);
    this.invitationService.getPreview(this.invitationToken).subscribe({
      next: (p) => {
        this.preview.set(p);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'A meghívó nem található vagy már nem érvényes.'
        );
        this.isLoading.set(false);
      },
    });
  }

  scopeDescription(): string {
    const p = this.preview();
    if (!p) return '';
    switch (p.scope) {
      case 'Foundation':
        return `Ez a meghívó ${p.role ?? 'tag'} szerepkörre szól a${p.foundationName ? ' ' + p.foundationName : 'z alapítványban'}.`;
      case 'Owner':
        return `Ez a meghívó ${p.role ?? 'tag'} szerepkörre szól a${p.ownerName ? ' ' + p.ownerName : 'z szervezetnél'}.`;
      case 'Platform':
        return `Ez a meghívó ${p.role ?? 'tag'} szerepkörre szól a Platform adminisztrációhoz.`;
      default:
        return 'Meghívó a rendszer használatához.';
    }
  }

  scopeBadgeLabel(): string {
    const p = this.preview();
    if (!p) return '';
    switch (p.scope) {
      case 'Foundation':
        return 'Alapítvány';
      case 'Owner':
        return 'Szervezet';
      case 'Platform':
        return 'Platform';
      default:
        return p.scope;
    }
  }

  accept(): void {
    if (!this.invitationToken) return;
    this.isRedirecting.set(true);
    this.authService.storeInvitationToken(this.invitationToken);
    this.authService.initiateGoogleLogin();
  }
}
