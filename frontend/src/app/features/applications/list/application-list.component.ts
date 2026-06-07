import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApplicationService } from '../services/application.service';
import { GranterService } from '../../granters/services/granter.service';
import { Granter } from '../../granters/models/granter.model';
import {
  ApplicationFilter,
  ApplicationListItem,
  ApplicationSortBy,
  ApplicationStatus,
  SortDirection,
} from '../models/application.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateHuPipe } from '../../../shared/pipes/date-hu.pipe';
import { CurrencyHuPipe } from '../../../shared/pipes/currency-hu.pipe';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

interface FilterForm {
  searchTerm: FormControl<string>;
  granterId: FormControl<string | null>;
  statuses: FormControl<ApplicationStatus[]>;
  submissionDeadlineFrom: FormControl<Date | null>;
  submissionDeadlineTo: FormControl<Date | null>;
  awardedAmountMin: FormControl<number | null>;
  awardedAmountMax: FormControl<number | null>;
  includeArchived: FormControl<boolean>;
}

type FilterSnapshot = ReturnType<FormGroup<FilterForm>['getRawValue']>;

interface ActiveFilterBadge {
  label: string;
  key: keyof FilterSnapshot;
}

@Component({
  selector: 'gm-application-list',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    StatusBadgeComponent,
    DateHuPipe,
    CurrencyHuPipe,
    HasRoleDirective,
  ],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent implements OnInit {
  private readonly service = inject(ApplicationService);
  private readonly granterService = inject(GranterService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appRef = inject(ApplicationRef);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly result = signal<PagedResult<ApplicationListItem> | null>(null);
  readonly granters = signal<Granter[]>([]);

  private readonly _snapshot = signal<FilterSnapshot>({
    searchTerm: '',
    granterId: null,
    statuses: [],
    submissionDeadlineFrom: null,
    submissionDeadlineTo: null,
    awardedAmountMin: null,
    awardedAmountMax: null,
    includeArchived: false,
  });

  readonly form = new FormGroup<FilterForm>({
    searchTerm: new FormControl('', { nonNullable: true }),
    granterId: new FormControl<string | null>(null),
    statuses: new FormControl<ApplicationStatus[]>([], { nonNullable: true }),
    submissionDeadlineFrom: new FormControl<Date | null>(null),
    submissionDeadlineTo: new FormControl<Date | null>(null),
    awardedAmountMin: new FormControl<number | null>(null),
    awardedAmountMax: new FormControl<number | null>(null),
    includeArchived: new FormControl(false, { nonNullable: true }),
  });

  private readonly page$ = new BehaviorSubject<{ page: number; pageSize: number }>({
    page: 1,
    pageSize: 20,
  });
  private readonly filterTrigger$ = new Subject<void>();

  private sortBy: ApplicationSortBy = 'SubmissionDeadline';
  private sortDirection: SortDirection = 'Asc';

  readonly columns = [
    'title',
    'granterName',
    'status',
    'submissionDeadline',
    'awardedAmount',
    'actions',
  ];

  readonly statusOptions: { value: ApplicationStatus; label: string }[] = [
    { value: 'Draft', label: 'Tervezet' },
    { value: 'InProgress', label: 'Folyamatban' },
    { value: 'Submitted', label: 'Beadva' },
    { value: 'Won', label: 'Nyert' },
    { value: 'Lost', label: 'Nem nyert' },
    { value: 'ClosedWon', label: 'Lezárva (nyert)' },
    { value: 'ClosedLost', label: 'Lezárva (nem nyert)' },
  ];

  readonly activeFilters = computed<ActiveFilterBadge[]>(() => {
    const v = this._snapshot();
    const badges: ActiveFilterBadge[] = [];
    if (v.searchTerm) badges.push({ label: `Keresés: "${v.searchTerm}"`, key: 'searchTerm' });
    if (v.granterId) {
      const name = this.granters().find((g) => g.id === v.granterId)?.name ?? v.granterId;
      badges.push({ label: `Pályáztató: ${name}`, key: 'granterId' });
    }
    if (v.statuses.length) badges.push({ label: `Állapot: ${v.statuses.length} kiválasztva`, key: 'statuses' });
    if (v.submissionDeadlineFrom) badges.push({ label: 'Határidő (-tól)', key: 'submissionDeadlineFrom' });
    if (v.submissionDeadlineTo) badges.push({ label: 'Határidő (-ig)', key: 'submissionDeadlineTo' });
    if (v.awardedAmountMin != null) badges.push({ label: `Összeg min: ${v.awardedAmountMin}`, key: 'awardedAmountMin' });
    if (v.awardedAmountMax != null) badges.push({ label: `Összeg max: ${v.awardedAmountMax}`, key: 'awardedAmountMax' });
    if (v.includeArchived) badges.push({ label: 'Archivált is', key: 'includeArchived' });
    return badges;
  });

  ngOnInit(): void {
    this.granterService.getAll(false).subscribe({ next: (list) => this.granters.set(list) });
    this._initFromUrl();
    this._setupReactiveLoad();
  }

  private _initFromUrl(): void {
    const p = this.route.snapshot.queryParamMap;
    this.form.patchValue(
      {
        searchTerm: p.get('searchTerm') ?? '',
        granterId: p.get('granterId') ?? null,
        statuses: (p.getAll('statuses') as ApplicationStatus[]) ?? [],
        submissionDeadlineFrom: p.get('submissionDeadlineFrom')
          ? new Date(p.get('submissionDeadlineFrom')!)
          : null,
        submissionDeadlineTo: p.get('submissionDeadlineTo')
          ? new Date(p.get('submissionDeadlineTo')!)
          : null,
        awardedAmountMin: p.get('awardedAmountMin') ? Number(p.get('awardedAmountMin')) : null,
        awardedAmountMax: p.get('awardedAmountMax') ? Number(p.get('awardedAmountMax')) : null,
        includeArchived: p.get('includeArchived') === 'true',
      },
      { emitEvent: false },
    );
    this.sortBy = (p.get('sortBy') as ApplicationSortBy) ?? 'SubmissionDeadline';
    this.sortDirection = (p.get('sortDirection') as SortDirection) ?? 'Asc';
    const page = Number(p.get('page') ?? 1);
    const pageSize = Number(p.get('pageSize') ?? 20);
    this.page$.next({ page, pageSize });
  }

  private _setupReactiveLoad(): void {
    const textChange$ = this.form.controls.searchTerm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(this.form.controls.searchTerm.value),
    );

    combineLatest([textChange$, this.filterTrigger$.pipe(startWith(null)), this.page$])
      .pipe(
        switchMap(() => {
          const snap = this.form.getRawValue();
          this._snapshot.set(snap);
          this.cdr.markForCheck();
          const filter = this._buildFilter(snap);
          this._syncUrl(filter);
          this.loading.set(true);
          return this.service.getList(filter);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private _buildFilter(snap: FilterSnapshot): ApplicationFilter {
    const { page, pageSize } = this.page$.value;
    return {
      page,
      pageSize,
      searchTerm: snap.searchTerm || undefined,
      granterId: snap.granterId ?? undefined,
      statuses: snap.statuses.length ? snap.statuses : undefined,
      submissionDeadlineFrom: snap.submissionDeadlineFrom
        ? this._toDateString(snap.submissionDeadlineFrom)
        : undefined,
      submissionDeadlineTo: snap.submissionDeadlineTo
        ? this._toDateString(snap.submissionDeadlineTo)
        : undefined,
      awardedAmountMin: snap.awardedAmountMin ?? undefined,
      awardedAmountMax: snap.awardedAmountMax ?? undefined,
      includeArchived: snap.includeArchived || undefined,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    };
  }

  private _syncUrl(filter: ApplicationFilter): void {
    const qp: Record<string, string | string[] | null> = {
      page: String(filter.page),
      pageSize: String(filter.pageSize),
      searchTerm: filter.searchTerm ?? null,
      granterId: filter.granterId ?? null,
      statuses: filter.statuses ?? null,
      submissionDeadlineFrom: filter.submissionDeadlineFrom ?? null,
      submissionDeadlineTo: filter.submissionDeadlineTo ?? null,
      awardedAmountMin: filter.awardedAmountMin != null ? String(filter.awardedAmountMin) : null,
      awardedAmountMax: filter.awardedAmountMax != null ? String(filter.awardedAmountMax) : null,
      includeArchived: filter.includeArchived ? 'true' : null,
      sortBy: filter.sortBy ?? null,
      sortDirection: filter.sortDirection ?? null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams: qp, replaceUrl: true });
  }

  private _toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  onOtherFilterChange(): void {
    this.page$.next({ ...this.page$.value, page: 1 });
    this.filterTrigger$.next();
  }

  onSort(sort: Sort): void {
    this.sortBy = (sort.active as ApplicationSortBy) || 'SubmissionDeadline';
    this.sortDirection = sort.direction === 'desc' ? 'Desc' : 'Asc';
    this.filterTrigger$.next();
  }

  onPage(event: PageEvent): void {
    this.page$.next({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }

  removeFilter(key: keyof FilterSnapshot): void {
    const defaults: FilterSnapshot = {
      searchTerm: '',
      granterId: null,
      statuses: [],
      submissionDeadlineFrom: null,
      submissionDeadlineTo: null,
      awardedAmountMin: null,
      awardedAmountMax: null,
      includeArchived: false,
    };
    this.form.patchValue({ [key]: defaults[key] }, { emitEvent: false });
    this._snapshot.set({ ...this._snapshot(), [key]: defaults[key] });
    this.page$.next({ ...this.page$.value, page: 1 });
    this.filterTrigger$.next();
    this.appRef.tick();
  }

  clearAllFilters(): void {
    const cleared: FilterSnapshot = {
      searchTerm: '',
      granterId: null,
      statuses: [],
      submissionDeadlineFrom: null,
      submissionDeadlineTo: null,
      awardedAmountMin: null,
      awardedAmountMax: null,
      includeArchived: false,
    };
    this.form.reset(cleared, { emitEvent: false });
    this._snapshot.set(cleared);
    this.sortBy = 'SubmissionDeadline';
    this.sortDirection = 'Asc';
    this.page$.next({ page: 1, pageSize: this.page$.value.pageSize });
    this.filterTrigger$.next();
    this.appRef.tick();
  }

  openDetail(id: string): void {
    this.router.navigate(['/applications', id]);
  }

  createNew(): void {
    this.router.navigate(['/applications', 'new']);
  }

  export(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    const snap = this.form.getRawValue();
    this.service
      .exportApplications({
        searchTerm: snap.searchTerm || undefined,
        granterId: snap.granterId ?? undefined,
        statuses: snap.statuses.length ? snap.statuses : undefined,
        submissionDeadlineFrom: snap.submissionDeadlineFrom
          ? this._toDateString(snap.submissionDeadlineFrom)
          : undefined,
        submissionDeadlineTo: snap.submissionDeadlineTo
          ? this._toDateString(snap.submissionDeadlineTo)
          : undefined,
        awardedAmountMin: snap.awardedAmountMin ?? undefined,
        awardedAmountMax: snap.awardedAmountMax ?? undefined,
        includeArchived: snap.includeArchived || undefined,
      })
      .subscribe({
        next: (blob) => {
          this.exporting.set(false);
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const url = URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `palyazatok_${date}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.exporting.set(false);
          this.snackBar.open(
            'Exportáláshoz Admin, Elnök vagy Pénzügyes szerepkör szükséges.',
            'Bezár',
            { duration: 5000, panelClass: ['gm-snack-error'] },
          );
        },
      });
  }

  get currentPage(): number {
    return this.page$.value.page;
  }

  get currentPageSize(): number {
    return this.page$.value.pageSize;
  }
}
