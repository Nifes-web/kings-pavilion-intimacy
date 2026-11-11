import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { authenticated: false, error: "Not authenticated or account deactivated." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      adminId: admin.adminId,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    },
  });
}

