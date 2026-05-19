export const ROLES = {
  ADMIN:                'Admin',
  ELNOK:                'Elnok',
  PALYAZATI_MUNKATARS:  'PalyazatiMunkatars',
  PENZUGYES:            'Penzugyes',
  MEGTEKINTO:           'Megtekinto',
} as const;

export type RoleValue = typeof ROLES[keyof typeof ROLES];
