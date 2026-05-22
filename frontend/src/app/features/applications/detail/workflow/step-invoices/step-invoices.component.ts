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
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyHuPipe } from '../../../../../shared/pipes/currency-hu.pipe';
import { DateHuPipe } from '../../../../../shared/pipes/date-hu.pipe';
import {
  BudgetItem,
  DocumentDto,
  Invoice,
  InvoiceSummaryDto,
  WorkflowStep,
  WorkflowStepDetail,
} from '../../../models/application.model';
import { BudgetPlanService } from '../../../services/budget-plan.service';
import { InvoiceService } from '../../../services/invoice.service';
import {
  MarkPaidDialogComponent,
  MarkPaidDialogResult,
} from './mark-paid-dialog.component';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';

function paymentDateRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const isPaid = group.get('isPaid')?.value as boolean;
  const paymentDate = group.get('paymentDate')?.value;
  if (isPaid && !paymentDate) {
    group.get('paymentDate')?.setErrors({ required: true });
    return { paymentDateRequired: true };
  }
  if (!isPaid) {
    const pdControl = group.get('paymentDate');
    if (pdControl?.hasError('required')) {
      pdControl.setErrors(null);
    }
  }
  return null;
}

@Component({
  selector: 'gm-step-invoices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
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
    DateHuPipe,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  templateUrl: './step-invoices.component.html',
  styleUrl: './step-invoices.component.scss',
})
export class StepInvoicesComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly invoiceService = inject(InvoiceService);
  private readonly budgetPlanService = inject(BudgetPlanService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly markingPaid = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly docRefreshTick = signal(0);
  readonly invoices = signal<Invoice[]>([]);
  readonly summary = signal<InvoiceSummaryDto | null>(null);
  readonly budgetItems = signal<BudgetItem[]>([]);

  readonly tableColumns = ['supplier', 'invoiceNumber', 'issueDate', 'amount', 'status', 'actions'];

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Penzugyes';
  });

  readonly isOverBudget = computed(() => {
    const s = this.summary();
    if (!s || s.awardedAmount == null) return false;
    return s.totalInvoiced > s.awardedAmount;
  });

  readonly invoiceForm = new FormGroup(
    {
      supplierName: new FormControl<string>('', [Validators.required, Validators.maxLength(300)]),
      invoiceNumber: new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
      issueDate: new FormControl<Date | null>(null, [Validators.required]),
      amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      isPaid: new FormControl<boolean>(false),
      paymentDate: new FormControl<Date | null>(null),
      budgetItemId: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null, [Validators.maxLength(2000)]),
    },
    { validators: paymentDateRequiredValidator }
  );

  ngOnInit(): void {
    this.budgetPlanService.getBudgetPlan(this.applicationId()).subscribe({
      next: (plan) => {
        if (plan) this.budgetItems.set(plan.items);
      },
      error: () => {},
    });

    this.loadInvoices();
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.invoiceForm.reset({ isPaid: false });
    this.cdr.markForCheck();
  }

  cancelAddForm(): void {
    this.showAddForm.set(false);
    this.invoiceForm.reset({ isPaid: false });
    this.cdr.markForCheck();
  }

  submitInvoice(): void {
    if (this.invoiceForm.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.invoiceForm.getRawValue();
    const issueDate = v.issueDate
      ? (v.issueDate as Date).toISOString().substring(0, 10)
      : '';
    const paymentDate = v.paymentDate
      ? (v.paymentDate as Date).toISOString().substring(0, 10)
      : undefined;

    this.invoiceService
      .createInvoice(this.applicationId(), {
        supplierName: v.supplierName!,
        invoiceNumber: v.invoiceNumber!,
        issueDate,
        amount: v.amount!,
        isPaid: v.isPaid ?? false,
        paymentDate: v.isPaid ? paymentDate : undefined,
        budgetItemId: v.budgetItemId ?? undefined,
        notes: v.notes ?? undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelAddForm();
          this.snackBar.open('Számla rögzítve.', 'Bezár', { duration: 4000 });
          this.loadInvoices();
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Nem sikerült rögzíteni a számlát.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
  }

  openMarkPaid(invoice: Invoice): void {
    const ref = this.dialog.open<MarkPaidDialogComponent, undefined, MarkPaidDialogResult | null>(
      MarkPaidDialogComponent,
      { width: '360px' }
    );

    ref.afterClosed().pipe(filter(Boolean)).subscribe((result) => {
      this.markingPaid.set(invoice.id);
      const paymentDate = (result.paymentDate as Date).toISOString().substring(0, 10);
      this.invoiceService.markPaid(this.applicationId(), invoice.id, { paymentDate }).subscribe({
        next: (updated) => {
          this.markingPaid.set(null);
          this.invoices.update((list) =>
            list.map((i) => (i.id === updated.id ? updated : i))
          );
          this.loadInvoices();
          this.snackBar.open('Számla fizetettre jelölve.', 'Bezár', { duration: 4000 });
        },
        error: (err) => {
          this.markingPaid.set(null);
          const status = err?.status as number | undefined;
          const msg =
            status === 422
              ? 'A számla már fizetve van.'
              : 'Nem sikerült frissíteni a fizetési státuszt.';
          this.snackBar.open(msg, 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
    });
  }

  confirmDelete(invoice: Invoice): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Számla törlése',
          message: `Biztosan törölni szeretné a következő számlát?\n${invoice.invoiceNumber} — ${invoice.amount.toLocaleString('hu-HU')} Ft`,
          confirmLabel: 'Törlés',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.deleting.set(invoice.id);
          return this.invoiceService.deleteInvoice(this.applicationId(), invoice.id);
        })
      )
      .subscribe({
        next: () => {
          this.deleting.set(null);
          this.loadInvoices();
          this.snackBar.open('Számla törölve.', 'Bezár', { duration: 4000 });
        },
        error: (err) => {
          this.deleting.set(null);
          const status = err?.status as number | undefined;
          const msg =
            status === 422
              ? 'A pályázat zárolt állapotban van, törlés nem lehetséges.'
              : 'A számla nem törölhető.';
          this.snackBar.open(msg, 'Bezár', {
            duration: 6000,
            panelClass: ['gm-snack-error'],
          });
        },
      });
  }

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  private loadInvoices(): void {
    this.invoiceService.getInvoices(this.applicationId()).subscribe({
      next: (data) => {
        this.invoices.set(data.items);
        this.summary.set(data.summary);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni a számlákat.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
