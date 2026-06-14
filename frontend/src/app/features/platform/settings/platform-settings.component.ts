import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformSettingsService } from '../services/platform-settings.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gm-platform-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Platform beállítások</h1>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()">
              <mat-form-field appearance="outline" class="field">
                <mat-label>Max fájlméret (MB)</mat-label>
                <input matInput type="number" formControlName="maxFileSizeMb" [readonly]="isReadonly()" />
                @if (form.controls.maxFileSizeMb.hasError('required')) {
                  <mat-error>Kötelező mező.</mat-error>
                }
                @if (form.controls.maxFileSizeMb.hasError('min')) {
                  <mat-error>Legalább 1 MB.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="field">
                <mat-label>Meghívó lejárati idő (óra)</mat-label>
                <input matInput type="number" formControlName="invitationExpiryHours" [readonly]="isReadonly()" />
                @if (form.controls.invitationExpiryHours.hasError('required')) {
                  <mat-error>Kötelező mező.</mat-error>
                }
                @if (form.controls.invitationExpiryHours.hasError('min')) {
                  <mat-error>Legalább 1 óra.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="field">
                <mat-label>Alapértelmezett határidő-értesítés (nap)</mat-label>
                <input matInput type="number" formControlName="defaultDeadlineNotificationDays" [readonly]="isReadonly()" />
                @if (form.controls.defaultDeadlineNotificationDays.hasError('required')) {
                  <mat-error>Kötelező mező.</mat-error>
                }
                @if (form.controls.defaultDeadlineNotificationDays.hasError('min')) {
                  <mat-error>Legalább 1 nap.</mat-error>
                }
              </mat-form-field>

              @if (!isReadonly()) {
                <div class="form-actions">
                  <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                    @if (saving()) { <mat-spinner diameter="18" /> } @else { Mentés }
                  </button>
                </div>
              }
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; }
    .field { display: block; width: 100%; max-width: 400px; margin-bottom: 8px; }
    .form-actions { margin-top: 16px; }
  `],
})
export class PlatformSettingsComponent implements OnInit {
  private readonly service = inject(PlatformSettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    maxFileSizeMb: new FormControl<number>(50, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    invitationExpiryHours: new FormControl<number>(72, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    defaultDeadlineNotificationDays: new FormControl<number>(7, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
  });

  isReadonly(): boolean {
    return !this.authService.hasAnyRole(['PlatformAdmin' as any]);
  }

  ngOnInit(): void {
    this.loading.set(true);
    if (this.isReadonly()) this.form.disable();
    this.service.get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.form.patchValue(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.service.update(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Beállítások mentve.', 'OK', { duration: 3000 });
        },
        error: () => this.saving.set(false),
      });
  }
}
