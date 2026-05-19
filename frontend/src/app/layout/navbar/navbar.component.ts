import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'gm-navbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, NotificationBellComponent],
  template: `
    <mat-toolbar color="primary">
      <span>Pályázatkezelő</span>
      <span class="gm-spacer"></span>
      <gm-notification-bell />
      <span>{{ authService.currentUser()?.name }}</span>
      <button mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`.gm-spacer { flex: 1 1 auto; }`],
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe();
  }
}
