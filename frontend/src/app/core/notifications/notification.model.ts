export type NotificationType =
  | 'DeadlineApproaching'
  | 'DeadlineMissed'
  | 'ApplicationWon'
  | 'ApplicationLost'
  | 'SettlementReady'
  | 'WorkflowStepCompleted'
  | 'CommentAdded';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  applicationId?: string;
  applicationTitle?: string;
  isRead: boolean;
  createdAt: string;
}
