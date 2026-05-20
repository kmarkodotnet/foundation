import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GranterService } from '../services/granter.service';
import { GranterDetail } from '../models/granter.model';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'gm-granter-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    CurrencyHuPipe,
  ],
  templateUrl: './granter-detail.component.html',
  styleUrl: './granter-detail.component.scss',
})
export class GranterDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(GranterService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly deactivating = signal(false);
  readonly granter = signal<GranterDetail | null>(null);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'Admin');
  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });
  readonly isActive = computed(() => this.granter()?.status === 'Active');

  readonly appColumns = ['title', 'status', 'awardedAmount'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getById(this.id()).subscribe({
      next: (g) => { this.granter.set(g); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/granters']);
  }

  openDeactivateConfirm(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Pályáztató inaktiválása',
        message:
          'Biztosan inaktiválja ezt a pályáztatót? Inaktív pályáztató nem lesz választható új pályázatoknál.',
        confirmLabel: 'Inaktiválás',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deactivating.set(true);
      this.service.deactivate(this.id()).subscribe({
        next: () => {
          this.deactivating.set(false);
          this.load();
        },
        error: () => {
          this.deactivating.set(false);
          this.snackBar.open('Nem sikerült inaktiválni a pályáztatót.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
    });
  }
}
