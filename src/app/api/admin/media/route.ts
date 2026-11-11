import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { verifyOrigin, verifyCsrfToken } from "@/lib/cmsAuthGuard";
import {
  getMediaAssets,
  getAssetAssignments,
  saveAssetAssignment,
} from "@/lib/mediaService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    );
  }

  if (admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access media assets." },
      { status: 403 }
    );
  }

  const [assets, assignments] = await Promise.all([
    getMediaAssets(),
    getAssetAssignments(),
  ]);

  return NextResponse.json({
    assets,
    assignments,
  });
}

export async function POST(request: NextRequest) {
  // Origin check
  if (!verifyOrigin(request)) {
    return NextResponse.json(
      { error: "Untrusted origin or referer." },
      { status: 403 }
    );
  }

  // CSRF check
  if (isCookieAuthenticated(request) && !verifyCsrfToken(request)) {
    return NextResponse.json(
      { error: "CSRF verification failed." },
      { status: 403 }
    );
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    );
  }

  if (admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can change media assignments." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { slotKey, url, alt, fit, position, section_name } = body;

    if (!slotKey || !url) {
      return NextResponse.json(
        { error: "Missing required fields: slotKey and url are required." },
        { status: 400 }
      );
    }

    const updatedAssignments = await saveAssetAssignment(slotKey, {
      url,
      alt: alt || "King's Pavilion Media Asset",
      fit: fit || "cover",
      position: position || "center",
      section_name: section_name || slotKey,
    });

    return NextResponse.json({
      success: true,
      assignments: updatedAssignments,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update visual asset assignment." },
      { status: 500 }
    );
  }
}

