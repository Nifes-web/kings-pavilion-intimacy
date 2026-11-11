import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { verifyOrigin, verifyCsrfToken } from "@/lib/cmsAuthGuard";
import { getRevisions, recordRevision } from "@/lib/revisionService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access revision history." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || undefined;

  const revisions = await getRevisions(section);
  return NextResponse.json({ revisions });
}

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
    const { sectionKey, title, subtitle, content, changeSummary } = body;

    if (!sectionKey || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: sectionKey, title, content." },
        { status: 400 }
      );
    }

    const revision = await recordRevision({
      sectionKey,
      title,
      subtitle: subtitle || "",
      content,
      author: admin.email,
      changeSummary: changeSummary || "Content update",
    });

    return NextResponse.json({ success: true, revision });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record revision." },
      { status: 500 }
    );
  }
}

