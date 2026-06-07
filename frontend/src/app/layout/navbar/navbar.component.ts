import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';

@Component({
  selector: 'gm-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    NotificationBellComponent,
    GlobalSearchComponent,
  ],
  template: `
    <mat-toolbar color="primary">
      @if (isMobile()) {
        <button mat-icon-button aria-label="Navigáció megnyitása" (click)="menuToggle.emit()">
          <mat-icon>menu</mat-icon>
        </button>
      }
      <span class="gm-navbar-title">Pályázatkezelő</span>
      <span class="gm-spacer"></span>
      @if (!isMobile()) {
        <gm-global-search />
      }
      <gm-notification-bell />
      <button mat-icon-button [matMenuTriggerFor]="profileMenu" aria-label="Profil menü">
        <mat-icon>account_circle</mat-icon>
      </button>
    </mat-toolbar>

    <mat-menu #profileMenu="matMenu" xPosition="before">
      <div class="gm-profile-header">
        <mat-icon class="gm-profile-avatar">account_circle</mat-icon>
        <div>
          <div class="gm-profile-name">{{ authService.currentUser()?.name }}</div>
          <div class="gm-profile-email">{{ authService.currentUser()?.email }}</div>
        </div>
      </div>
      <mat-divider />
      <a mat-menu-item routerLink="/profile">
        <mat-icon>account_circle</mat-icon>
        <span>Profil</span>
      </a>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Kijelentkezés</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .gm-spacer { flex: 1 1 auto; }
    .gm-navbar-title { font-size: 1.1rem; font-weight: 500; }
    .gm-profile-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      min-width: 220px;
    }
    .gm-profile-avatar { font-size: 40px; width: 40px; height: 40px; color: var(--mat-sys-primary); }
    .gm-profile-name { font-weight: 600; font-size: 14px; }
    .gm-profile-email { font-size: 12px; color: var(--mat-sys-on-surface-variant); }
  `],
})
export class NavbarComponent {
  readonly isMobile = input(false);
  readonly menuToggle = output<void>();
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
