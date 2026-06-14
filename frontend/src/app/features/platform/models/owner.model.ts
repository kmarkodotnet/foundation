export type OwnerStatus = 'Active' | 'Suspended' | 'Archived';

export interface OwnerListItem {
  id: string;
  name: string;
  contactEmail: string;
  status: OwnerStatus;
  activeFoundationsCount: number;
  createdAt: string;
}

export interface OwnerDetails {
  id: string;
  name: string;
  contactEmail: string;
  status: OwnerStatus;
  activeFoundationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisionOwnerRequest {
  name: string;
  contactEmail: string;
  initialOwnerAdminEmail: string;
}

export interface ProvisionOwnerResponse {
  id: string;
  name: string;
  status: OwnerStatus;
}

export interface OwnerStatusResponse {
  status: OwnerStatus;
}
