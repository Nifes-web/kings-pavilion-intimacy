import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAuditLogs } from "@/lib/auditService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access full audit logs." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || undefined;
  const entity = searchParams.get("entity") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const logs = await getAuditLogs({ action, entity, search, limit });

  return NextResponse.json({ logs });
}

