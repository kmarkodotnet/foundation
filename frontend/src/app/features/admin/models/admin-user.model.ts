import { UserRole } from '../../../core/auth/models/user.model';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  googleId: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}
