export type NotificationType =
  | 'SubmissionDeadlineApproaching'
  | 'SubmissionDeadlineMissed'
  | 'SpendingDeadlineApproaching'
  | 'ResultRecorded'
  | 'SettlementAwaitingApproval'
  | 'ApprovalRequired'
  | 'NewComment'
  | 'DocumentUploaded';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
