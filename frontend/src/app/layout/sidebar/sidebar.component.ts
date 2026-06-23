import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'gm-sidebar',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <mat-nav-list>

      @if (isPlatform()) {
        <a mat-list-item routerLink="/platform/owners" routerLinkActive="active">
          <mat-icon matListItemIcon>domain</mat-icon>
          <span matListItemTitle>Szervezetek</span>
        </a>
        @if (isPlatformAdmin()) {
          <a mat-list-item routerLink="/platform/users" routerLinkActive="active">
            <mat-icon matListItemIcon>manage_accounts</mat-icon>
            <span matListItemTitle>Platform felhasználók</span>
          </a>
          <a mat-list-item routerLink="/platform/break-glass" routerLinkActive="active">
            <mat-icon matListItemIcon>emergency</mat-icon>
            <span matListItemTitle>Break-glass</span>
          </a>
        }
        <a mat-list-item routerLink="/platform/audit-logs" routerLinkActive="active">
          <mat-icon matListItemIcon>policy</mat-icon>
          <span matListItemTitle>Platform audit napló</span>
        </a>

      } @else if (isOwner()) {
        <a mat-list-item routerLink="/owner/dashboard" routerLinkActive="active">
          <mat-icon matListItemIcon>dashboard</mat-icon>
          <span matListItemTitle>Áttekintés</span>
        </a>
        <a mat-list-item routerLink="/owner/foundations" routerLinkActive="active">
          <mat-icon matListItemIcon>foundation</mat-icon>
          <span matListItemTitle>Alapítványok</span>
        </a>
        @if (isOwnerAdmin()) {
          <a mat-list-item routerLink="/owner/users" routerLinkActive="active">
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle>Szervezet felhasználók</span>
          </a>
        }
        <a mat-list-item routerLink="/owner/audit-logs" routerLinkActive="active">
          <mat-icon matListItemIcon>manage_search</mat-icon>
          <span matListItemTitle>Szervezet audit napló</span>
        </a>

      } @else {
        <a mat-list-item routerLink="/applications" routerLinkActive="active">
          <mat-icon matListItemIcon>folder</mat-icon>
          <span matListItemTitle>Pályázatok</span>
        </a>
        <a mat-list-item routerLink="/granters" routerLinkActive="active">
          <mat-icon matListItemIcon>business</mat-icon>
          <span matListItemTitle>Pályáztatók</span>
        </a>
        <a mat-list-item routerLink="/vendors" routerLinkActive="active">
          <mat-icon matListItemIcon>handshake</mat-icon>
          <span matListItemTitle>Szerződő cégek</span>
        </a>
        <a mat-list-item routerLink="/codelists" routerLinkActive="active">
          <mat-icon matListItemIcon>list</mat-icon>
          <span matListItemTitle>Kódszótárak</span>
        </a>
        @if (isFoundationAdmin()) {
          <a mat-list-item routerLink="/audit" routerLinkActive="active">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>Audit napló</span>
          </a>
          <a mat-list-item routerLink="/admin/users" routerLinkActive="active">
            <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
            <span matListItemTitle>Felhasználók</span>
          </a>
          <a mat-list-item routerLink="/admin/settings" routerLinkActive="active">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Rendszerbeállítások</span>
          </a>
        }
      }

      <a mat-list-item routerLink="/profile" routerLinkActive="active">
        <mat-icon matListItemIcon>account_circle</mat-icon>
        <span matListItemTitle>Profil</span>
      </a>

    </mat-nav-list>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .active { background: rgba(0,0,0,0.08); }
  `],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  // Scope-alapú szekció: JWT scope claim + UserProfileDto role fallback
  readonly isPlatform = computed(() => {
    const scope = this.auth.getCurrentScope();
    const role = this.auth.currentUser()?.role;
    return scope === 'platform'
      || role === 'PlatformAdmin'
      || role === 'PlatformAuditor'
      || this.auth.getJwtPlatformRole() !== null;
  });

  readonly isOwner = computed(() => {
    if (this.isPlatform()) return false;
    const scope = this.auth.getCurrentScope();
    const role = this.auth.currentUser()?.role;
    return scope === 'owner'
      || role === 'OwnerAdmin'
      || this.auth.getJwtOwnerRole() !== null;
  });

  // Finomabb jogosultság-ellenőrzések JWT-ből, NEM UserProfileDto.role-ból
  readonly isPlatformAdmin = computed(() =>
    this.auth.currentUser()?.role === 'PlatformAdmin'
    || this.auth.getJwtPlatformRole() === 'PlatformAdmin'
  );

  readonly isOwnerAdmin = computed(() =>
    this.auth.currentUser()?.role === 'OwnerAdmin'
    || this.auth.getJwtOwnerRole() === 'OwnerAdmin'
  );

  readonly isFoundationAdmin = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Admin' || role === 'FoundationAdmin';
  });
}
