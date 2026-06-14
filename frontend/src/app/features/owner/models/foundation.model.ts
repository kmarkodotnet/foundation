export type FoundationStatus = 'Active' | 'Archived';

export interface FoundationListItem {
  id: string;
  name: string;
  status: FoundationStatus;
  activeApplicationsCount: number;
  logoUri: string | null;
}

export interface FoundationDetails {
  id: string;
  name: string;
  status: FoundationStatus;
  activeApplicationsCount: number;
  logoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoundationRequest {
  name: string;
  initialFoundationAdminEmail: string;
  logoUri?: string;
  templateFoundationId?: string;
}

export interface CreateFoundationResponse {
  id: string;
  name: string;
  status: FoundationStatus;
}

export interface FoundationAdmin {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  assignedAt: string;
}

export interface AssignFoundationAdminRequest {
  targetUserId: string;
  role: string;
}
