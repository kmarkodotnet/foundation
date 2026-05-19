import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ApplicationStatus } from '../../../features/applications/models/application.model';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  Draft: 'Tervezet',
  InProgress: 'Folyamatban',
  Submitted: 'Beadva',
  Won: 'Nyert',
  Lost: 'Nem nyert',
  ClosedWon: 'Lezárva (nyert)',
  ClosedLost: 'Lezárva (nem nyert)',
  Archived: 'Archivált',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Draft: 'default',
  InProgress: 'primary',
  Submitted: 'accent',
  Won: 'primary',
  Lost: 'warn',
  ClosedWon: 'primary',
  ClosedLost: 'warn',
  Archived: 'default',
};

@Component({
  selector: 'gm-status-badge',
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [color]="color()" highlighted>
      {{ label() }}
    </mat-chip>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus>();

  readonly label = () => STATUS_LABELS[this.status()] ?? this.status();
  readonly color = () => STATUS_COLORS[this.status()] ?? 'default';
}
