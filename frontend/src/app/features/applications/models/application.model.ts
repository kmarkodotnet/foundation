export type ApplicationStatus =
  | 'Draft'
  | 'InProgress'
  | 'Submitted'
  | 'Won'
  | 'Lost'
  | 'ClosedWon'
  | 'ClosedLost'
  | 'Archived';

export type WorkflowStepType =
  | 'Call'
  | 'Submission'
  | 'Result'
  | 'Contract'
  | 'BudgetPlan'
  | 'VendorContracts'
  | 'Invoices'
  | 'Proof'
  | 'Settlement';

export type WorkflowStepStatus =
  | 'Pending'
  | 'Active'
  | 'Completed'
  | 'Skipped'
  | 'NotApplicable'
  | 'Locked';

export interface WorkflowStep {
  id: string;
  stepType: WorkflowStepType;
  status: WorkflowStepStatus;
  order: number;
  isSkippable: boolean;
  skippedReason: string | null;
  completedAt: string | null;
  completedByUserName: string | null;
  approvedAt: string | null;
  approvedByUserName: string | null;
  rejectionNote: string | null;
}

export interface WorkflowStepDetail {
  id: string;
  stepType: string;
  status: WorkflowStepStatus;
  order: number;
  isSkippable: boolean;
  completedAt: string | null;
  completedByUserId: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  rejectionNote: string | null;
  skippedReason: string | null;
  // Submission step fields
  submittedAt: string | null;
  submissionMethodId: string | null;
  submissionMethodName: string | null;
  externalIdentifier: string | null;
  notes: string | null;
  // ContractGranter step fields
  contractIdentifier: string | null;
  contractDate: string | null;
  notificationReceived: boolean | null;
  notificationDate: string | null;
}

export interface UpdateSubmissionRequest {
  submittedAt: string;
  submissionMethodId?: string;
  externalIdentifier?: string;
  notes?: string;
}

export interface ApproveStepRequest {
  isApproved: boolean;
  rejectionNote?: string;
}

export interface RecordResultRequest {
  isWon: boolean;
  awardedAmount?: number;
  resultDate?: string;
  resultIdentifier?: string;
}

export interface CorrectResultRequest {
  isWon: boolean;
  awardedAmount?: number;
  resultDate?: string;
  resultIdentifier?: string;
}

export interface UpdateContractStepRequest {
  contractIdentifier?: string;
  contractDate?: string;
  notificationReceived: boolean;
  notificationDate?: string;
  complete: boolean;
}

export interface SkipStepRequest {
  skipReason?: string;
}

export interface ApplicationListItem {
  id: string;
  title: string;
  identifier: string | null;
  status: ApplicationStatus;
  granterName: string;
  submissionDeadline: string;
  spendingDeadline: string | null;
  awardedAmount: number | null;
  createdAt: string;
}

export interface ApplicationDetail {
  id: string;
  title: string;
  identifier: string | null;
  description: string | null;
  status: ApplicationStatus;
  granterId: string;
  granterName: string;
  applicationTypeName: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  submissionDeadline: string;
  spendingDeadline: string | null;
  otherMetadata: string | null;
  awardedAmount: number | null;
  resultDate: string | null;
  resultIdentifier: string | null;
  isArchived: boolean;
  createdByUserName: string;
  createdAt: string;
  updatedAt: string;
  workflowSteps: WorkflowStep[];
  // GranterContractData
  granterContractIdentifier: string | null;
  granterContractDate: string | null;
  granterNotificationReceived: boolean | null;
  granterNotificationDate: string | null;
}

export interface ApplicationFilter {
  page: number;
  pageSize: number;
  search?: string;
  status?: ApplicationStatus[];
  granterId?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CreateApplicationRequest {
  title: string;
  granterId: string;
  submissionDeadline: string;
  description?: string;
  identifier?: string;
  applicationTypeId?: string;
  minAmount?: number;
  maxAmount?: number;
  spendingDeadline?: string;
}

export interface UpdateApplicationRequest {
  title: string;
  submissionDeadline: string;
  description?: string;
  identifier?: string;
  applicationTypeId?: string;
  minAmount?: number;
  maxAmount?: number;
  spendingDeadline?: string;
  otherMetadata?: string;
}
