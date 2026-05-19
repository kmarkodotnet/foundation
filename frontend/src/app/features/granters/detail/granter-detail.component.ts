import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GranterService } from '../services/granter.service';

@Component({
  selector: 'gm-granter-detail',
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="gm-page-container">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h1 style="margin:0">{{ isNew() ? 'Új pályáztató' : 'Pályáztató szerkesztése' }}</h1>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" style="display:flex; flex-direction:column; gap:16px">
              <mat-form-field appearance="outline">
                <mat-label>Név *</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>E-mail</mat-label>
                <input matInput formControlName="email" type="email">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Telefon</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Cím</mat-label>
                <input matInput formControlName="address">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Weboldal</mat-label>
                <input matInput formControlName="website">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Kapcsolattartó</mat-label>
                <input matInput formControlName="contactPersonName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Megjegyzés</mat-label>
                <textarea matInput formControlName="notes" rows="3"></textarea>
              </mat-form-field>
              <div style="display:flex; gap:8px">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                  Mentés
                </button>
                <button mat-button type="button" (click)="goBack()">Mégsem</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class GranterDetailComponent implements OnInit {
  readonly id = input<string>();

  private readonly service = inject(GranterService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isNew = () => this.id() === 'new' || !this.id();

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    address: [''],
    website: [''],
    contactPersonName: [''],
    notes: [''],
  });

  ngOnInit(): void {
    if (!this.isNew()) {
      this.loading.set(true);
      this.service.getById(this.id()!).subscribe({
        next: (g) => { this.form.patchValue(g); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const request = this.form.getRawValue() as any;
    const op = this.isNew()
      ? this.service.create(request)
      : this.service.update(this.id()!, request);

    op.subscribe({
      next: () => {
        this.snackBar.open('Sikeresen mentve.', 'OK', { duration: 3000 });
        this.router.navigate(['/granters']);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/granters']);
  }
}
