import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationService } from '../services/application.service';
import { ApplicationDetail } from '../models/application.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { WorkflowTabComponent } from './workflow/workflow-tab.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'gm-application-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    StatusBadgeComponent,
    DateHuPipe,
    CurrencyHuPipe,
    WorkflowTabComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly archiving = signal(false);
  readonly application = signal<ApplicationDetail | null>(null);

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Admin' || role === 'Elnok' || role === 'PalyazatiMunkatars';
  });

  readonly canArchive = computed(() => {
    const app = this.application();
    const role = this.auth.currentUser()?.role;
    return role === 'Admin' &&
      app != null &&
      (app.status === 'ClosedWon' || app.status === 'ClosedLost');
  });

  readonly isLocked = computed(() => {
    const status = this.application()?.status;
    return status === 'ClosedWon' || status === 'ClosedLost' || status === 'Archived';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getById(this.id()).subscribe({
      next: (app) => {
        this.application.set(app);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/applications']);
  }

  openArchiveConfirm(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Pályázat archiválása',
        message: 'Biztosan archiválja ezt a pályázatot? Ez a művelet nem vonható vissza.',
        confirmLabel: 'Archiválás',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.archiving.set(true);
      this.service.archive(this.id()).subscribe({
        next: () => {
          this.archiving.set(false);
          this.router.navigate(['/applications']);
        },
        error: () => {
          this.archiving.set(false);
          this.snackBar.open('Nem sikerült archiválni a pályázatot.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
    });
  }
}
