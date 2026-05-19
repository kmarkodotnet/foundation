export interface Granter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  contactPersonName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGranterRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPersonName?: string;
  notes?: string;
}

export type UpdateGranterRequest = CreateGranterRequest;
