import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseClient";
import { normaliseEmail, normalisePhoneNumber } from "@/lib/utils";
import { generateAttendeeToken, buildQrPayload, generateQrDataUrl } from "@/lib/qr";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Zod schema — all server-side validation
// ---------------------------------------------------------------------------
const AttendeeSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(200),
  residentialAddress: z.string().min(5, "Residential address is required.").max(500),
  phone: z.string().min(1, "Phone number is required."),
  email: z.string().email("A valid email address is required."),
  firstTimeAttendee: z.boolean({ message: "Please indicate whether this is your first time attending." }),
  prayerPoints: z.string().max(2000).optional().default(""),
  expectations: z.string().max(2000).optional().default(""),
});

// ---------------------------------------------------------------------------
// Rate-limit helper
// ---------------------------------------------------------------------------
async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer.rpc("increment_rate_limit", {
      p_ip: ip,
      p_endpoint: endpoint,
      p_limit: 5,
      p_window_sec: 60,
    });
    if (error) {
      // On RPC error, fail open (allow the request) so legitimate users are not blocked.
      console.error("[RateLimit] RPC error:", error.message);
      return true;
    }
    // Supabase RPC may return a single boolean or an array with one row.
    const allowed = Array.isArray(data) ? data[0] : data;
    return Boolean(allowed);
  } catch (err) {
    console.error("[RateLimit] Unexpected error:", err);
    return true; // fail open
  }
}

// ---------------------------------------------------------------------------
// CSRF verification
// ---------------------------------------------------------------------------
function verifyCsrf(request: NextRequest): boolean {
  const headerToken = request.headers.get("x-csrf-token");
  if (!headerToken) return false;
  const cookieStore = cookies();
  const cookieToken = cookieStore.get("csrf-token")?.value ?? null;
  if (!cookieToken) return false;
  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) return false;
  let diff = 0;
  for (let i = 0; i < headerToken.length; i++) {
    diff |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// POST /api/attendees
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. CSRF check
  if (!verifyCsrf(request)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token." },
      { status: 403 }
    );
  }

  // 2. Rate limiting — identify by IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const allowed = await checkRateLimit(ip, "/api/attendees");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // 3. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = AttendeeSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Validation failed.", fields: fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  // 4. Normalise email and phone
  const emailResult = normaliseEmail(data.email);
  if (!emailResult.isValid) {
    return NextResponse.json({ error: emailResult.error ?? "Invalid email address." }, { status: 400 });
  }

  const phoneResult = normalisePhoneNumber(data.phone);
  if (!phoneResult.isValid) {
    return NextResponse.json({ error: phoneResult.error ?? "Invalid phone number." }, { status: 400 });
  }

  const normalizedEmail = emailResult.normalised;
  const normalizedPhone = phoneResult.normalised;

  // 5. Duplicate check (email)
  const { data: emailDup, error: emailDupError } = await supabaseServer
    .from("attendees")
    .select("id")
    .eq("normalized_email", normalizedEmail)
    .maybeSingle();

  if (emailDupError) {
    console.error("[Attendees] Email duplicate check error:", emailDupError.message);
    return NextResponse.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }
  if (emailDup) {
    return NextResponse.json(
      { error: "An attendee with this email address is already registered." },
      { status: 409 }
    );
  }

  // 6. Duplicate check (phone)
  const { data: phoneDup, error: phoneDupError } = await supabaseServer
    .from("attendees")
    .select("id")
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle();

  if (phoneDupError) {
    console.error("[Attendees] Phone duplicate check error:", phoneDupError.message);
    return NextResponse.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }
  if (phoneDup) {
    return NextResponse.json(
      { error: "An attendee with this phone number is already registered." },
      { status: 409 }
    );
  }

  // 7. Generate reference & cryptographically secure QR token pair
  const reference = `KP-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const { token, tokenHash } = generateAttendeeToken();

  // 8. Insert into database with hashed token
  const { error: insertError } = await supabaseServer.from("attendees").insert({
    reference,
    full_name: data.fullName.trim(),
    email: data.email.trim(),
    normalized_email: normalizedEmail,
    phone: data.phone.trim(),
    normalized_phone: normalizedPhone,
    residential_address: data.residentialAddress.trim(),
    attendance_category: "individual",
    first_time: data.firstTimeAttendee,
    prayer_point: data.prayerPoints?.trim() || null,
    expectation: data.expectations?.trim() || null,
    qr_token_hash: tokenHash,
  });

  if (insertError) {
    // Handle unique constraint violations (race condition protection)
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This email or phone number has already been registered." },
        { status: 409 }
      );
    }
    console.error("[Attendees] Insert error:", insertError.message);
    return NextResponse.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }

  // 9. Generate scannable QR Code Data URL containing the tamper-proof pass payload
  let qrCodeDataUrl = "";
  try {
    const payload = buildQrPayload(reference, token);
    qrCodeDataUrl = await generateQrDataUrl(payload);
  } catch (qrErr) {
    console.error("[Attendees] QR generation error:", qrErr);
    // Registration succeeded; pass can still be retrieved via reference
  }

  // 10. Success — return reference & QR pass data (no secret keys or DB internals)
  return NextResponse.json(
    {
      success: true,
      reference,
      qrCodeDataUrl: qrCodeDataUrl || null,
    },
    { status: 200 }
  );
}
