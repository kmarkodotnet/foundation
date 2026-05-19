import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';

@Component({
  selector: 'gm-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly isRedirecting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'inactive') {
      this.errorMessage.set('A fiókod inaktív. Kérj segítséget az adminisztrátortól.');
    } else if (error === 'auth_failed') {
      this.errorMessage.set('Bejelentkezés sikertelen. Kérjük, próbálja újra.');
    }
  }

  login(): void {
    this.isRedirecting.set(true);
    this.authService.initiateGoogleLogin();
  }
}
