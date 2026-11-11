import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";
import {
  FALLBACK_MINISTERS,
  FALLBACK_SITE_CONTENT,
} from "@/lib/contentService";
import { PLACEHOLDER_FAQS, PLACEHOLDER_TESTIMONIES } from "@/data/eventData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authorize Main Admin
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    );
  }

  if (admin.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only main_admin can access CMS content management." },
      { status: 403 }
    );
  }

  let dbConnected = true;
  let migrationPending = false;

  // 2. Fetch site_content
  let siteContent: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("site_content")
      .select("*")
      .order("section_key");
    if (error) {
      if (error.code === "PGRST205" || error.message.includes("does not exist")) {
        dbConnected = false;
        migrationPending = true;
      }
    } else if (data) {
      siteContent = data;
    }
  } catch {
    dbConnected = false;
    migrationPending = true;
  }

  // If site_content empty or table doesn't exist, provide initial fallback list
  if (siteContent.length === 0) {
    siteContent = Object.entries(FALLBACK_SITE_CONTENT).map(([key, val]) => ({
      id: `fallback-${key}`,
      section_key: key,
      title: val.title,
      subtitle: val.subtitle || "",
      content: val.content,
      status: "draft",
      version: 1,
      updated_at: new Date().toISOString(),
    }));
  }

  // 3. Fetch ministers
  let ministers: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("ministers")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) {
      ministers = data;
    }
  } catch {
    // Graceful fallback
  }

  if (ministers.length === 0) {
    ministers = FALLBACK_MINISTERS.map((m) => ({
      ...m,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  // 4. Fetch faqs
  let faqs: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) {
      faqs = data;
    }
  } catch {
    // Graceful fallback
  }

  if (faqs.length === 0) {
    faqs = PLACEHOLDER_FAQS.map((f, i) => ({
      id: f.id,
      slug: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      display_order: i + 1,
      is_published: false,
      created_at: new Date().toISOString(),
    }));
  }

  // 5. Fetch announcements
  let announcements: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      announcements = data;
    }
  } catch {
    // Graceful fallback
  }

  // 6. Fetch site_settings
  let siteSettings: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("site_settings")
      .select("*")
      .order("key");
    if (!error && data) {
      siteSettings = data;
    }
  } catch {
    // Graceful fallback
  }

  // 7. Fetch testimonies
  let testimonies: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("testimonies")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      testimonies = data;
    }
  } catch {
    // Graceful fallback
  }

  if (testimonies.length === 0) {
    testimonies = PLACEHOLDER_TESTIMONIES.map((t) => ({
      id: t.id,
      slug: t.slug,
      testifier_name: t.testifierName,
      content: t.fullTestimony || t.excerpt,
      profile_image: t.profilePhotoPath || null,
      status: "draft",
      published: false,
      category: "Breakthrough",
      display_order: 1,
      created_at: t.createdAt,
    }));
  }

  // 8. Fetch audit logs (service_role query)
  let auditLogs: any[] = [];
  try {
    const { data, error } = await supabaseServer
      .from("content_audit_logs")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(30);
    if (!error && data) {
      auditLogs = data;
    }
  } catch {
    // Graceful fallback
  }

  return NextResponse.json({
    success: true,
    dbConnected,
    migrationPending,
    siteContent,
    ministers,
    faqs,
    announcements,
    siteSettings,
    testimonies,
    auditLogs,
  });
}

