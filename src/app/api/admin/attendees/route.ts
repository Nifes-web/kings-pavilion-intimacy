import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access attendee records." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const filter = searchParams.get("filter") || "all"; // all, first_time, returning

  try {
    let query = supabaseServer
      .from("attendees")
      .select("id, reference, full_name, email, phone, residential_address, first_time, prayer_point, expectation, checked_in_at, created_at")
      .order("created_at", { ascending: false });

    if (filter === "first_time") {
      query = query.eq("first_time", true);
    } else if (filter === "returning") {
      query = query.eq("first_time", false);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,reference.ilike.%${search}%`
      );
    }

    const { data, error } = await query.limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attendees: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load attendees." }, { status: 500 });
  }
}

