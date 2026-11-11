import { NextRequest, NextResponse } from "next/server";
import { requireCheckinAccess } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  // 1. Enforce operator or main_admin auth with live is_active verification
  const authCheck = await requireCheckinAccess(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  try {
    // 2. Query attendees using permitted lookup fields ONLY.
    // Explicitly exclude prayer_point, expectation, residential_address, and normalized private data.
    const cleanQuery = query.replace(/[^\w\s@+.-]/gi, "");

    // Search by reference exact, or full_name ilike, or phone ilike
    const { data: attendees, error } = await supabaseServer
      .from("attendees")
      .select("id, reference, full_name, attendance_category, first_time, checked_in_at")
      .or(
        `reference.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[Search] Query error:", error.message);
      return NextResponse.json({ error: "Failed to perform lookup." }, { status: 500 });
    }

    // 3. Return sanitized results
    const results = (attendees || []).map((a) => ({
      id: a.id,
      reference: a.reference,
      fullName: a.full_name,
      attendanceCategory: a.attendance_category,
      firstTime: a.first_time,
      checkedIn: a.checked_in_at !== null,
      checkedInAt: a.checked_in_at,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[Search] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

