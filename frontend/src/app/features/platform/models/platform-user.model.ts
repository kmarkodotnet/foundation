export type PlatformRole = 'PlatformAdmin' | 'PlatformAuditor';
export type PlatformUserStatus = 'Active' | 'Inactive' | 'PendingInvitation';

export interface PlatformUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  status: PlatformUserStatus;
  createdAt: string;
}

export interface InvitePlatformUserRequest {
  email: string;
  role: PlatformRole;
}
