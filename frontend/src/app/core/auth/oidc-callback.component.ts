import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './auth.service';

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
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.setToken(token);
    }
    this.authService
      .loadCurrentUser()
      .subscribe(() => this.router.navigate(['/applications']));
  }
}
