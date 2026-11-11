import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { verifyOrigin, verifyCsrfToken } from "@/lib/cmsAuthGuard";
import { restoreRevision } from "@/lib/revisionService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Untrusted origin." }, { status: 403 });
  }

  if (isCookieAuthenticated(request) && !verifyCsrfToken(request)) {
    return NextResponse.json({ error: "CSRF verification failed." }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json(
        { error: "Missing required revisionId." },
        { status: 400 }
      );
    }

    const result = await restoreRevision(revisionId, admin.email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, restored: result.restored });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to restore revision." },
      { status: 500 }
    );
  }
}

