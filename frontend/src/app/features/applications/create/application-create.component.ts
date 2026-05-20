import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApplicationService } from '../services/application.service';
import { GranterService } from '../../granters/services/granter.service';
import { Granter } from '../../granters/models/granter.model';
import { CreateApplicationRequest } from '../models/application.model';

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  return new Date(value) > new Date() ? null : { pastDate: true };
}

@Component({
  selector: 'gm-application-create',
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
    MatSelectModule,
  ],
  templateUrl: './application-create.component.html',
  styleUrl: './application-create.component.scss',
})
export class ApplicationCreateComponent implements OnInit {
  private readonly applicationService = inject(ApplicationService);
  private readonly granterService = inject(GranterService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly granters = signal<Granter[]>([]);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    granterId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    submissionDeadline: new FormControl<Date | null>(null, {
      validators: [Validators.required, futureDateValidator],
    }),
    identifier: new FormControl(''),
    description: new FormControl(''),
    minAmount: new FormControl<number | null>(null),
    maxAmount: new FormControl<number | null>(null),
    spendingDeadline: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.granterService.getAll(true).subscribe({
      next: (list) => this.granters.set(list),
    });
  }

  cancel(): void {
    this.router.navigate(['/applications']);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();

    const submissionDate = v.submissionDeadline!;
    submissionDate.setHours(23, 59, 59, 0);

    const request: CreateApplicationRequest = {
      title: v.title,
      granterId: v.granterId,
      submissionDeadline: submissionDate.toISOString(),
      ...(v.identifier ? { identifier: v.identifier } : {}),
      ...(v.description ? { description: v.description } : {}),
      ...(v.minAmount != null ? { minAmount: v.minAmount } : {}),
      ...(v.maxAmount != null ? { maxAmount: v.maxAmount } : {}),
      ...(v.spendingDeadline
        ? { spendingDeadline: v.spendingDeadline.toISOString().split('T')[0] }
        : {}),
    };

    this.applicationService.create(request).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.router.navigate(['/applications', result.id]);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült létrehozni a pályázatot.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
