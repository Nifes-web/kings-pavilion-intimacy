import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { runProductionReadinessScan } from "@/lib/readinessService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const report = await runProductionReadinessScan(baseUrl);

  return NextResponse.json({ report });
}

