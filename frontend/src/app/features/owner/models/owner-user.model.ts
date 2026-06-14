export type OwnerRole = 'OwnerAdmin' | 'OwnerMember';
export type FoundationRole = 'FoundationAdmin' | 'Megtekinto';

export interface FoundationAssignment {
  foundationId: string;
  foundationName: string;
  role: FoundationRole;
}

export interface OwnerUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  ownerRole: OwnerRole | null;
  foundationAssignments: FoundationAssignment[];
  status: string;
}

export interface InviteOwnerUserRequest {
  email: string;
  foundationAssignments: { foundationId: string; role: FoundationRole }[];
}

export interface AssignFoundationRequest {
  foundationId: string;
  role: FoundationRole;
}
