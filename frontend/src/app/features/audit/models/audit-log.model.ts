export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'StatusChange'
  | 'Approve'
  | 'Login';

export interface AuditLogEntry {
  id: number;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
}

export interface AuditFilter {
  page: number;
  pageSize: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  entityType?: string;
  action?: AuditAction;
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  Create: 'Létrehozás',
  Update: 'Módosítás',
  Delete: 'Törlés',
  StatusChange: 'Állapotváltás',
  Approve: 'Jóváhagyás',
  Login: 'Bejelentkezés',
};

export const ENTITY_TYPE_OPTIONS = [
  'Application',
  'Granter',
  'Vendor',
  'Invoice',
  'Comment',
  'Document',
  'Settlement',
  'AppUser',
  'CodeList',
];
