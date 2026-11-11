import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseClient";
import { normaliseEmail, normalisePhoneNumber } from "@/lib/utils";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Zod schema — server-side validation
// ---------------------------------------------------------------------------
const VALID_DEPARTMENTS = [
  "Media",
  "Prayer",
  "Ushering",
  "Sanitation",
  "Protocol",
  "Care",
  "Logistics",
  "Security",
] as const;

const VALID_AVAILABILITIES = [
  "Available full event day (8AM - 8PM) and pre-event briefings",
  "Available full event day (8AM - 8PM)",
  "Available for specific shifts (will specify upon coordination)",
] as const;

const VolunteerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(200),
  phone: z.string().min(1, "Phone number is required."),
  email: z.string().email("A valid email address is required."),
  residentialAddress: z.string().min(5, "Residential address is required.").max(500),
  experienceDescription: z.string().min(10, "Please describe your relevant experience (minimum 10 characters).").max(3000),
  availability: z.enum(VALID_AVAILABILITIES, { message: "Please select a valid availability option." }),
  department: z.enum(VALID_DEPARTMENTS, { message: "Please select a valid department." }),
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
      console.error("[RateLimit] RPC error:", error.message);
      return true; // fail open
    }
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
  if (headerToken.length !== cookieToken.length) return false;
  let diff = 0;
  for (let i = 0; i < headerToken.length; i++) {
    diff |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// POST /api/volunteers
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. CSRF check
  if (!verifyCsrf(request)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token." },
      { status: 403 }
    );
  }

  // 2. Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const allowed = await checkRateLimit(ip, "/api/volunteers");
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

  const parsed = VolunteerSchema.safeParse(body);
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
    .from("volunteers")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emailDupError) {
    console.error("[Volunteers] Email duplicate check error:", emailDupError.message);
    return NextResponse.json({ error: "Application could not be submitted. Please try again." }, { status: 500 });
  }
  if (emailDup) {
    return NextResponse.json(
      { error: "A volunteer application with this email address already exists." },
      { status: 409 }
    );
  }

  // 6. Duplicate check (phone)
  const { data: phoneDup, error: phoneDupError } = await supabaseServer
    .from("volunteers")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (phoneDupError) {
    console.error("[Volunteers] Phone duplicate check error:", phoneDupError.message);
    return NextResponse.json({ error: "Application could not be submitted. Please try again." }, { status: 500 });
  }
  if (phoneDup) {
    return NextResponse.json(
      { error: "A volunteer application with this phone number already exists." },
      { status: 409 }
    );
  }

  // 7. Generate reference
  const reference = `KPV-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  // 8. Insert into database
  const { error: insertError } = await supabaseServer.from("volunteers").insert({
    reference,
    full_name: data.fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    residential_address: data.residentialAddress.trim(),
    experience: data.experienceDescription.trim(),
    availability: data.availability,
    department: data.department,
    application_status: "pending",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This email or phone number has already submitted a volunteer application." },
        { status: 409 }
      );
    }
    console.error("[Volunteers] Insert error:", insertError.message);
    return NextResponse.json({ error: "Application could not be submitted. Please try again." }, { status: 500 });
  }

  // 9. Success
  return NextResponse.json({ success: true, reference }, { status: 200 });
}

