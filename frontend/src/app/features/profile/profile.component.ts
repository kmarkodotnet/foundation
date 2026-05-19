import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
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

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
