export type BreakGlassStatus = 'Active' | 'Revoked' | 'Expired';

export interface BreakGlassGrantListItem {
  id: string;
  targetOwnerId: string;
  targetOwnerName: string;
  issuedByEmail: string;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  status: BreakGlassStatus;
  revokedAt: string | null;
}

export interface IssueBreakGlassRequest {
  targetOwnerId: string;
  reason: string;
}

export interface IssueBreakGlassResponse {
  grantId: string;
  accessToken: string;
  expiresAt: string;
}

export interface RevokeBreakGlassResponse {
  status: BreakGlassStatus;
  revokedAt: string;
}
