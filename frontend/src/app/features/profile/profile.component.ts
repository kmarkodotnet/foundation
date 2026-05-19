import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from './profile.service';
import { DateHuPipe } from '../../shared/pipes/date-hu.pipe';

const ROLE_LABELS: Record<string, string> = {
  Admin:              'Adminisztrátor',
  Elnok:              'Elnök',
  PalyazatiMunkatars: 'Pályázati munkatárs',
  Penzugyes:          'Pénzügyes',
  Megtekinto:         'Megtekintő',
};

@Component({
  selector: 'gm-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    DateHuPipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);

  readonly profile = toSignal(
    this.profileService.getProfile().pipe(
      catchError(() => {
        this.snackBar.open('Nem sikerült betölteni a profil adatokat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        return of(null);
      })
    )
  );

  readonly loading = computed(() => this.profile() === undefined);
  readonly saving = signal(false);

  readonly prefsForm = new FormGroup({
    emailOnDeadlineApproaching: new FormControl(false, { nonNullable: true }),
    emailOnDeadlineMissed:      new FormControl(false, { nonNullable: true }),
    emailOnResultRecorded:      new FormControl(false, { nonNullable: true }),
    emailOnApprovalRequired:    new FormControl(false, { nonNullable: true }),
    emailOnNewComment:          new FormControl(false, { nonNullable: true }),
    emailOnDocumentUploaded:    new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const prefs = this.profile()?.notificationPreferences;
      if (prefs) {
        this.prefsForm.setValue(
          {
            emailOnDeadlineApproaching: prefs.emailOnDeadlineApproaching,
            emailOnDeadlineMissed:      prefs.emailOnDeadlineMissed,
            emailOnResultRecorded:      prefs.emailOnResultRecorded,
            emailOnApprovalRequired:    prefs.emailOnApprovalRequired,
            emailOnNewComment:          prefs.emailOnNewComment,
            emailOnDocumentUploaded:    prefs.emailOnDocumentUploaded,
          },
          { emitEvent: false }
        );
      }
    });
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  savePreferences(): void {
    if (this.saving()) return;
    this.saving.set(true);

    this.profileService.updateNotificationPreferences(this.prefsForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Értesítési beállítások elmentve.', 'Bezár', {
          duration: 3000,
        });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült elmenteni a beállításokat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
