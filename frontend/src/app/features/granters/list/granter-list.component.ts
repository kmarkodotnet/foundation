import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GranterService } from '../services/granter.service';
import { Granter } from '../models/granter.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-granter-list',
  imports: [
    MatButtonModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, MatTooltipModule,
    HasRoleDirective,
  ],
  template: `
    <div class="gm-page-container">
      <div style="display:flex; align-items:center; margin-bottom:16px">
        <h1 style="margin:0">Pályáztatók</h1>
        <span class="gm-spacer"></span>
        <button mat-flat-button color="primary" *hasRole="['Admin', 'PalyazatiMunkatars']" (click)="createNew()">
          <mat-icon>add</mat-icon> Új pályáztató
        </button>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="granters()" style="width:100%">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Név</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>E-mail</th>
                <td mat-cell *matCellDef="let row">{{ row.email ?? '–' }}</td>
              </ng-container>
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Telefon</th>
                <td mat-cell *matCellDef="let row">{{ row.phone ?? '–' }}</td>
              </ng-container>
              <ng-container matColumnDef="contactPersonName">
                <th mat-header-cell *matHeaderCellDef>Kapcsolattartó</th>
                <td mat-cell *matCellDef="let row">{{ row.contactPersonName ?? '–' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button matTooltip="Részletek" (click)="openDetail(row.id)">
                    <mat-icon>open_in_new</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" style="cursor:pointer" (click)="openDetail(row.id)"></tr>
            </table>
            @if (!granters().length) {
              <div class="gm-empty-state">
                <mat-icon>business</mat-icon>
                <p>Még nincs rögzített pályáztató.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class GranterListComponent implements OnInit {
  private readonly service = inject(GranterService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly granters = signal<Granter[]>([]);
  readonly columns = ['name', 'email', 'phone', 'contactPersonName', 'actions'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.granters.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/granters', id]);
  }

  createNew(): void {
    this.router.navigate(['/granters', 'new']);
  }
}
