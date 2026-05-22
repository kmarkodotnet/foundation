import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CodeListDto, CodeListItemDto } from '../models/codelist.model';
import { CodelistService } from '../services/codelist.service';
import {
  CodelistItemFormDialogComponent,
  CodelistItemFormDialogData,
} from '../codelist-item-form-dialog.component';
import { CodelistCreateDialogComponent } from '../codelist-create-dialog.component';

@Component({
  selector: 'gm-codelist-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  templateUrl: './codelist-list.component.html',
  styleUrl: './codelist-list.component.scss',
})
export class CodelistListComponent implements OnInit {
  private readonly service = inject(CodelistService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(false);
  readonly itemsLoading = signal(false);
  readonly codelists = signal<CodeListDto[]>([]);
  readonly selectedList = signal<CodeListDto | null>(null);
  readonly items = signal<CodeListItemDto[]>([]);
  readonly includeInactive = signal(false);

  readonly canAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');

  ngOnInit(): void {
    this.loadLists();
  }

  private loadLists(): void {
    this.loading.set(true);
    this.service.getCodeLists().subscribe({
      next: (lists) => {
        this.codelists.set(lists);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  selectList(list: CodeListDto): void {
    this.selectedList.set(list);
    this.loadItems();
  }

  private loadItems(): void {
    const list = this.selectedList();
    if (!list) return;
    this.itemsLoading.set(true);
    this.service.getItems(list.id, this.includeInactive()).subscribe({
      next: (items) => {
        this.items.set(items);
        this.itemsLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.itemsLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  toggleInactive(checked: boolean): void {
    this.includeInactive.set(checked);
    this.loadItems();
  }

  createCodeList(): void {
    this.dialog
      .open(CodelistCreateDialogComponent)
      .afterClosed()
      .pipe(filter((result): result is CodeListDto => !!result))
      .subscribe((newList) => {
        this.codelists.update((lists) => [...lists, newList]);
        this.selectList(newList);
        this.cdr.markForCheck();
      });
  }

  deleteList(): void {
    const list = this.selectedList();
    if (!list) return;
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Kódszótár törlése',
          message: `Biztosan törli a(z) "${list.name}" kódszótárat?`,
          confirmLabel: 'Törlés',
        },
      })
      .afterClosed()
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.service.deleteCodeList(list.id).subscribe({
          next: () => {
            this.codelists.update((lists) => lists.filter((l) => l.id !== list.id));
            this.selectedList.set(null);
            this.items.set([]);
            this.snackBar.open('Kódszótár törölve.', 'OK', { duration: 3000 });
            this.cdr.markForCheck();
          },
          error: () => {
            this.snackBar.open(
              'Nem törölhető (rendszer kódszótár vagy vannak elemei).',
              'OK',
              { duration: 4000 }
            );
          },
        });
      });
  }

  addItem(): void {
    const list = this.selectedList();
    if (!list) return;
    this.dialog
      .open<CodelistItemFormDialogComponent, CodelistItemFormDialogData, CodeListItemDto | null>(
        CodelistItemFormDialogComponent,
        { data: { listId: list.id } }
      )
      .afterClosed()
      .pipe(filter((result): result is CodeListItemDto => !!result))
      .subscribe((newItem) => {
        this.items.update((items) => [...items, newItem]);
        this.codelists.update((lists) =>
          lists.map((l) => (l.id === list.id ? { ...l, itemCount: l.itemCount + 1 } : l))
        );
        this.cdr.markForCheck();
      });
  }

  editItem(item: CodeListItemDto): void {
    const list = this.selectedList();
    if (!list) return;
    this.dialog
      .open<CodelistItemFormDialogComponent, CodelistItemFormDialogData, CodeListItemDto | null>(
        CodelistItemFormDialogComponent,
        { data: { listId: list.id, item } }
      )
      .afterClosed()
      .pipe(filter((result): result is CodeListItemDto => !!result))
      .subscribe((updated) => {
        this.items.update((items) => items.map((i) => (i.id === updated.id ? updated : i)));
        this.cdr.markForCheck();
      });
  }

  deactivateItem(item: CodeListItemDto): void {
    const list = this.selectedList();
    if (!list) return;
    this.service.deactivateItem(list.id, item.id).subscribe({
      next: () => {
        if (!this.includeInactive()) {
          this.items.update((items) => items.filter((i) => i.id !== item.id));
        } else {
          this.items.update((items) =>
            items.map((i) => (i.id === item.id ? { ...i, status: 'Inactive' as const } : i))
          );
        }
        this.cdr.markForCheck();
      },
      error: () =>
        this.snackBar.open('Hiba történt a deaktiválás során.', 'OK', { duration: 4000 }),
    });
  }

  activateItem(item: CodeListItemDto): void {
    const list = this.selectedList();
    if (!list) return;
    this.service.activateItem(list.id, item.id).subscribe({
      next: () => {
        this.items.update((items) =>
          items.map((i) => (i.id === item.id ? { ...i, status: 'Active' as const } : i))
        );
        this.cdr.markForCheck();
      },
      error: () =>
        this.snackBar.open('Hiba történt az aktiválás során.', 'OK', { duration: 4000 }),
    });
  }

  onDrop(event: CdkDragDrop<CodeListItemDto[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const arr = [...this.items()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.items.set(arr);
    this.cdr.markForCheck();
    const list = this.selectedList();
    if (!list) return;
    this.service.reorderItems(list.id, arr.map((i) => i.id)).subscribe({
      next: () => this.snackBar.open('Sorrend mentve.', undefined, { duration: 2000 }),
      error: () => {
        this.loadItems();
        this.snackBar.open('Hiba történt a sorrend mentése során.', 'OK', { duration: 4000 });
      },
    });
  }
}
