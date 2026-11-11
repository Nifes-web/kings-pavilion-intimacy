import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  // Perform a lightweight harmless query to verify connectivity.
  const { count, error } = await supabaseServer
    .from("attendees")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, attendeesCount: count ?? 0 });
}

