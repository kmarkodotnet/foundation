import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminUserService } from '../services/admin-user.service';

@Component({
  selector: 'gm-system-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="gm-page-container">
      <h1>Rendszerbeállítások</h1>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-card class="gm-settings-card">
            <mat-card-header>
              <mat-card-title>Szervezet</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="gm-full-width">
                <mat-label>Szervezet neve</mat-label>
                <input matInput formControlName="organizationName" />
                @if (form.controls.organizationName.errors?.['required']) {
                  <mat-error>Kötelező mező.</mat-error>
                }
                @if (form.controls.organizationName.errors?.['maxlength']) {
                  <mat-error>Legfeljebb 200 karakter.</mat-error>
                }
              </mat-form-field>

            </mat-card-content>
          </mat-card>

          <mat-card class="gm-settings-card">
            <mat-card-header>
              <mat-card-title>Értesítések</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline">
                <mat-label>Beadási határidő figyelmeztetés (nap)</mat-label>
                <input matInput type="number" formControlName="notificationWarningDays" min="1" max="90" />
                <mat-hint>Default: 7 nap</mat-hint>
                @if (form.controls.notificationWarningDays.errors?.['min'] ||
                     form.controls.notificationWarningDays.errors?.['max']) {
                  <mat-error>1–90 nap között.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Felhasználási határidő figyelmeztetés (nap)</mat-label>
                <input matInput type="number" formControlName="spendingWarningDays" min="1" max="90" />
                <mat-hint>Default: 14 nap</mat-hint>
                @if (form.controls.spendingWarningDays.errors?.['min'] ||
                     form.controls.spendingWarningDays.errors?.['max']) {
                  <mat-error>1–90 nap között.</mat-error>
                }
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="gm-settings-card">
            <mat-card-header>
              <mat-card-title>Fájlkezelés</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline">
                <mat-label>Maximum fájlméret (MB)</mat-label>
                <input matInput type="number" formControlName="maxFileSizeMb" min="1" max="500" />
                <mat-hint>Default: 50 MB</mat-hint>
                @if (form.controls.maxFileSizeMb.errors?.['min'] ||
                     form.controls.maxFileSizeMb.errors?.['max']) {
                  <mat-error>1–500 MB között.</mat-error>
                }
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="gm-settings-card">
            <mat-card-header>
              <mat-card-title>Meghívók</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline">
                <mat-label>Meghívó lejárata (óra)</mat-label>
                <input matInput type="number" formControlName="invitationExpiryHours" min="1" max="168" />
                <mat-hint>1–168 óra (max. 1 hét). Default: 72 óra.</mat-hint>
                @if (form.controls.invitationExpiryHours.errors?.['min'] ||
                     form.controls.invitationExpiryHours.errors?.['max']) {
                  <mat-error>1–168 óra között.</mat-error>
                }
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <div class="gm-form-actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || saving()"
            >
              @if (saving()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>save</mat-icon>
              }
              Mentés
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .gm-settings-card { margin-bottom: 16px; }
    mat-card-content { display: flex; flex-wrap: wrap; gap: 16px; padding-top: 16px !important; }
    .gm-full-width { width: 100%; }
    .gm-form-actions { display: flex; justify-content: flex-end; }
  `],
})
export class SystemSettingsComponent implements OnInit {
  private readonly service = inject(AdminUserService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    organizationName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    notificationWarningDays: new FormControl(7, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(90)],
    }),
    spendingWarningDays: new FormControl(14, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(90)],
    }),
    maxFileSizeMb: new FormControl(50, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(500)],
    }),
    invitationExpiryHours: new FormControl(72, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(168)],
    }),
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue({
          organizationName: s.organizationName,
          notificationWarningDays: s.notificationWarningDays,
          spendingWarningDays: s.spendingWarningDays,
          maxFileSizeMb: s.maxFileSizeMb,
          invitationExpiryHours: s.invitationExpiryHours,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.updateSettings({
      organizationName: v.organizationName,
      notificationWarningDays: v.notificationWarningDays,
      spendingWarningDays: v.spendingWarningDays,
      maxFileSizeMb: v.maxFileSizeMb,
      invitationExpiryHours: v.invitationExpiryHours,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Beállítások mentve.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        // 500 and 403 are already handled by the global errorInterceptor
        if (err?.status !== 500 && err?.status !== 403) {
          this.snackBar.open(
            err?.error?.detail ?? 'Nem sikerült menteni.',
            'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] }
          );
        }
      },
    });
  }
}
