import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'gm-profile',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="gm-page-container">
      <h1>Profil</h1>
      @if (authService.currentUser(); as user) {
        <mat-card style="max-width:480px">
          <mat-card-content>
            <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px">
              <mat-icon style="font-size:64px;width:64px;height:64px">account_circle</mat-icon>
              <div>
                <h2 style="margin:0">{{ user.name }}</h2>
                <p style="margin:0; color:rgba(0,0,0,0.54)">{{ user.email }}</p>
              </div>
            </div>
            <p><strong>Szerepkör:</strong> {{ user.role }}</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class ProfileComponent {
  readonly authService = inject(AuthService);
}
