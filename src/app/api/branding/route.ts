import { NextResponse } from "next/server";
import { getGlobalBranding } from "@/lib/brandingService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const branding = await getGlobalBranding();

  return NextResponse.json(
    {
      success: true,
      branding,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

