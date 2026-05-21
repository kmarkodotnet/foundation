import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyHuPipe } from '../../../../../shared/pipes/currency-hu.pipe';
import { Vendor } from '../../../../vendors/models/vendor.model';
import { VendorQuickAddDialogComponent } from '../../../../vendors/vendor-quick-add-dialog.component';
import { VendorService } from '../../../../vendors/services/vendor.service';
import { BudgetItem, VendorContract, WorkflowStep, WorkflowStepDetail } from '../../../models/application.model';
import { BudgetPlanService } from '../../../services/budget-plan.service';
import { VendorContractService } from '../../../services/vendor-contract.service';

@Component({
  selector: 'gm-step-vendor-contracts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    CurrencyHuPipe,
  ],
  templateUrl: './step-vendor-contracts.component.html',
  styleUrl: './step-vendor-contracts.component.scss',
})
export class StepVendorContractsComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly vendorContractService = inject(VendorContractService);
  private readonly vendorService = inject(VendorService);
  private readonly budgetPlanService = inject(BudgetPlanService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly contracts = signal<VendorContract[]>([]);
  readonly vendors = signal<Vendor[]>([]);
  readonly budgetItems = signal<BudgetItem[]>([]);

  readonly tableColumns = ['vendor', 'identifier', 'contractDate', 'amount', 'notes', 'actions'];

  readonly totalAmount = computed(() =>
    this.contracts().reduce((sum, c) => sum + c.amount, 0)
  );

  readonly isEditable = computed(() =>
  {
    console.debug(this.step().status);
    console.debug(!this.isLocked());

    return this.step().status === 'Active' && !this.isLocked();
  }
  );

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;

    console.debug(role);

    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });

  readonly contractForm = new FormGroup({
    vendorId: new FormControl<string | null>(null, [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    currency: new FormControl<string>('HUF', [Validators.required]),
    contractDate: new FormControl<Date | null>(null, [Validators.required]),
    contractIdentifier: new FormControl<string | null>(null, [Validators.maxLength(100)]),
    budgetItemId: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null, [Validators.maxLength(2000)]),
  });

  ngOnInit(): void {
    this.vendorService.getAll().subscribe({
      next: (vendors) => this.vendors.set(vendors),
      error: () => {},
    });

    this.budgetPlanService.getBudgetPlan(this.applicationId()).subscribe({
      next: (plan) => {
        if (plan) this.budgetItems.set(plan.items);
      },
      error: () => {},
    });

    this.vendorContractService.getContracts(this.applicationId()).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni a szerződéseket.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.contractForm.reset({ currency: 'HUF' });
    this.cdr.markForCheck();
  }

  cancelAddForm(): void {
    this.showAddForm.set(false);
    this.contractForm.reset({ currency: 'HUF' });
    this.cdr.markForCheck();
  }

  openVendorQuickAdd(): void {
    const ref = this.dialog.open<VendorQuickAddDialogComponent, undefined, Vendor | null>(
      VendorQuickAddDialogComponent,
      { width: '480px' }
    );
    ref.afterClosed().subscribe((vendor) => {
      if (vendor) {
        this.vendors.update((list) => [...list, vendor]);
        this.contractForm.controls.vendorId.setValue(vendor.id);
      }
    });
  }

  submitContract(): void {
    if (this.contractForm.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.contractForm.getRawValue();
    const contractDate = v.contractDate
      ? (v.contractDate as Date).toISOString().substring(0, 10)
      : undefined;

    this.vendorContractService.createContract(this.applicationId(), {
      vendorId: v.vendorId!,
      amount: v.amount!,
      currency: v.currency!,
      contractDate,
      contractIdentifier: v.contractIdentifier ?? undefined,
      budgetItemId: v.budgetItemId ?? undefined,
      notes: v.notes ?? undefined,
    }).subscribe({
      next: (contract) => {
        this.saving.set(false);
        this.contracts.update((list) => [contract, ...list]);
        this.cancelAddForm();
        this.snackBar.open('Alvállalkozói szerződés rögzítve.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült rögzíteni a szerződést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  confirmDelete(contract: VendorContract): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Szerződés törlése',
          message: `Biztosan törölni szeretné a következő szerződést: ${contract.vendorName}?`,
          confirmLabel: 'Törlés',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => {
        this.deleting.set(contract.id);
        return this.vendorContractService.deleteContract(this.applicationId(), contract.id);
      })
    ).subscribe({
      next: () => {
        this.deleting.set(null);
        this.contracts.update((list) => list.filter((c) => c.id !== contract.id));
        this.snackBar.open('Szerződés törölve.', 'Bezár', { duration: 4000 });
      },
      error: (err) => {
        this.deleting.set(null);
        const detail = err?.error?.detail as string | undefined;
        const message = detail?.includes('számla')
          ? detail
          : 'A szerződés nem törölhető.';
        this.snackBar.open(message, 'Bezár', {
          duration: 6000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
