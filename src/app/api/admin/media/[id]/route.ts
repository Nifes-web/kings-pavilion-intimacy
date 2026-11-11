import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, isCookieAuthenticated } from "@/lib/auth";
import { verifyOrigin, verifyCsrfToken } from "@/lib/cmsAuthGuard";
import {
  getMediaAssets,
  saveMediaAsset,
  deleteMediaAsset,
} from "@/lib/mediaService";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!verifyOrigin(request)) {
    return NextResponse.json(
      { error: "Untrusted origin or referer." },
      { status: 403 }
    );
  }

  if (isCookieAuthenticated(request) && !verifyCsrfToken(request)) {
    return NextResponse.json(
      { error: "CSRF verification failed." },
      { status: 403 }
    );
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can update media assets." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const assets = await getMediaAssets();
    const existing = assets.find((a) => a.id === id);

    if (!existing) {
      return NextResponse.json(
        { error: "Asset not found." },
        { status: 404 }
      );
    }

    const updated = await saveMediaAsset({
      ...existing,
      name: body.name !== undefined ? body.name : existing.name,
      alt_text: body.alt_text !== undefined ? body.alt_text : existing.alt_text,
      description: body.description !== undefined ? body.description : existing.description,
      category: body.category !== undefined ? body.category : existing.category,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update asset." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!verifyOrigin(request)) {
    return NextResponse.json(
      { error: "Untrusted origin or referer." },
      { status: 403 }
    );
  }

  if (isCookieAuthenticated(request) && !verifyCsrfToken(request)) {
    return NextResponse.json(
      { error: "CSRF verification failed." },
      { status: 403 }
    );
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can delete media assets." },
      { status: 403 }
    );
  }

  const result = await deleteMediaAsset(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to delete media asset." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}

