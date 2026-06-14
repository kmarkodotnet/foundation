import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { OwnerCodeListTemplateService } from '../services/owner-code-list-template.service';
import { CodeListTemplate } from '../models/code-list-template.model';

@Component({
  selector: 'gm-code-list-templates-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="gm-page-container">
      <div class="gm-page-header">
        <h1>Kódszótár-sablonok</h1>
      </div>

      @if (loading()) {
        <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (templates().length === 0) {
              <div class="gm-empty-state">
                <mat-icon>list_alt</mat-icon>
                <p>Nincsenek sablonok.</p>
              </div>
            } @else {
              <table mat-table [dataSource]="templates()" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Név</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Kód</th>
                  <td mat-cell *matCellDef="let row">{{ row.code }}</td>
                </ng-container>
                <ng-container matColumnDef="itemCount">
                  <th mat-header-cell *matHeaderCellDef>Tételek</th>
                  <td mat-cell *matCellDef="let row">{{ row.itemCount }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button (click)="openEditor(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns" class="clickable-row" (click)="openEditor(row)"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .gm-page-header { display: flex; align-items: center; margin-bottom: 16px; }
    .gm-page-header h1 { margin: 0; }
    .gm-empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; color: #888; }
    .gm-empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,.04); }
  `],
})
export class CodeListTemplatesListComponent implements OnInit {
  private readonly service = inject(OwnerCodeListTemplateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly templates = signal<CodeListTemplate[]>([]);
  readonly columns = ['name', 'code', 'itemCount', 'actions'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.templates.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openEditor(t: CodeListTemplate): void {
    this.router.navigate(['/owner/code-list-templates', t.id]);
  }
}
