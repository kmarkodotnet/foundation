import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
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
import { UpdateGranterRequest } from '../models/granter.model';

@Component({
  selector: 'gm-granter-edit',
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
  templateUrl: './granter-edit.component.html',
  styleUrl: './granter-edit.component.scss',
})
export class GranterEditComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(GranterService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
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

  ngOnInit(): void {
    this.service.getById(this.id()).subscribe({
      next: (g) => {
        this.form.patchValue({
          name: g.name,
          description: g.description ?? '',
          phoneNumber: g.phoneNumber ?? '',
          email: g.email ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/granters', this.id()]);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/granters', this.id()]);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const request: UpdateGranterRequest = {
      name: v.name,
      ...(v.description ? { description: v.description } : {}),
      ...(v.phoneNumber ? { phoneNumber: v.phoneNumber } : {}),
      ...(v.email ? { email: v.email } : {}),
    };

    this.service.update(this.id(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/granters', this.id()]);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Nem sikerült menteni a pályáztatót.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      },
    });
  }
}
