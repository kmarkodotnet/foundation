import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApplicationService } from '../services/application.service';
import { UpdateApplicationRequest } from '../models/application.model';

@Component({
  selector: 'gm-application-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './application-edit.component.html',
  styleUrl: './application-edit.component.scss',
})
export class ApplicationEditComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly applicationService = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    submissionDeadline: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    identifier: new FormControl(''),
    description: new FormControl(''),
    minAmount: new FormControl<number | null>(null),
    maxAmount: new FormControl<number | null>(null),
    spendingDeadline: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.applicationService.getById(this.id()).subscribe({
      next: (app) => {
        this.form.patchValue({
          title: app.title,
          submissionDeadline: new Date(app.submissionDeadline),
          identifier: app.identifier ?? '',
          description: app.description ?? '',
          minAmount: app.minAmount,
          maxAmount: app.maxAmount,
          spendingDeadline: app.spendingDeadline ? new Date(app.spendingDeadline) : null,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/applications', this.id()]);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/applications', this.id()]);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();

    const submissionDate = v.submissionDeadline!;
    submissionDate.setHours(23, 59, 59, 0);

    const request: UpdateApplicationRequest = {
      title: v.title,
      submissionDeadline: submissionDate.toISOString(),
      ...(v.identifier ? { identifier: v.identifier } : {}),
      ...(v.description ? { description: v.description } : {}),
      ...(v.minAmount != null ? { minAmount: v.minAmount } : {}),
      ...(v.maxAmount != null ? { maxAmount: v.maxAmount } : {}),
      ...(v.spendingDeadline
        ? { spendingDeadline: v.spendingDeadline.toISOString().split('T')[0] }
        : {}),
    };

    this.applicationService.update(this.id(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/applications', this.id()]);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni a pályázatot.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
