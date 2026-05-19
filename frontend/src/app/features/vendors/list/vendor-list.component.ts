import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VendorService } from '../services/vendor.service';
import { Vendor } from '../models/vendor.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-vendor-list',
  imports: [
    MatButtonModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, MatTooltipModule,
    HasRoleDirective,
  ],
  template: `
    <div class="gm-page-container">
      <div style="display:flex; align-items:center; margin-bottom:16px">
        <h1 style="margin:0">Szerződő cégek</h1>
        <span class="gm-spacer"></span>
        <button mat-flat-button color="primary" *hasRole="['Admin', 'PalyazatiMunkatars']" (click)="createNew()">
          <mat-icon>add</mat-icon> Új cég
        </button>
      </div>
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="vendors()" style="width:100%">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Név</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="taxNumber">
                <th mat-header-cell *matHeaderCellDef>Adószám</th>
                <td mat-cell *matCellDef="let row">{{ row.taxNumber ?? '–' }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>E-mail</th>
                <td mat-cell *matCellDef="let row">{{ row.email ?? '–' }}</td>
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
            @if (!vendors().length) {
              <div class="gm-empty-state">
                <mat-icon>handshake</mat-icon>
                <p>Még nincs rögzített szerződő cég.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class VendorListComponent implements OnInit {
  private readonly service = inject(VendorService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly vendors = signal<Vendor[]>([]);
  readonly columns = ['name', 'taxNumber', 'email', 'actions'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.vendors.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDetail(id: string): void { this.router.navigate(['/vendors', id]); }
  createNew(): void { this.router.navigate(['/vendors', 'new']); }
}
