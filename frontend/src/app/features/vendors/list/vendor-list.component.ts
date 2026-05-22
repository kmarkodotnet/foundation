import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { VendorService } from '../services/vendor.service';
import { VendorDto } from '../models/vendor.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-vendor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    HasRoleDirective,
  ],
  templateUrl: './vendor-list.component.html',
  styleUrl: './vendor-list.component.scss',
})
export class VendorListComponent implements OnInit {
  private readonly service = inject(VendorService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(false);
  readonly vendors = signal<VendorDto[]>([]);
  readonly columns = ['name', 'taxNumber', 'email', 'status', 'actions'];

  readonly searchControl = new FormControl('');
  readonly includeInactiveControl = new FormControl(false);

  ngOnInit(): void {
    this.load();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => this.load());

    this.includeInactiveControl.valueChanges.subscribe(() => this.load());
  }

  openDetail(id: string): void {
    this.router.navigate(['/vendors', id]);
  }

  createNew(): void {
    this.router.navigate(['/vendors', 'new']);
  }

  private load(): void {
    this.loading.set(true);
    const search = this.searchControl.value || undefined;
    const includeInactive = this.includeInactiveControl.value ?? false;
    this.service.getAll(search, includeInactive).subscribe({
      next: (data) => {
        this.vendors.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
