import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { verifyOrigin, verifyCsrfToken } from "@/lib/cmsAuthGuard";
import { processMediaUpload, MediaAsset } from "@/lib/mediaService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Origin check
  if (!verifyOrigin(request)) {
    return NextResponse.json(
      { error: "Untrusted origin or referer." },
      { status: 403 }
    );
  }

  // 2. CSRF check
  if (isCookieAuthenticated(request) && !verifyCsrfToken(request)) {
    return NextResponse.json(
      { error: "CSRF verification failed." },
      { status: 403 }
    );
  }

  // 3. Admin Authentication
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    );
  }

  if (admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can upload media assets." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as MediaAsset["category"]) || "general";
    const altText = (formData.get("altText") as string) || "";
    const description = (formData.get("description") as string) || "";
    const widthStr = formData.get("width") as string | null;
    const heightStr = formData.get("height") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processMediaUpload({
      buffer,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      category,
      altText,
      description,
      width: widthStr ? parseInt(widthStr, 10) : undefined,
      height: heightStr ? parseInt(heightStr, 10) : undefined,
    });

    if (!result.success || !result.asset) {
      return NextResponse.json(
        { error: result.error || "Failed to process uploaded file." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: result.asset,
    });
  } catch (err: any) {
    console.error("[MediaUploadAPI] Error handling file upload:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error processing file upload." },
      { status: 500 }
    );
  }
}

