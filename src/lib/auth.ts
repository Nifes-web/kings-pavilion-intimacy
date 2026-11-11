// Location: src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from './supabaseClient';

/**
 * Supported Administrator Roles
 * Option 1: In Phase 1, admin_users is strictly constrained to ('main_admin', 'checkin_operator').
 * Only 'main_admin' is authorized to execute CMS mutations.
 * Future roles (event_editor, content_editor, content_moderator) are documented for Phase 2.
 */
export type AdminRole = 
  | 'main_admin' 
  | 'event_editor' 
  | 'content_editor' 
  | 'content_moderator' 
  | 'checkin_operator';

export interface AdminUser {
  id: string;             // admin_users.id (Internal surrogate key for audit logs and FKs)
  adminId: string;        // alias for id
  auth_user_id: string;   // auth.users.id (Supabase Auth identifier)
  email: string;
  role: AdminRole;
  is_active: boolean;
  full_name?: string | null;
  fullName?: string | null; // camelCase alias for existing consumers
  created_at?: string;
  last_sign_in_at?: string | null;
}

export type AuthenticatedAdmin = AdminUser;

export type AuthResult = 
  | { admin: AdminUser }
  | { errorResponse: NextResponse };

export const ALLOWED_ADMIN_ROLES: readonly AdminRole[] = [
  'main_admin',
  'checkin_operator',
  'event_editor',
  'content_editor',
  'content_moderator'
] as const;

/**
 * Checks if a request carries any cookie-based session credential.
 * Enforces CSRF validation for all cookie-authenticated requests.
 */
export function isCookieAuthenticated(request: NextRequest): boolean {
  if (request.cookies.has('kp_auth_token')) return true;
  if (request.cookies.has('sb-access-token')) return true;
  
  const allCookies = request.cookies.getAll();
  for (let i = 0; i < allCookies.length; i++) {
    const name = allCookies[i].name;
    if (name.startsWith('sb-') && name.includes('-auth-token')) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to decode a Supabase SSR token string.
 * Handles:
 *  - Base64URL prefixed values ("base64-<encoded>")
 *  - URL-encoded strings
 *  - JSON object payloads { access_token: "..." }
 *  - JSON array payloads ["access_token", "refresh_token"]
 *  - Raw JWT strings
 */
export function decodeSupabaseSsrValue(rawValue: string): string | null {
  if (!rawValue || typeof rawValue !== 'string') return null;

  let cleaned = rawValue.trim();

  // 1. Handle "base64-" prefix standard in Supabase SSR v0.4+
  if (cleaned.startsWith('base64-')) {
    try {
      const b64 = cleaned.substring(7);
      cleaned = Buffer.from(b64, 'base64url').toString('utf8');
    } catch {
      // Fallback if not valid base64url
    }
  }

  // 2. Decode URL encoding if present
  if (cleaned.includes('%')) {
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {
      // Keep cleaned as-is
    }
  }

  // 3. Attempt JSON parse
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object') {
        if (!Array.isArray(parsed) && typeof parsed.access_token === 'string') {
          return parsed.access_token;
        }
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          return parsed[0];
        }
      }
    } catch {
      // Not valid JSON
    }
  }

  // 4. Return as raw token if it looks like a JWT or valid bearer token
  if (cleaned.length > 20 && !cleaned.includes(' ')) {
    return cleaned;
  }

  return null;
}

/**
 * Extracts authentication token from headers or cookies.
 * Supports:
 *  1. Authorization: Bearer <token>
 *  2. kp_auth_token cookie
 *  3. sb-access-token cookie
 *  4. Supabase SSR auth cookies (direct and chunked: sb-*-auth-token.0, sb-*-auth-token.1)
 *     including Base64URL encoded values.
 */
export function extractToken(request: NextRequest): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Custom kp_auth_token cookie
  const customCookie = request.cookies.get('kp_auth_token')?.value;
  if (customCookie && customCookie.trim()) {
    const decoded = decodeSupabaseSsrValue(customCookie);
    return decoded || customCookie.trim();
  }

  // 3. sb-access-token cookie
  const sbAccessToken = request.cookies.get('sb-access-token')?.value;
  if (sbAccessToken && sbAccessToken.trim()) {
    const decoded = decodeSupabaseSsrValue(sbAccessToken);
    return decoded || sbAccessToken.trim();
  }

  const allCookies = request.cookies.getAll();

  // 4. Direct Supabase SSR cookie (sb-*-auth-token without chunk index)
  const directSbAuth = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
  if (directSbAuth && directSbAuth.value) {
    const token = decodeSupabaseSsrValue(directSbAuth.value);
    if (token) return token;
  }

  // 5. Chunked Supabase SSR cookies (sb-*-auth-token.0, sb-*-auth-token.1, ...)
  const chunkedPrefixes = new Set<string>();
  for (let i = 0; i < allCookies.length; i++) {
    const c = allCookies[i];
    const match = c.name.match(/^(sb-.*-auth-token)\.\d+$/);
    if (match) chunkedPrefixes.add(match[1]);
  }

  const prefixes = Array.from(chunkedPrefixes);
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    const chunks = allCookies
      .filter(c => c.name.startsWith(prefix + '.'))
      .sort((a, b) => {
        const numA = parseInt(a.name.split('.').pop() || '0', 10);
        const numB = parseInt(b.name.split('.').pop() || '0', 10);
        return numA - numB;
      });

    if (chunks.length > 0) {
      const rawCombined = chunks.map(c => c.value).join('');
      const token = decodeSupabaseSsrValue(rawCombined);
      if (token) return token;
    }
  }

  return null;
}

/**
 * Authenticates admin requests fail-closed.
 * 
 * Strict Verification Protocol:
 *  1. Supabase Auth validates session JWT signature and returns auth.users record (authUser.id).
 *  2. Resolves admin record from public.admin_users using the authoritative auth_user_id relationship.
 *  3. Verifies adminRecord.is_active is EXACTLY true.
 *  4. Verifies database email matches authenticated authUser.email.
 *  5. Verifies database role belongs to ALLOWED_ADMIN_ROLES.
 *  6. Completely ignores any client/browser-supplied administrator identity.
 */
export async function getAuthenticatedAdmin(request: NextRequest): Promise<AdminUser | null> {
  try {
    const token = extractToken(request);
    if (!token) {
      return null;
    }

    const { data: authData, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !authData?.user) {
      return null;
    }

    const authUser = authData.user;
    if (!authUser.id || !authUser.email) {
      return null;
    }

    // Resolves administrator using the authoritative auth_user_id relationship
    const { data: adminRecord, error: dbError } = await supabaseServer
      .from('admin_users')
      .select('id, auth_user_id, email, role, is_active, full_name, created_at, last_sign_in_at')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (dbError || !adminRecord) {
      return null;
    }

    // is_active must be exactly true
    if (adminRecord.is_active !== true) {
      return null;
    }

    // Database email must match authenticated email (case-insensitive)
    if (adminRecord.email.toLowerCase() !== authUser.email.toLowerCase()) {
      return null;
    }

    // Database role must be supported
    if (!ALLOWED_ADMIN_ROLES.includes(adminRecord.role as AdminRole)) {
      return null;
    }

    return {
      id: adminRecord.id,
      adminId: adminRecord.id,
      auth_user_id: adminRecord.auth_user_id,
      email: adminRecord.email,
      role: adminRecord.role as AdminRole,
      is_active: adminRecord.is_active,
      full_name: adminRecord.full_name,
      fullName: adminRecord.full_name,
      created_at: adminRecord.created_at,
      last_sign_in_at: adminRecord.last_sign_in_at
    };
  } catch (err) {
    console.error('[getAuthenticatedAdmin] Fail-closed authentication exception:', err);
    return null;
  }
}

/**
 * Enforces live session with main_admin role.
 */
export async function requireMainAdmin(request: NextRequest): Promise<AuthResult> {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Active administrator session required." },
        { status: 401 }
      ),
    };
  }
  if (admin.role !== 'main_admin') {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Main administrator privileges required." },
        { status: 403 }
      ),
    };
  }
  return { admin };
}

/**
 * Enforces live session with checkin access (main_admin or checkin_operator).
 */
export async function requireCheckinAccess(request: NextRequest): Promise<AuthResult> {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Active session required." },
        { status: 401 }
      ),
    };
  }
  if (admin.role !== 'main_admin' && admin.role !== 'checkin_operator') {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Check-in operator or administrator privileges required." },
        { status: 403 }
      ),
    };
  }
  return { admin };
}

/**
 * Role-based permission guard helper.
 */
export function requireRoles(admin: AdminUser | null, allowedRoles: AdminRole[]): boolean {
  if (!admin || admin.is_active !== true) return false;
  return allowedRoles.includes(admin.role);
}
