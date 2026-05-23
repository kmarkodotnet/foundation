import { UserRole } from '../../../core/auth/models/user.model';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  profilePictureUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Adminisztrátor',
  Elnok: 'Elnök',
  PalyazatiMunkatars: 'Pályázati munkatárs',
  Penzugyes: 'Pénzügyes',
  Megtekinto: 'Megtekintő',
};

export interface SystemSettings {
  notificationWarningDays: number;
  spendingWarningDays: number;
  maxFileSizeMb: number;
  organizationName: string;
  defaultUserRole: UserRole;
  updatedAt: string;
}
