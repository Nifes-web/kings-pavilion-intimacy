import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCheckinAccess } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";
import { verifyTokenHash } from "@/lib/qr";

const ConfirmSchema = z.object({
  attendeeId: z.string().uuid().optional(),
  reference: z.string().min(5).max(50).optional(),
  token: z.string().min(10).max(128).optional(),
  deviceId: z.string().max(100).optional().default("terminal-web"),
}).refine((data) => data.attendeeId || data.reference, {
  message: "Either attendeeId or reference must be provided.",
});

export async function POST(request: NextRequest) {
  // 1. Enforce live operator/admin session
  const authCheck = await requireCheckinAccess(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }
  const operator = authCheck.admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { attendeeId, reference, token, deviceId } = parsed.data;

  try {
    // 2. Fetch attendee
    let query = supabaseServer
      .from("attendees")
      .select("id, reference, full_name, attendance_category, first_time, qr_token_hash, checked_in_at");

    if (attendeeId) {
      query = query.eq("id", attendeeId);
    } else if (reference) {
      query = query.eq("reference", reference.trim());
    }

    const { data: attendee, error: fetchError } = await query.maybeSingle();

    if (fetchError || !attendee) {
      return NextResponse.json(
        { error: "Attendee record not found." },
        { status: 404 }
      );
    }

    // 3. Cryptographic token check if scanned from QR pass
    if (token) {
      const isTokenValid = verifyTokenHash(token, attendee.qr_token_hash || "");
      if (!isTokenValid) {
        return NextResponse.json(
          { error: "Invalid or forged QR entry pass. Check-in denied." },
          { status: 401 }
        );
      }
    }

    // 4. Duplicate check-in verification
    if (attendee.checked_in_at) {
      // Lookup previous check-in details for operator feedback
      const { data: prevCheckin } = await supabaseServer
        .from("qr_checkins")
        .select("scanned_at, operator_email, device_id")
        .eq("attendee_id", attendee.id)
        .maybeSingle();

      return NextResponse.json(
        {
          error: "Attendee has already been checked in.",
          alreadyCheckedIn: true,
          checkedInAt: attendee.checked_in_at,
          operatorEmail: prevCheckin?.operator_email || "Authorized Operator",
          attendee: {
            reference: attendee.reference,
            fullName: attendee.full_name,
            attendanceCategory: attendee.attendance_category,
          },
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // 5. Atomic check-in recording (guarded by database-level unique constraint on attendee_id)
    let insertCheckinRes = await supabaseServer
      .from("qr_checkins")
      .insert({
        attendee_id: attendee.id,
        scanned_at: now,
        device_id: deviceId,
        operator_id: operator.adminId,
        operator_email: operator.email,
        sync_status: "synced",
      });

    if (insertCheckinRes.error && insertCheckinRes.error.code !== "23505") {
      // Fallback if operator columns not yet migrated
      insertCheckinRes = await supabaseServer.from("qr_checkins").insert({
        attendee_id: attendee.id,
        scanned_at: now,
        device_id: deviceId,
        sync_status: "synced",
      });
    }

    const insertCheckinError = insertCheckinRes.error;

    if (insertCheckinError) {
      // 23505 = unique_violation (simultaneous race-condition check-in caught by database constraint)
      if (insertCheckinError.code === "23505") {
        return NextResponse.json(
          {
            error: "Simultaneous check-in detected. Pass was just processed by another terminal.",
            alreadyCheckedIn: true,
          },
          { status: 409 }
        );
      }
      console.error("[Checkin] Insert error:", insertCheckinError.message);
      return NextResponse.json(
        { error: "Failed to record check-in. Please try again." },
        { status: 500 }
      );
    }

    // 6. Update attendee record with timestamp
    await supabaseServer
      .from("attendees")
      .update({ checked_in_at: now })
      .eq("id", attendee.id);

    // 7. Sanitized success response
    return NextResponse.json(
      {
        success: true,
        attendee: {
          id: attendee.id,
          reference: attendee.reference,
          fullName: attendee.full_name,
          attendanceCategory: attendee.attendance_category,
          firstTime: attendee.first_time,
          checkedIn: true,
          checkedInAt: now,
          operatorEmail: operator.email,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Checkin] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during check-in." },
      { status: 500 }
    );
  }
}

