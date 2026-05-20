import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GranterService } from '../services/granter.service';
import { CreateGranterRequest } from '../models/granter.model';

@Component({
  selector: 'gm-granter-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './granter-create.component.html',
  styleUrl: './granter-create.component.scss',
})
export class GranterCreateComponent {
  private readonly service = inject(GranterService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(300)],
    }),
    description: new FormControl(''),
    phoneNumber: new FormControl('', { validators: [Validators.maxLength(50)] }),
    email: new FormControl('', { validators: [Validators.email] }),
  });

  cancel(): void {
    this.router.navigate(['/granters']);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const request: CreateGranterRequest = {
      name: v.name,
      ...(v.description ? { description: v.description } : {}),
      ...(v.phoneNumber ? { phoneNumber: v.phoneNumber } : {}),
      ...(v.email ? { email: v.email } : {}),
    };

    this.service.create(request).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.router.navigate(['/granters', result.id]);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült létrehozni a pályáztatót.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
