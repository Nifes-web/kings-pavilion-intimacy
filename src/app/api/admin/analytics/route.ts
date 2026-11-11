import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin || admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access analytics." },
      { status: 403 }
    );
  }

  try {
    // 1. Total attendees count
    const { count: totalAttendees } = await supabaseServer
      .from("attendees")
      .select("id", { count: "exact", head: true });

    // 2. First-time attendees count
    const { count: firstTimeAttendees } = await supabaseServer
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .eq("first_time", true);

    // 3. Checked-in attendees count
    const { count: checkedInCount } = await supabaseServer
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .not("checked_in_at", "is", null);

    // 4. Total volunteers count
    const { count: totalVolunteers } = await supabaseServer
      .from("volunteers")
      .select("id", { count: "exact", head: true });

    // 5. Volunteers breakdown by department
    const { data: volunteerRows } = await supabaseServer
      .from("volunteers")
      .select("department");

    const departmentCounts: Record<string, number> = {
      Media: 0,
      Prayer: 0,
      Ushering: 0,
      Sanitation: 0,
      Protocol: 0,
      Care: 0,
      Logistics: 0,
      Security: 0,
    };

    if (volunteerRows) {
      for (const row of volunteerRows) {
        if (row.department && departmentCounts[row.department] !== undefined) {
          departmentCounts[row.department]++;
        } else if (row.department) {
          departmentCounts[row.department] = (departmentCounts[row.department] || 0) + 1;
        }
      }
    }

    // 6. QR check-in records count
    const { count: totalCheckins } = await supabaseServer
      .from("qr_checkins")
      .select("id", { count: "exact", head: true });

    // 7. Content Counts (if CMS tables exist)
    let cmsCounts = {
      siteContentCount: 0,
      ministersCount: 0,
      faqsCount: 0,
      announcementsCount: 0,
    };

    try {
      const { count: sc } = await supabaseServer.from("site_content").select("id", { count: "exact", head: true });
      const { count: mc } = await supabaseServer.from("ministers").select("id", { count: "exact", head: true });
      const { count: fc } = await supabaseServer.from("faqs").select("id", { count: "exact", head: true });
      const { count: ac } = await supabaseServer.from("announcements").select("id", { count: "exact", head: true });
      cmsCounts = {
        siteContentCount: sc || 0,
        ministersCount: mc || 0,
        faqsCount: fc || 0,
        announcementsCount: ac || 0,
      };
    } catch {
      // Tables may not exist yet
    }

    const attendees = totalAttendees || 0;
    const firstTime = firstTimeAttendees || 0;
    const returning = attendees - firstTime;
    const checkedIn = checkedInCount || 0;
    const checkinRate = attendees > 0 ? Math.round((checkedIn / attendees) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAttendees: attendees,
        firstTimeAttendees: firstTime,
        returningAttendees: returning,
        checkedInAttendees: checkedIn,
        checkinRate,
        totalVolunteers: totalVolunteers || 0,
        departmentCounts,
        totalCheckins: totalCheckins || 0,
        cmsCounts,
        unsupportedMetrics: [
          "External Google Analytics web pageviews (pixel required)",
          "Live livestream viewer counts (requires YouTube/Facebook API connection)",
          "Attendee geolocation mapping (GPS permission not requested at registration)",
        ],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load analytics." }, { status: 500 });
  }
}

