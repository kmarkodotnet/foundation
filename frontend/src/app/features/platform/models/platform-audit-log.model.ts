export interface PlatformAuditLogEntry {
  id: number;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  entityType: string;
  entityId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  isBreakGlass: boolean;
  ownerId: string | null;
  ownerName: string | null;
}

export interface PlatformAuditLogFilter {
  page: number;
  pageSize: number;
  userId?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
}
