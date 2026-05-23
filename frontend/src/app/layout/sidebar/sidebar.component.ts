import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'gm-sidebar',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule, HasRoleDirective],
  template: `
    <mat-nav-list>
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
      <a mat-list-item routerLink="/audit" routerLinkActive="active" *hasRole="['Admin']">
        <mat-icon matListItemIcon>history</mat-icon>
        <span matListItemTitle>Audit napló</span>
      </a>
      <a mat-list-item routerLink="/admin/users" routerLinkActive="active" *hasRole="['Admin']">
        <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
        <span matListItemTitle>Felhasználók</span>
      </a>
      <a mat-list-item routerLink="/admin/settings" routerLinkActive="active" *hasRole="['Admin']">
        <mat-icon matListItemIcon>settings</mat-icon>
        <span matListItemTitle>Rendszerbeállítások</span>
      </a>
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
  readonly authService = inject(AuthService);
}
