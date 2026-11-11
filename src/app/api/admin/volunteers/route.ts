import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access volunteer applications." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const department = searchParams.get("department") || "all";

  try {
    let query = supabaseServer
      .from("volunteers")
      .select("id, reference, full_name, email, phone, residential_address, experience, availability, department, application_status, created_at")
      .order("created_at", { ascending: false });

    if (department && department !== "all") {
      query = query.eq("department", department);
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

    return NextResponse.json({ volunteers: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load volunteers." }, { status: 500 });
  }
}

