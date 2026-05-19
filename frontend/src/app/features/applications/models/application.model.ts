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
  | 'ContractGranter'
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
  granterId: string;
  submissionDeadline: string;
  description?: string;
  identifier?: string;
  applicationTypeId?: string;
  minAmount?: number;
  maxAmount?: number;
  spendingDeadline?: string;
  otherMetadata?: string;
}
