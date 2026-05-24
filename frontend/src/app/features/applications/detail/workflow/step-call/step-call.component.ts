import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyHuPipe } from '../../../../../shared/pipes/currency-hu.pipe';
import { DateHuPipe } from '../../../../../shared/pipes/date-hu.pipe';
import { ApplicationDetail, DocumentDto, WorkflowStep } from '../../../models/application.model';
import { DocumentListComponent } from '../../../../../shared/components/document-list/document-list.component';
import { DocumentUploadComponent } from '../../../../../shared/components/document-upload/document-upload.component';
import { EmailRecordComponent } from '../../../../../shared/components/email-record/email-record.component';
import { CommentSectionComponent } from '../../../../../shared/components/comment-section/comment-section.component';
import { signal } from '@angular/core';

@Component({
  selector: 'gm-step-call',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDividerModule,
    MatIconModule,
    CurrencyHuPipe,
    DateHuPipe,
    DocumentListComponent,
    DocumentUploadComponent,
    EmailRecordComponent,
    CommentSectionComponent,
  ],
  template: `
    <div class="call-container">

      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Beadási határidő</span>
          <strong>{{ application().submissionDeadline | dateHu }}</strong>
        </div>

        @if (application().spendingDeadline) {
          <div class="info-row">
            <span class="info-label">Elköltési határidő</span>
            <strong>{{ application().spendingDeadline | dateHu }}</strong>
          </div>
        }

        @if (application().applicationTypeName) {
          <div class="info-row">
            <span class="info-label">Pályázat típusa</span>
            <strong>{{ application().applicationTypeName }}</strong>
          </div>
        }

        @if (application().minAmount !== null || application().maxAmount !== null) {
          <div class="info-row">
            <span class="info-label">Támogatás összege</span>
            <strong>
              @if (application().minAmount !== null && application().maxAmount !== null) {
                {{ application().minAmount! | currencyHu }} – {{ application().maxAmount! | currencyHu }}
              } @else if (application().minAmount !== null) {
                min. {{ application().minAmount! | currencyHu }}
              } @else {
                max. {{ application().maxAmount! | currencyHu }}
              }
            </strong>
          </div>
        }

        @if (application().description) {
          <div class="info-row info-row--full">
            <span class="info-label">Leírás</span>
            <span style="white-space:pre-wrap">{{ application().description }}</span>
          </div>
        }

        @if (application().otherMetadata) {
          <div class="info-row info-row--full">
            <span class="info-label">Egyéb megjegyzés</span>
            <span style="white-space:pre-wrap">{{ application().otherMetadata }}</span>
          </div>
        }
      </div>

      <mat-divider style="margin: 16px 0" />
      <h3 style="margin: 8px 0">Dokumentumok</h3>
      @if (!isLocked()) {
        <gm-document-upload [appId]="applicationId()" [stepId]="step().id" (uploaded)="onDocumentUploaded($event)" />
      }
      <gm-document-list [appId]="applicationId()" [stepId]="step().id" [isLocked]="isLocked()" [refreshTrigger]="docRefreshTick()" />
      <mat-divider style="margin: 16px 0" />
      <gm-comment-section [appId]="applicationId()" [stepId]="step().id" [isLocked]="isLocked()" />
      <mat-divider style="margin: 16px 0" />
      <gm-email-record [appId]="applicationId()" [stepId]="step().id" [isLocked]="isLocked()" />
    </div>
  `,
  styles: [`
    .call-container { padding: 0; }
    .info-grid { display: flex; flex-direction: column; gap: 8px; }
    .info-row {
      display: flex;
      gap: 12px;
      align-items: baseline;
    }
    .info-row--full { flex-direction: column; gap: 4px; }
    .info-label {
      min-width: 160px;
      color: rgba(0,0,0,0.54);
      font-size: 0.875rem;
    }
  `],
})
export class StepCallComponent {
  readonly applicationId = input.required<string>();
  readonly application = input.required<ApplicationDetail>();
  readonly step = input.required<WorkflowStep>();
  readonly isLocked = input(false);

  readonly docRefreshTick = signal(0);

  onDocumentUploaded(_doc: DocumentDto): void {
    this.docRefreshTick.update((n) => n + 1);
  }
}
