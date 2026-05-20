export type GranterStatus = 'Active' | 'Inactive';

export interface Granter {
  id: string;
  name: string;
  description: string | null;
  phoneNumber: string | null;
  email: string | null;
  status: GranterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GranterApplication {
  id: string;
  title: string;
  identifier: string | null;
  status: string;
  awardedAmount: number | null;
}

export interface GranterDetail extends Granter {
  applications: GranterApplication[];
}

export interface CreateGranterRequest {
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
}

export type UpdateGranterRequest = CreateGranterRequest;
