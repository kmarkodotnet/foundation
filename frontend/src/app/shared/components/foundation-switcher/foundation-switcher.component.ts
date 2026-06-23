import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScopeService, AvailableScopesResponse } from '../../../core/auth/scope.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gm-foundation-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    @if (switching()) {
      <mat-spinner diameter="20" />
    } @else if (scopes() && (scopes()!.foundations.length > 1 || scopes()!.ownerRole)) {
      <mat-select
        data-testid="foundation-switcher"
        [value]="selectValue()"
        (valueChange)="onSelect($event)"
        placeholder="Válassz scope-ot"
        class="scope-select"
        panelClass="scope-panel"
      >
        @if (scopes()!.ownerRole) {
          <mat-option [value]="null">
            {{ scopes()!.ownerName ?? 'Owner áttekintés' }}
          </mat-option>
        }
        @for (f of scopes()!.foundations; track f.foundationId) {
          <mat-option [value]="f.foundationId">{{ f.foundationName }}</mat-option>
        }
      </mat-select>
    } @else if (scopes() && scopes()!.foundations.length === 1) {
      <span class="foundation-name">{{ scopes()!.foundations[0].foundationName }}</span>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; }
    .scope-select { min-width: 180px; font-size: 14px; }
    .foundation-name { font-size: 14px; font-weight: 500; padding: 0 8px; }
  `],
})
export class FoundationSwitcherComponent implements OnInit {
  private readonly scopeService = inject(ScopeService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly PLATFORM_SENTINEL = '__platform__';

  readonly switching = signal(false);
  readonly scopes = signal<AvailableScopesResponse | null>(null);
  readonly currentFoundationId = signal<string | null>(null);

  // Platform scope-ban sentinel értéket kötünk, hogy a mat-select érzékelje
  // az "Owner áttekintés" kiválasztását (null → null változást egyébként elnyomná)
  readonly selectValue = computed(() =>
    this.authService.getCurrentScope() === 'platform'
      ? FoundationSwitcherComponent.PLATFORM_SENTINEL
      : this.currentFoundationId()
  );

  ngOnInit(): void {
    this.currentFoundationId.set(this.authService.getCurrentFoundationId());

    this.scopeService.getAvailableScopes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.scopes.set(data),
        error: () => {},
      });
  }

  onSelect(foundationId: string | null): void {
    if (foundationId !== null && foundationId === this.currentFoundationId()) return;
    this.switching.set(true);
    this.scopeService.switchFoundation(foundationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.switching.set(false);
          if (foundationId === null) {
            this.router.navigate(['/owner/dashboard']).then(() => window.location.reload());
          } else {
            this.router.navigate(['/applications']).then(() => window.location.reload());
          }
        },
        error: () => {
          this.switching.set(false);
          this.snackBar.open('Sikertelen scope-váltás.', 'OK', { duration: 3000 });
        },
      });
  }
}
