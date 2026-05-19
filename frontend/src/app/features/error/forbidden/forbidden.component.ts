import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gm-forbidden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="gm-forbidden-container">
      <mat-icon class="gm-forbidden-icon">lock</mat-icon>
      <h1>403 – Hozzáférés megtagadva</h1>
      <p>Nincs jogosultságod ehhez az oldalhoz.</p>
      <a mat-raised-button color="primary" routerLink="/applications">
        Vissza a főoldalra
      </a>
    </div>
  `,
  styles: [`
    .gm-forbidden-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
      text-align: center;
    }
    .gm-forbidden-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--mat-sys-error);
    }
    h1 { margin: 0; font-size: 2rem; }
    p  { color: var(--mat-sys-on-surface-variant); margin: 0; }
  `],
})
export class ForbiddenComponent {}
