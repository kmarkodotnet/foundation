import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditLogEntry } from '../../../../shared/components/audit-log-viewer/audit-log-viewer.component';
import { AuditLogViewerComponent } from '../../../../shared/components/audit-log-viewer/audit-log-viewer.component';

@Component({
  selector: 'gm-application-audit-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, AuditLogViewerComponent],
  template: `
    @if (loading()) {
      <div class="gm-loading-overlay"><mat-spinner diameter="48" /></div>
    } @else {
      <gm-audit-log-viewer [entries]="entries()" />
    }
  `,
})
export class ApplicationAuditTabComponent implements OnInit {
  readonly applicationId = input.required<string>();

  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly entries = signal<AuditLogEntry[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.auditService.getForApplication(this.applicationId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.entries.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
