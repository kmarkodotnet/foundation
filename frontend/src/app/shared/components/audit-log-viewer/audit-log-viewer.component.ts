import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateHuPipe } from '../../pipes/date-hu.pipe';
import { AuditLogEntry, ACTION_LABELS } from '../../../features/audit/models/audit-log.model';

export type { AuditLogEntry };

@Component({
  selector: 'gm-audit-log-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTableModule, MatTooltipModule, DateHuPipe],
  template: `
    @if (entries().length === 0) {
      <p class="gm-empty">Nincs audit bejegyzés.</p>
    } @else {
      <div class="gm-table-scroll">
      <table mat-table [dataSource]="entries()" multiTemplateDataRows style="width:100%">
        <ng-container matColumnDef="expand">
          <th mat-header-cell *matHeaderCellDef style="width:40px"></th>
          <td mat-cell *matCellDef="let row">
            @if (row.fieldName || row.oldValue || row.newValue) {
              <button
                class="gm-expand-btn"
                (click)="toggle(row.id)"
                [matTooltip]="isExpanded(row.id) ? 'Összecsuk' : 'Részletek'"
              >
                <mat-icon>{{ isExpanded(row.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Időpont</th>
          <td mat-cell *matCellDef="let row">{{ row.createdAt | dateHu: 'datetime' }}</td>
        </ng-container>

        <ng-container matColumnDef="userName">
          <th mat-header-cell *matHeaderCellDef>Felhasználó</th>
          <td mat-cell *matCellDef="let row">
            <span>{{ row.userName ?? '–' }}</span>
            @if (row.userEmail) {
              <br><small style="color:var(--mat-sys-on-surface-variant)">{{ row.userEmail }}</small>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="entityType">
          <th mat-header-cell *matHeaderCellDef>Entitás</th>
          <td mat-cell *matCellDef="let row">{{ row.entityType }}</td>
        </ng-container>

        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Művelet</th>
          <td mat-cell *matCellDef="let row">{{ actionLabel(row.action) }}</td>
        </ng-container>

        <ng-container matColumnDef="fieldName">
          <th mat-header-cell *matHeaderCellDef>Mező</th>
          <td mat-cell *matCellDef="let row">{{ row.fieldName ?? '–' }}</td>
        </ng-container>

        <ng-container matColumnDef="detail">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let row" colspan="6">
            @if (isExpanded(row.id)) {
              <div class="gm-audit-detail">
                <div class="gm-audit-value">
                  <span class="gm-audit-label">Régi érték</span>
                  <code>{{ row.oldValue ?? '–' }}</code>
                </div>
                <mat-icon class="gm-audit-arrow">arrow_forward</mat-icon>
                <div class="gm-audit-value">
                  <span class="gm-audit-label">Új érték</span>
                  <code>{{ row.newValue ?? '–' }}</code>
                </div>
              </div>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" class="gm-audit-row"></tr>
        <tr mat-row *matRowDef="let row; columns: ['detail']; when: isDetailRow" class="gm-audit-detail-row"></tr>
      </table>
      </div>
    }
  `,
  styles: [`
    .gm-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .gm-empty { color: var(--mat-sys-on-surface-variant); padding: 16px; }
    .gm-expand-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .gm-expand-btn:hover { color: var(--mat-sys-primary); }
    .gm-audit-row { height: 56px; }
    .gm-audit-detail-row { height: 0; }
    .gm-audit-detail {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 16px 12px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 4px;
      margin: 4px 0 8px;
    }
    .gm-audit-value { flex: 1; }
    .gm-audit-label { font-size: 11px; color: var(--mat-sys-on-surface-variant); display: block; margin-bottom: 4px; }
    .gm-audit-value code {
      font-size: 12px;
      background: var(--mat-sys-surface-container);
      padding: 4px 8px;
      border-radius: 4px;
      display: block;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .gm-audit-arrow { align-self: center; color: var(--mat-sys-on-surface-variant); }
  `],
})
export class AuditLogViewerComponent {
  readonly entries = input<AuditLogEntry[]>([]);

  readonly columns = ['expand', 'createdAt', 'userName', 'entityType', 'action', 'fieldName'];
  private readonly _expanded = signal<Set<number>>(new Set());

  readonly isDetailRow = (_index: number, row: AuditLogEntry) => this._expanded().has(row.id);

  toggle(id: number): void {
    this._expanded.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isExpanded(id: number): boolean {
    return this._expanded().has(id);
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action as keyof typeof ACTION_LABELS] ?? action;
  }
}
