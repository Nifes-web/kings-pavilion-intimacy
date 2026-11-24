// Location: src/lib/cmsAuthGuard.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin, AuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export interface CmsMutationRequest {
  entity: string;
  recordId?: string;
  action: string;
  payload?: Record<string, unknown>;
  changeSummary?: string;
}

// Strict entity-specific field allowlists matching actual SQL implementation
export const ENTITY_FIELD_ALLOWLISTS: Record<string, readonly string[]> = {
  site_content: ["section_key", "title", "subtitle", "content"],
  ministers: ["slug", "name", "role_title", "category", "biography", "photo_url", "display_order"],
  faqs: ["slug", "question", "answer", "category", "display_order"],
  announcements: ["slug", "title", "content", "priority", "start_date", "end_date"],
  site_settings: ["key", "value", "is_public", "description"],
  testimonies: ["slug", "testifier_name", "content", "profile_image", "category", "display_order", "rejection_reason"],
};

export const VALID_CMS_ENTITIES = Object.keys(ENTITY_FIELD_ALLOWLISTS);

export const VALID_CMS_ACTIONS = [
  "create",
  "update",
  "delete",
  "publish",
  "archive",
  "reject",
] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates CSRF token using double-submit / header comparison.
 * Compares x-csrf-token header with HttpOnly csrf-token cookie using constant-time comparison.
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get("x-csrf-token");
  if (!headerToken) return false;

  const cookieToken = request.cookies.get("csrf-token")?.value;
  if (!cookieToken) return false;

  if (headerToken.length !== cookieToken.length) return false;

  let diff = 0;
  for (let i = 0; i < headerToken.length; i++) {
    diff |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Validates Origin and Referer headers against configured application origins.
 * Does NOT trust incoming Host header blindly.
 */
export function verifyOrigin(request: NextRequest): boolean {
  const allowedOrigins = new Set<string>();

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      allowedOrigins.add(`${parsed.protocol}//${parsed.host}`);
    } catch {
      // Ignore malformed env values
    }
  }

  if (allowedOrigins.size === 0 || process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return allowedOrigins.has(`${originUrl.protocol}//${originUrl.host}`);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.has(`${refererUrl.protocol}//${refererUrl.host}`);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Resolves client IP using verified hosting proxy mechanisms only.
 * Does not trust arbitrary or spoofable x-forwarded-for or x-real-ip headers.
 * If the source cannot be verified through a documented hosting proxy, returns 'unavailable'.
 */
export function getTrustedClientIp(request: NextRequest): string {
  // Verified platform header on Vercel deployment
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp && /^[\da-fA-F.:]+$/.test(vercelIp.trim())) {
    return vercelIp.split(",")[0].trim();
  }

  // Local development / testing fallback
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    const host = request.headers.get("host") || "";
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return "127.0.0.1";
    }
  }

  // Source cannot be verified
  return "unavailable";
}

/**
 * Reads and validates the request stream up to 256 KB.
 * Rejects oversized streams before or during reading.
 */
export async function readJsonBodyWithLimit(
  request: NextRequest,
  maxBytes: number = 262144 // 256 KB
): Promise<{ data: unknown } | { errorResponse: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return {
      errorResponse: NextResponse.json(
        { error: "Payload exceeds size limit of 256KB." },
        { status: 413 }
      ),
    };
  }

  if (!request.body) {
    return {
      errorResponse: NextResponse.json(
        { error: "Empty request body." },
        { status: 400 }
      ),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        return {
          errorResponse: NextResponse.json(
            { error: "Payload exceeds size limit of 256KB." },
            { status: 413 }
          ),
        };
      }
      chunks.push(value);
    }
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(merged);
  try {
    const data = JSON.parse(text);
    return { data };
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      ),
    };
  }
}

/**
 * Centralized Server Boundary for CMS Content Mutations.
 */
export async function executeCmsMutation(
  request: NextRequest,
  mutationData: CmsMutationRequest
): Promise<NextResponse> {
  // 1. Origin Verification
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // 2. CSRF Verification: Must apply to EVERY cookie-authenticated session (including chunked sb-*-auth-token cookies)
  if (isCookieAuthenticated(request)) {
    if (!verifyCsrfToken(request)) {
      return NextResponse.json({ error: "Invalid or missing CSRF token." }, { status: 403 });
    }
  }

  // 3. Centralized Admin Session & Role Verification
  const admin: AuthenticatedAdmin | null = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    );
  }

  // 4. Freeze Role Model: In Phase 1, only 'main_admin' is authorized for CMS mutations
  if (admin.role !== 'main_admin') {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin is authorized for CMS mutations in Phase 1." },
      { status: 403 }
    );
  }

  // 5. Validate Entity and Action presence
  if (!mutationData.entity || typeof mutationData.entity !== 'string' || !mutationData.entity.trim()) {
    return NextResponse.json({ error: "Entity name cannot be null or empty." }, { status: 400 });
  }

  if (!mutationData.action || typeof mutationData.action !== 'string' || !mutationData.action.trim()) {
    return NextResponse.json({ error: "Action cannot be null or empty." }, { status: 400 });
  }

  if (!VALID_CMS_ENTITIES.includes(mutationData.entity)) {
    return NextResponse.json({ error: `Invalid CMS entity '${mutationData.entity}'.` }, { status: 400 });
  }

  if (!VALID_CMS_ACTIONS.includes(mutationData.action as any)) {
    return NextResponse.json({ error: `Invalid CMS action '${mutationData.action}'.` }, { status: 400 });
  }

  // 6. Record ID Validation
  if (mutationData.action === 'create') {
    if (mutationData.recordId && mutationData.recordId.trim()) {
      return NextResponse.json({ error: "Create action must not supply a record ID." }, { status: 400 });
    }
  } else {
    // update, delete, publish, archive, reject require a valid UUID
    if (!mutationData.recordId || !UUID_REGEX.test(mutationData.recordId.trim())) {
      return NextResponse.json(
        { error: `Action '${mutationData.action}' requires a valid record UUID.` },
        { status: 400 }
      );
    }
  }

  // 7. Entity-Specific Field Allowlists
  const allowedFields = ENTITY_FIELD_ALLOWLISTS[mutationData.entity];
  const incomingPayload = mutationData.payload || {};
  const sanitizedPayload: Record<string, unknown> = {};

  // Reject unexpected or unwhitelisted payload fields on create or update
  if (['create', 'update'].includes(mutationData.action)) {
    for (const [key, val] of Object.entries(incomingPayload)) {
      if (!allowedFields.includes(key)) {
        return NextResponse.json(
          { error: `Unknown field '${key}' in payload for entity '${mutationData.entity}'.` },
          { status: 400 }
        );
      }
      sanitizedPayload[key] = val;
    }
  } else if (mutationData.action === 'reject' && mutationData.entity === 'testimonies') {
    if (incomingPayload.rejection_reason) {
      sanitizedPayload.rejection_reason = incomingPayload.rejection_reason;
    }
  }

  // 8. Invoke Privileged RPC with verified identity
  const clientIp = getTrustedClientIp(request);
  const userAgent = request.headers.get("user-agent")?.substring(0, 500) || "unknown";

  try {
    const { data, error } = await supabaseServer.rpc("mutate_content_with_audit", {
      p_auth_user_id: admin.auth_user_id,
      p_admin_email: admin.email,
      p_table_name: mutationData.entity,
      p_action: mutationData.action,
      p_record_id: mutationData.recordId ? mutationData.recordId.trim() : null,
      p_payload: sanitizedPayload,
      p_ip_address: clientIp,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("[CMS Mutation RPC Error]", {
        entity: mutationData.entity,
        action: mutationData.action,
        admin: admin.email,
        error: error.message,
      });

      const isPermError = error.message.includes("Permission Denied") || 
                          error.message.includes("CMS Security Violation") ||
                          error.message.includes("not authorized");
      return NextResponse.json(
        {
          error: isPermError
            ? error.message
            : error.message || "The content modification could not be completed.",
        },
        { status: isPermError ? 403 : 400 }
      );
    }

    // Revalidate public pages so published CMS changes appear immediately
    try {
      revalidatePath("/", "layout");
      revalidatePath("/ministers");
      revalidatePath("/testimonies");
    } catch {
      // Ignore outside Next.js request lifecycle
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("[CMS Mutation Fatal Error]", err);
    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
