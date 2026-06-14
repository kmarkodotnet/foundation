import { createHmac } from 'crypto';

const JWT_SECRET =
  process.env['JWT_SECRET'] ?? 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS';
const JWT_ISSUER = process.env['JWT_ISSUER'] ?? 'palyazat.alapitvany.hu';

// ─── Tenant test IDs ──────────────────────────────────────────────────────────

export const OWNER_A_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
export const OWNER_B_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
export const FOUNDATION_X_ID = 'ffffffff-0000-0000-0000-000000000001';
export const FOUNDATION_Y_ID = 'ffffffff-0000-0000-0000-000000000002';
export const FOUNDATION_P_ID = 'ffffffff-0000-0000-0000-000000000003';

// ─── CR2 user definitions ─────────────────────────────────────────────────────

export type Audience = 'business' | 'owner' | 'platform';
export type PlatformRole = 'PlatformAdmin' | 'PlatformAuditor';
export type OwnerRole = 'OwnerAdmin' | 'OwnerMember';
export type FoundationRole = 'FoundationAdmin' | 'Elnok' | 'PalyazatiMunkatars' | 'Penzugyes' | 'Megtekinto';

export interface Cr2User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  audience: Audience;
  platformRole?: PlatformRole;
  ownerRole?: OwnerRole;
  ownerId?: string;
  foundationId?: string;
  foundationRoles?: Record<string, FoundationRole>;
  breakGlassGrantId?: string;
}

export const CR2_USERS = {
  PlatformAdmin: {
    id: '00000000-0000-0000-0000-000000000010',
    googleId: 'google-platform-admin',
    email: 'pa@test.com',
    name: 'Platform Admin',
    audience: 'platform' as Audience,
    platformRole: 'PlatformAdmin' as PlatformRole,
  },
  PlatformAuditor: {
    id: '00000000-0000-0000-0000-000000000011',
    googleId: 'google-platform-auditor',
    email: 'pau@test.com',
    name: 'Platform Auditor',
    audience: 'platform' as Audience,
    platformRole: 'PlatformAuditor' as PlatformRole,
  },
  OwnerAdminA: {
    id: '00000000-0000-0000-0000-000000000020',
    googleId: 'google-owner-admin-a',
    email: 'oa@owner-a.com',
    name: 'Owner Admin A',
    audience: 'owner' as Audience,
    ownerId: OWNER_A_ID,
    ownerRole: 'OwnerAdmin' as OwnerRole,
  },
  OwnerAdminB: {
    id: '00000000-0000-0000-0000-000000000021',
    googleId: 'google-owner-admin-b',
    email: 'oa@owner-b.com',
    name: 'Owner Admin B',
    audience: 'owner' as Audience,
    ownerId: OWNER_B_ID,
    ownerRole: 'OwnerAdmin' as OwnerRole,
  },
  FoundationAdminX: {
    id: '00000000-0000-0000-0000-000000000030',
    googleId: 'google-fa-x',
    email: 'fa-x@owner-a.com',
    name: 'Foundation Admin X',
    audience: 'business' as Audience,
    ownerId: OWNER_A_ID,
    foundationId: FOUNDATION_X_ID,
    foundationRoles: { [FOUNDATION_X_ID]: 'FoundationAdmin' as FoundationRole },
  },
  FoundationAdminXmulti: {
    id: '00000000-0000-0000-0000-000000000030',
    googleId: 'google-fa-x',
    email: 'fa-x@owner-a.com',
    name: 'Foundation Admin X (multi)',
    audience: 'business' as Audience,
    ownerId: OWNER_A_ID,
    foundationId: FOUNDATION_X_ID,
    foundationRoles: {
      [FOUNDATION_X_ID]: 'FoundationAdmin' as FoundationRole,
      [FOUNDATION_Y_ID]: 'Megtekinto' as FoundationRole,
    },
  },
  PalyazatiMunkatarsX: {
    id: '00000000-0000-0000-0000-000000000040',
    googleId: 'google-pm-x',
    email: 'pm-x@owner-a.com',
    name: 'Pályázati Munkatárs X',
    audience: 'business' as Audience,
    ownerId: OWNER_A_ID,
    foundationId: FOUNDATION_X_ID,
    foundationRoles: { [FOUNDATION_X_ID]: 'PalyazatiMunkatars' as FoundationRole },
  },
} satisfies Record<string, Cr2User>;

// ─── JWT generation ───────────────────────────────────────────────────────────

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCr2Jwt(user: Cr2User, expiredOffset = 0): string {
  const now = Math.floor(Date.now() / 1000);
  const iat = now + expiredOffset;
  const exp = now + expiredOffset + 8 * 3600;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: Record<string, unknown> = {
    sub: user.googleId,
    email: user.email,
    name: user.name,
    userId: user.id,
    aud: user.audience,
    scope: user.audience,
    iat,
    nbf: iat,
    exp,
    iss: JWT_ISSUER,
  };

  if (user.platformRole) payload['platform_role'] = user.platformRole;
  if (user.ownerRole) payload['owner_role'] = user.ownerRole;
  if (user.ownerId) payload['owner_id'] = user.ownerId;
  if (user.foundationId) payload['foundation_id'] = user.foundationId;
  if (user.foundationRoles && Object.keys(user.foundationRoles).length > 0) {
    payload['foundation_roles'] = JSON.stringify(user.foundationRoles);
  }
  if (user.breakGlassGrantId) payload['break_glass_grant_id'] = user.breakGlassGrantId;

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function generateExpiredCr2Jwt(user: Cr2User): string {
  return generateCr2Jwt(user, -10 * 3600);
}

export function generateBreakGlassJwt(platformAdminUser: Cr2User, grantId: string, targetOwnerId: string): string {
  return generateCr2Jwt({
    ...platformAdminUser,
    audience: 'owner',
    ownerId: targetOwnerId,
    breakGlassGrantId: grantId,
  });
}
