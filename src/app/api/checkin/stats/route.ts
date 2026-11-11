import { NextRequest, NextResponse } from "next/server";
import { requireCheckinAccess } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const authCheck = await requireCheckinAccess(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }

  try {
    // Count total registrations
    const { count: totalRegistered, error: totalError } = await supabaseServer
      .from("attendees")
      .select("id", { count: "exact", head: true });

    // Count checked-in attendees
    const { count: totalCheckedIn, error: checkinError } = await supabaseServer
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .not("checked_in_at", "is", null);

    if (totalError || checkinError) {
      console.error("[Stats] Query error:", totalError || checkinError);
      return NextResponse.json({ error: "Failed to fetch event statistics." }, { status: 500 });
    }

    const reg = totalRegistered || 0;
    const checked = totalCheckedIn || 0;
    const remaining = Math.max(0, reg - checked);
    const percentage = reg > 0 ? Math.round((checked / reg) * 100) : 0;

    return NextResponse.json({
      totalRegistered: reg,
      totalCheckedIn: checked,
      remaining,
      percentage,
    });
  } catch (err) {
    console.error("[Stats] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

