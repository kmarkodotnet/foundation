import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { VendorDetailDto } from '../models/vendor.model';
import { VendorService } from '../services/vendor.service';

@Component({
  selector: 'gm-vendor-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    CurrencyHuPipe,
    DateHuPipe,
  ],
  templateUrl: './vendor-detail.component.html',
  styleUrl: './vendor-detail.component.scss',
})
export class VendorDetailComponent implements OnInit {
  readonly id = input<string>();

  private readonly service = inject(VendorService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deactivating = signal(false);
  readonly showTaxNumberWarning = signal(false);
  readonly vendor = signal<VendorDetailDto | null>(null);

  readonly isNew = computed(() => this.id() === 'new' || !this.id());
  readonly isInactive = computed(() => this.vendor()?.status === 'Inactive');

  readonly canAdmin = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin';
  });

  readonly contractColumns = ['applicationTitle', 'amount', 'contractDate'];

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    taxNumber: new FormControl(''),
    address: new FormControl('', [Validators.maxLength(500)]),
    phone: new FormControl('', [Validators.maxLength(50)]),
    email: new FormControl('', [Validators.email, Validators.maxLength(300)]),
  });

  ngOnInit(): void {
    if (!this.isNew()) {
      this.loading.set(true);
      this.service.getVendorDetail(this.id()!).subscribe({
        next: (v) => {
          this.vendor.set(v);
          this.form.patchValue({
            name: v.name,
            taxNumber: v.taxNumber ?? '',
            address: v.address ?? '',
            phone: v.phone ?? '',
            email: v.email ?? '',
          });
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Nem sikerült betölteni a cég adatait.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.showTaxNumberWarning.set(false);
    const v = this.form.getRawValue();
    const request = {
      name: v.name!,
      taxNumber: v.taxNumber || undefined,
      address: v.address || undefined,
      phone: v.phone || undefined,
      email: v.email || undefined,
    };

    if (this.isNew()) {
      this.service.createVendor(request).subscribe({
        next: (result) => {
          this.saving.set(false);
          if (result.hasTaxNumberWarning) {
            this.showTaxNumberWarning.set(true);
          }
          this.snackBar.open('Szerződő cég rögzítve.', 'Bezár', { duration: 4000 });
          this.router.navigate(['/vendors', result.vendor.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err?.status === 400
            ? 'Ez a szerződő cég már szerepel a rendszerben.'
            : 'Nem sikerült rögzíteni a céget.';
          this.snackBar.open(msg, 'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] });
          this.cdr.markForCheck();
        },
      });
    } else {
      this.service.updateVendor(this.id()!, request).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.vendor.set(updated);
          this.snackBar.open('Cég adatai frissítve.', 'Bezár', { duration: 4000 });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err?.status === 400
            ? 'Ez a szerződő cég már szerepel a rendszerben.'
            : 'Nem sikerült frissíteni a cég adatait.';
          this.snackBar.open(msg, 'Bezár', { duration: 5000, panelClass: ['gm-snack-error'] });
          this.cdr.markForCheck();
        },
      });
    }
  }

  openDeactivateDialog(): void {
    const vendor = this.vendor();
    const hasContracts = (vendor?.contracts?.length ?? 0) > 0;
    const message = hasContracts
      ? `A cégnek ${vendor!.contracts.length} kapcsolt szerződése van. Biztosan inaktiválod?`
      : 'Biztosan inaktiválod ezt a szerződő céget?';

    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Cég inaktiválása',
          message,
          confirmLabel: 'Inaktiválás',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => this.deactivate());
  }

  openActivateDialog(): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Cég aktiválása',
          message: 'Biztosan aktiválod ezt a szerződő céget?',
          confirmLabel: 'Aktiválás',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => this.activate());
  }

  navigateToApplication(applicationId: string): void {
    this.router.navigate(['/applications', applicationId]);
  }

  goBack(): void {
    this.router.navigate(['/vendors']);
  }

  private deactivate(): void {
    if (this.deactivating()) return;
    this.deactivating.set(true);
    this.service.deactivateVendor(this.id()!).subscribe({
      next: (updated) => {
        this.deactivating.set(false);
        this.vendor.update((v) => v ? { ...v, status: updated.status } : v);
        this.snackBar.open('Cég inaktiválva.', 'Bezár', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.deactivating.set(false);
        this.snackBar.open('Nem sikerült inaktiválni a céget.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  private activate(): void {
    if (this.deactivating()) return;
    this.deactivating.set(true);
    this.service.activateVendor(this.id()!).subscribe({
      next: (updated) => {
        this.deactivating.set(false);
        this.vendor.update((v) => v ? { ...v, status: updated.status } : v);
        this.snackBar.open('Cég aktiválva.', 'Bezár', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.deactivating.set(false);
        this.snackBar.open('Nem sikerült aktiválni a céget.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }
}
