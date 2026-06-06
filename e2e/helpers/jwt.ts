import { createHmac } from 'crypto';

// JWT secret must match JWT_SECRET in .env on the RPi
const JWT_SECRET =
  process.env['JWT_SECRET'] ?? 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS';
const JWT_ISSUER = process.env['JWT_ISSUER'] ?? 'palyazat.alapitvany.hu';

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export type UserRole =
  | 'Admin'
  | 'Elnok'
  | 'PalyazatiMunkatars'
  | 'Penzugyes'
  | 'Megtekintos';

export interface TestUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  role: UserRole;
}

export const TEST_USERS: Record<UserRole, TestUser> = {
  Admin: {
    id: '00000000-0000-0000-0000-000000000001',
    googleId: 'test-google-admin',
    email: 'admin@test.hu',
    name: 'Teszt Admin',
    role: 'Admin',
  },
  Elnok: {
    id: '00000000-0000-0000-0000-000000000002',
    googleId: 'test-google-elnok',
    email: 'elnok@test.hu',
    name: 'Teszt Elnök',
    role: 'Elnok',
  },
  PalyazatiMunkatars: {
    id: '00000000-0000-0000-0000-000000000003',
    googleId: 'test-google-munkatars',
    email: 'munkatars@test.hu',
    name: 'Teszt Munkatárs',
    role: 'PalyazatiMunkatars',
  },
  Penzugyes: {
    id: '00000000-0000-0000-0000-000000000004',
    googleId: 'test-google-penzugyes',
    email: 'penzugyes@test.hu',
    name: 'Teszt Pénzügyes',
    role: 'Penzugyes',
  },
  Megtekintos: {
    id: '00000000-0000-0000-0000-000000000005',
    googleId: 'test-google-megtekintos',
    email: 'megtekintos@test.hu',
    name: 'Teszt Megtekintő',
    role: 'Megtekintos',
  },
};

function buildJwt(
  user: TestUser,
  iatOverride?: number,
  expOverride?: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const iat = iatOverride ?? now;
  const exp = expOverride ?? now + 8 * 3600;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userId: user.id,
    iat,
    nbf: iat,
    exp,
    iss: JWT_ISSUER,
  };

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

export function generateJwt(user: TestUser): string {
  return buildJwt(user);
}

export function generateExpiredJwt(user: TestUser): string {
  const now = Math.floor(Date.now() / 1000);
  return buildJwt(user, now - 10 * 3600, now - 2 * 3600);
}

/** Returns the AuthResultDto shape that the backend returns on successful login */
export function buildAuthResult(user: TestUser): object {
  return {
    accessToken: generateJwt(user),
    expiresInSeconds: 28800,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
    },
  };
}
