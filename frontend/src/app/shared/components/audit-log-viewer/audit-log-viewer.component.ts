import { Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DateHuPipe } from '../../pipes/date-hu.pipe';

export interface AuditLogEntry {
  id: number;
  entityType: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userName: string;
  createdAt: string;
}

@Component({
  selector: 'gm-audit-log-viewer',
  imports: [MatTableModule, DateHuPipe],
  template: `
    <table mat-table [dataSource]="entries()" style="width:100%">
      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef>Időpont</th>
        <td mat-cell *matCellDef="let row">{{ row.createdAt | dateHu: 'datetime' }}</td>
      </ng-container>
      <ng-container matColumnDef="userName">
        <th mat-header-cell *matHeaderCellDef>Felhasználó</th>
        <td mat-cell *matCellDef="let row">{{ row.userName }}</td>
      </ng-container>
      <ng-container matColumnDef="action">
        <th mat-header-cell *matHeaderCellDef>Művelet</th>
        <td mat-cell *matCellDef="let row">{{ row.action }}</td>
      </ng-container>
      <ng-container matColumnDef="fieldName">
        <th mat-header-cell *matHeaderCellDef>Mező</th>
        <td mat-cell *matCellDef="let row">{{ row.fieldName ?? '–' }}</td>
      </ng-container>
      <ng-container matColumnDef="oldValue">
        <th mat-header-cell *matHeaderCellDef>Régi érték</th>
        <td mat-cell *matCellDef="let row">{{ row.oldValue ?? '–' }}</td>
      </ng-container>
      <ng-container matColumnDef="newValue">
        <th mat-header-cell *matHeaderCellDef>Új érték</th>
        <td mat-cell *matCellDef="let row">{{ row.newValue ?? '–' }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  `,
})
export class AuditLogViewerComponent {
  readonly entries = input<AuditLogEntry[]>([]);
  readonly columns = ['createdAt', 'userName', 'action', 'fieldName', 'oldValue', 'newValue'];
}
