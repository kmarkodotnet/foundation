export interface VendorDto {
  id: string;
  name: string;
  taxNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type Vendor = VendorDto;

export interface VendorContractSummaryDto {
  applicationId: string;
  applicationTitle: string;
  amount: number;
  currency: string;
  contractDate: string | null;
}

export interface VendorSummaryDto {
  totalContracts: number;
  totalAmount: number;
}

export interface VendorDetailDto extends VendorDto {
  contracts: VendorContractSummaryDto[];
  summary: VendorSummaryDto;
}

export interface CreateVendorRequest {
  name: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CreateVendorResult {
  vendor: VendorDto;
  hasTaxNumberWarning: boolean;
}

export interface UpdateVendorRequest {
  name: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}
