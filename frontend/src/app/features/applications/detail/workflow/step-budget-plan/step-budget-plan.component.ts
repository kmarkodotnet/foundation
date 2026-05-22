import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BudgetItem,
  BudgetItemType,
  BudgetPlan,
  UpsertBudgetItemRequest,
  WorkflowStep,
  WorkflowStepDetail,
} from '../../../models/application.model';
import { BudgetPlanService } from '../../../services/budget-plan.service';
import { HasRoleDirective } from '../../../../../shared/directives/has-role.directive';
import { CurrencyHuPipe } from '../../../../../shared/pipes/currency-hu.pipe';
import { AuthService } from '../../../../../core/auth/auth.service';
import { DocumentDto } from '../../../models/application.model';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';

const ITEM_TYPE_LABELS: Record<BudgetItemType, string> = {
  Event: 'Rendezvény',
  Asset: 'Eszköz',
  Other: 'Egyéb',
};

@Component({
  selector: 'gm-step-budget-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    CurrencyHuPipe,
    HasRoleDirective,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  templateUrl: './step-budget-plan.component.html',
  styleUrl: './step-budget-plan.component.scss',
})
export class StepBudgetPlanComponent implements OnInit {
  readonly applicationId = input.required<string>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);
  readonly stepUpdated = output<WorkflowStepDetail>();

  private readonly budgetPlanService = inject(BudgetPlanService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly requestingApproval = signal(false);
  readonly docRefreshTick = signal(0);

  readonly canModify = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'PalyazatiMunkatars';
  });
  readonly budgetPlan = signal<BudgetPlan | null>(null);
  readonly localItems = signal<UpsertBudgetItemRequest[]>([]);
  readonly showItemForm = signal(false);
  readonly editingIndex = signal<number | null>(null);

  readonly tableColumns = ['name', 'type', 'plannedAmount', 'description', 'actions'];
  readonly itemTypeOptions: Array<{ value: BudgetItemType; label: string }> = [
    { value: 'Event', label: 'Rendezvény' },
    { value: 'Asset', label: 'Eszköz' },
    { value: 'Other', label: 'Egyéb' },
  ];

  readonly notesControl = new FormControl<string | null>(null);

  readonly itemForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    type: new FormControl<BudgetItemType>('Other', [Validators.required]),
    plannedAmount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    description: new FormControl<string | null>(null),
  });

  readonly totalPlanned = computed(() =>
    this.localItems().reduce((sum, i) => sum + (i.plannedAmount ?? 0), 0)
  );

  readonly awardedAmount = computed(() => this.budgetPlan()?.awardedAmount ?? null);

  readonly difference = computed(() => {
    const awarded = this.awardedAmount();
    if (awarded == null) return null;
    return awarded - this.totalPlanned();
  });

  readonly isOverBudget = computed(() => {
    const diff = this.difference();
    return diff != null && diff < 0;
  });

  readonly isEditable = computed(() => this.step().status === 'Active' && !this.isLocked());

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }

  get itemTypeLabel(): (type: BudgetItemType) => string {
    return (type: BudgetItemType) => ITEM_TYPE_LABELS[type] ?? type;
  }

  ngOnInit(): void {
    this.budgetPlanService.getBudgetPlan(this.applicationId()).subscribe({
      next: (plan) => {
        this.budgetPlan.set(plan);
        if (plan) {
          this.notesControl.setValue(plan.notes);
          this.localItems.set(this.itemsFromPlan(plan.items));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni a költési tervet.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  private itemsFromPlan(items: BudgetItem[]): UpsertBudgetItemRequest[] {
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      plannedAmount: i.plannedAmount,
      description: i.description ?? undefined,
      sortOrder: i.sortOrder,
    }));
  }

  openAddItemForm(): void {
    this.editingIndex.set(null);
    this.itemForm.reset({ type: 'Other' });
    this.showItemForm.set(true);
  }

  openEditItemForm(index: number): void {
    const item = this.localItems()[index];
    this.editingIndex.set(index);
    this.itemForm.setValue({
      name: item.name,
      type: item.type,
      plannedAmount: item.plannedAmount,
      description: item.description ?? null,
    });
    this.showItemForm.set(true);
  }

  cancelItemForm(): void {
    this.showItemForm.set(false);
    this.editingIndex.set(null);
    this.itemForm.reset({ type: 'Other' });
  }

  saveItem(): void {
    if (this.itemForm.invalid) return;
    const v = this.itemForm.getRawValue();
    const items = [...this.localItems()];
    const idx = this.editingIndex();

    const entry: UpsertBudgetItemRequest = {
      name: v.name!,
      type: v.type!,
      plannedAmount: v.plannedAmount!,
      description: v.description ?? undefined,
      sortOrder: idx != null ? items[idx].sortOrder : items.length + 1,
      id: idx != null ? items[idx].id : undefined,
    };

    if (idx != null) {
      items[idx] = entry;
    } else {
      items.push(entry);
    }

    this.localItems.set(items);
    this.cancelItemForm();
  }

  deleteItem(index: number): void {
    const items = [...this.localItems()];
    items.splice(index, 1);
    items.forEach((item, i) => { item.sortOrder = i + 1; });
    this.localItems.set(items);

    if (this.editingIndex() === index) {
      this.cancelItemForm();
    }
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    this.budgetPlanService.upsertBudgetPlan(this.applicationId(), {
      notes: this.notesControl.value ?? undefined,
      items: this.localItems(),
    }).subscribe({
      next: (plan) => {
        this.saving.set(false);
        this.budgetPlan.set(plan);
        this.localItems.set(this.itemsFromPlan(plan.items));
        this.snackBar.open('Költési terv elmentve.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni a költési tervet.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }

  requestApproval(): void {
    if (this.requestingApproval()) return;
    this.requestingApproval.set(true);

    this.budgetPlanService.requestApproval(this.applicationId()).subscribe({
      next: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Jóváhagyási kérés elküldve az Elnöknek.', 'Bezár', { duration: 4000 });
      },
      error: () => {
        this.requestingApproval.set(false);
        this.snackBar.open('Nem sikerült elküldeni a jóváhagyási kérést.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
