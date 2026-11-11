import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseClient";
import { verifyTokenHash } from "@/lib/qr";

// ---------------------------------------------------------------------------
// Zod schema for QR pass verification request
// ---------------------------------------------------------------------------
const VerifyPassSchema = z.object({
  reference: z.string().min(5, "Reference number is required.").max(50),
  token: z.string().min(10, "Security pass token is required.").max(128),
});

// ---------------------------------------------------------------------------
// Rate-limit helper
// ---------------------------------------------------------------------------
async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer.rpc("increment_rate_limit", {
      p_ip: ip,
      p_endpoint: endpoint,
      p_limit: 10, // Generous limit for check-in scanners (10/min)
      p_window_sec: 60,
    });
    if (error) {
      console.error("[RateLimit] RPC error:", error.message);
      return true; // Fail open to avoid blocking legitimate check-in staff
    }
    const allowed = Array.isArray(data) ? data[0] : data;
    return Boolean(allowed);
  } catch (err) {
    console.error("[RateLimit] Unexpected error:", err);
    return true;
  }
}

// ---------------------------------------------------------------------------
// POST /api/attendees/verify
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Rate limiting by IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const allowed = await checkRateLimit(ip, "/api/attendees/verify");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait a moment." },
      { status: 429 }
    );
  }

  // 2. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = VerifyPassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification parameters.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { reference, token } = parsed.data;

  // 3. Query attendee by reference
  const { data: attendee, error: queryError } = await supabaseServer
    .from("attendees")
    .select("id, reference, full_name, attendance_category, first_time, qr_token_hash, checked_in_at")
    .eq("reference", reference.trim())
    .maybeSingle();

  if (queryError) {
    console.error("[Verify] Database query error:", queryError.message);
    return NextResponse.json(
      { error: "Verification could not be processed." },
      { status: 500 }
    );
  }

  if (!attendee) {
    return NextResponse.json(
      { valid: false, error: "Entry pass not found. Unrecognized reference code." },
      { status: 404 }
    );
  }

  // 4. Verify cryptographic token against stored SHA-256 hash using constant-time comparison
  const isValid = verifyTokenHash(token, attendee.qr_token_hash || "");
  if (!isValid) {
    return NextResponse.json(
      { valid: false, error: "Invalid or forged entry pass." },
      { status: 401 }
    );
  }

  // 5. Success — return sanitized pass details (no personal contact data or tokens)
  return NextResponse.json(
    {
      valid: true,
      attendee: {
        reference: attendee.reference,
        fullName: attendee.full_name,
        attendanceCategory: attendee.attendance_category,
        firstTime: attendee.first_time,
        checkedIn: attendee.checked_in_at !== null,
        checkedInAt: attendee.checked_in_at,
      },
    },
    { status: 200 }
  );
}

