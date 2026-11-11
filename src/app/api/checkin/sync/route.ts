import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCheckinAccess } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

const SyncItemSchema = z.object({
  reference: z.string().min(5).max(50),
  scannedAt: z.string().datetime().optional(),
  deviceId: z.string().max(100).optional().default("offline-terminal"),
});

const SyncBatchSchema = z.object({
  checkins: z.array(SyncItemSchema).max(100, "Maximum batch size is 100 items."),
});

export async function POST(request: NextRequest) {
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

  const parsed = SyncBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { checkins } = parsed.data;
  const results: Array<{ reference: string; status: "synced" | "already_checked_in" | "not_found" | "error" }> = [];

  let syncedCount = 0;
  let alreadyCheckedInCount = 0;
  let errorCount = 0;

  for (const item of checkins) {
    try {
      const { data: attendee, error: fetchErr } = await supabaseServer
        .from("attendees")
        .select("id, reference, checked_in_at")
        .eq("reference", item.reference.trim())
        .maybeSingle();

      if (fetchErr || !attendee) {
        results.push({ reference: item.reference, status: "not_found" });
        errorCount++;
        continue;
      }

      if (attendee.checked_in_at) {
        results.push({ reference: item.reference, status: "already_checked_in" });
        alreadyCheckedInCount++;
        continue;
      }

      const scanTime = item.scannedAt || new Date().toISOString();

      const { error: insertErr } = await supabaseServer.from("qr_checkins").insert({
        attendee_id: attendee.id,
        scanned_at: scanTime,
        device_id: item.deviceId,
        operator_id: operator.adminId,
        operator_email: operator.email,
        sync_status: "synced_from_offline",
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          results.push({ reference: item.reference, status: "already_checked_in" });
          alreadyCheckedInCount++;
        } else {
          results.push({ reference: item.reference, status: "error" });
          errorCount++;
        }
        continue;
      }

      await supabaseServer
        .from("attendees")
        .update({ checked_in_at: scanTime })
        .eq("id", attendee.id);

      results.push({ reference: item.reference, status: "synced" });
      syncedCount++;
    } catch {
      results.push({ reference: item.reference, status: "error" });
      errorCount++;
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalReceived: checkins.length,
      syncedCount,
      alreadyCheckedInCount,
      errorCount,
    },
    results,
  });
}

