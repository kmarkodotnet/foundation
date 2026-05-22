import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchService } from '../../services/search.service';
import { GlobalSearchResult, SearchResultItem } from '../../models/search.model';

@Component({
  selector: 'gm-global-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="gm-search-field" subscriptSizing="dynamic">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        [formControl]="searchCtrl"
        [matAutocomplete]="auto"
        placeholder="Keresés... (min. 3 karakter)"
        (keydown.escape)="clearSearch()"
      />
      @if (loading()) {
        <mat-spinner matSuffix diameter="18" />
      }
    </mat-form-field>

    <mat-autocomplete
      #auto="matAutocomplete"
      [displayWith]="displayFn"
      (optionSelected)="onSelect($event)"
    >
      @if (result(); as r) {
        @if (r.applications.length) {
          <mat-optgroup label="Pályázatok">
            @for (item of r.applications; track item.id) {
              <mat-option [value]="item">
                <span class="gm-search-name">{{ item.displayName }}</span>
                @if (item.status) {
                  <span class="gm-search-status">{{ item.status }}</span>
                }
              </mat-option>
            }
          </mat-optgroup>
        }
        @if (r.granters.length) {
          <mat-optgroup label="Pályáztatók">
            @for (item of r.granters; track item.id) {
              <mat-option [value]="item">
                <span class="gm-search-name">{{ item.displayName }}</span>
              </mat-option>
            }
          </mat-optgroup>
        }
        @if (r.vendors.length) {
          <mat-optgroup label="Szerződő cégek">
            @for (item of r.vendors; track item.id) {
              <mat-option [value]="item">
                <span class="gm-search-name">{{ item.displayName }}</span>
              </mat-option>
            }
          </mat-optgroup>
        }
        @if (!r.applications.length && !r.granters.length && !r.vendors.length) {
          <mat-option disabled>
            Nem található rekord a(z) "{{ searchCtrl.value }}" kifejezésre.
          </mat-option>
        }
      }
    </mat-autocomplete>
  `,
  styles: [`
    .gm-search-field { width: 280px; }
    .gm-search-name { font-weight: 500; }
    .gm-search-status {
      margin-left: 8px;
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }
  `],
})
export class GlobalSearchComponent {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchCtrl = new FormControl('');
  readonly loading = signal(false);
  readonly result = signal<GlobalSearchResult | null>(null);

  readonly displayFn = (item: SearchResultItem | string | null): string => {
    if (!item || typeof item === 'string') return typeof item === 'string' ? item : '';
    return item.displayName;
  };

  constructor() {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((term): term is string => typeof term === 'string' && term.length >= 3),
        switchMap((term) => {
          this.loading.set(true);
          return this.searchService.globalSearch(term);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.result.set(null);
          this.loading.set(false);
        },
      });

    this.searchCtrl.valueChanges
      .pipe(
        filter((v) => typeof v === 'string' && v.length < 3),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.result.set(null));
  }

  onSelect(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as SearchResultItem;
    this.clearSearch();

    const routeMap: Record<string, string> = {
      Application: '/applications',
      Granter: '/granters',
      Vendor: '/vendors',
    };

    const base = routeMap[item.entityType];
    if (base) {
      this.router.navigate([base, item.id]);
    }
  }

  clearSearch(): void {
    this.searchCtrl.setValue('', { emitEvent: false });
    this.result.set(null);
  }
}
