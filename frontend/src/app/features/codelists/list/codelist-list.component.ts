import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CodelistService } from '../services/codelist.service';
import { CodeList } from '../models/codelist.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-codelist-list',
  imports: [
    MatCardModule, MatExpansionModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, HasRoleDirective,
  ],
  template: `
    <div class="gm-page-container">
      <h1>Kódszótárak</h1>
      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-accordion>
          @for (list of codelists(); track list.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ list.name }}</mat-panel-title>
                <mat-panel-description>Kód: {{ list.code }}</mat-panel-description>
              </mat-expansion-panel-header>
              <table mat-table [dataSource]="list.items" style="width:100%">
                <ng-container matColumnDef="order">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let item">{{ item.order }}</td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Név</th>
                  <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                </ng-container>
                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Érték</th>
                  <td mat-cell *matCellDef="let item">{{ item.value }}</td>
                </ng-container>
                <ng-container matColumnDef="isActive">
                  <th mat-header-cell *matHeaderCellDef>Aktív</th>
                  <td mat-cell *matCellDef="let item">
                    <mat-icon [style.color]="item.isActive ? 'green' : 'gray'">
                      {{ item.isActive ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    </div>
  `,
})
export class CodelistListComponent implements OnInit {
  private readonly service = inject(CodelistService);

  readonly loading = signal(false);
  readonly codelists = signal<CodeList[]>([]);
  readonly columns = ['order', 'name', 'value', 'isActive'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.codelists.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
