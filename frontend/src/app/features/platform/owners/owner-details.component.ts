import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformOwnerService } from '../services/platform-owner.service';
import { PlatformBreakGlassService } from '../services/platform-break-glass.service';
import { OwnerDetails, OwnerStatus } from '../models/owner.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreakGlassIssueDialogComponent } from '../break-glass/break-glass-issue-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';

const STATUS_LABELS: Record<OwnerStatus, string> = {
  Active: 'Aktív',
  Suspended: 'Felfüggesztett',
  Archived: 'Archivált',
};

@Component({
  selector: 'gm-owner-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="gm-page-container">
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else if (owner()) {
        <div class="gm-page-header">
          <button mat-icon-button (click)="back()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ owner()!.name }}</h1>
          <mat-chip [class]="'status-' + owner()!.status.toLowerCase()">
            {{ statusLabel(owner()!.status) }}
          </mat-chip>
        </div>

        <mat-card class="detail-card">
          <mat-card-content>
            <div class="detail-row">
              <span class="label">Kapcsolattartói e-mail</span>
              <span>{{ owner()!.contactEmail }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Aktív alapítványok</span>
              <span>{{ owner()!.activeFoundationsCount }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Létrehozva</span>
              <span>{{ owner()!.createdAt | date:'yyyy-MM-dd' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        @if (isPlatformAdmin()) {
          <div class="action-bar">
            @if (owner()!.status === 'Active') {
              <button mat-stroked-button color="warn" (click)="suspend()">
                <mat-icon>pause_circle</mat-icon>
                Felfüggesztés
              </button>
            }
            @if (owner()!.status === 'Suspended') {
              <button mat-stroked-button color="primary" (click)="reactivate()">
                <mat-icon>play_circle</mat-icon>
                Reaktiválás
              </button>
            }
            @if (owner()!.status !== 'Archived') {
              <button
                mat-stroked-button
                color="warn"
                [disabled]="owner()!.activeFoundationsCount > 0"
                [matTooltip]="owner()!.activeFoundationsCount > 0 ? 'Először minden alapítványt archiválj.' : ''"
                (click)="archive()"
              >
                <mat-icon>archive</mat-icon>
                Archiválás
              </button>
            }
            <button mat-stroked-button color="warn" class="break-glass-btn" (click)="issueBreakGlass()">
              <mat-icon>vpn_key</mat-icon>
              Break-glass hozzáférés
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; flex: 1; }
    .detail-card { margin-bottom: 16px; }
    .detail-row { display: flex; gap: 16px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 500; min-width: 200px; color: #666; }
    .action-bar { display: flex; gap: 12px; flex-wrap: wrap; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-suspended { background: #fff3e0; color: #e65100; }
    .status-archived { background: #f5f5f5; color: #616161; }
    .break-glass-btn { margin-left: auto; }
  `],
})
export class OwnerDetailsComponent implements OnInit {
  private readonly service = inject(PlatformOwnerService);
  private readonly breakGlassService = inject(PlatformBreakGlassService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly owner = signal<OwnerDetails | null>(null);

  private get ownerId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  isPlatformAdmin(): boolean {
    return this.authService.hasAnyRole(['PlatformAdmin' as any]);
  }

  statusLabel(status: OwnerStatus): string {
    return STATUS_LABELS[status];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getById(this.ownerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.owner.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  back(): void {
    this.router.navigate(['/platform/owners']);
  }

  suspend(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Owner felfüggesztése',
        message: 'Biztosan felfüggeszted? A felhasználók nem tudnak majd bejelentkezni.',
        confirmLabel: 'Felfüggesztés',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.suspend(this.ownerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Owner felfüggesztve.', 'OK', { duration: 3000 });
          this.load();
        });
    });
  }

  reactivate(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Owner reaktiválása',
        message: 'Biztosan reaktiválod az Owner-t?',
        confirmLabel: 'Reaktiválás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.reactivate(this.ownerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Owner reaktiválva.', 'OK', { duration: 3000 });
          this.load();
        });
    });
  }

  archive(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Owner archiválása',
        message: 'Biztosan archiválod az Owner-t? Ez a művelet nem vonható vissza.',
        confirmLabel: 'Archiválás',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.archive(this.ownerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.snackBar.open('Owner archiválva.', 'OK', { duration: 3000 });
          this.router.navigate(['/platform/owners']);
        });
    });
  }

  issueBreakGlass(): void {
    const ref = this.dialog.open(BreakGlassIssueDialogComponent, {
      data: { targetOwnerId: this.ownerId, targetOwnerName: this.owner()?.name },
      width: '480px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.accessToken) {
        this.breakGlassService.storeToken(result.accessToken);
        this.router.navigate(['/owner', this.ownerId]);
      }
    });
  }
}
