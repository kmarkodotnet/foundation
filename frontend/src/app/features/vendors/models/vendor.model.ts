export interface Vendor {
  id: string;
  name: string;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactPersonName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateVendorRequest {
  name: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPersonName?: string;
  notes?: string;
}

export type UpdateVendorRequest = CreateVendorRequest;
