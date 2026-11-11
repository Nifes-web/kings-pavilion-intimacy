import fs from "fs";
import path from "path";
import { supabaseServer } from "@/lib/supabaseClient";

export interface ContentRevision {
  id: string;
  section_key: string;
  version: number;
  title: string;
  subtitle: string;
  content: Record<string, any>;
  author: string;
  change_summary: string;
  created_at: string;
}

const REVISIONS_FILE = path.join(process.cwd(), "src", "data", "contentRevisions.json");

export async function getRevisions(sectionKey?: string): Promise<ContentRevision[]> {
  let revisions: ContentRevision[] = [];

  // A. Try reading from Supabase if table exists
  try {
    let query = supabaseServer
      .from("content_revisions")
      .select("*")
      .order("created_at", { ascending: false });

    if (sectionKey) {
      query = query.eq("section_key", sectionKey);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as ContentRevision[];
    }
  } catch {
    // Fallback
  }

  // B. Fallback to local persistent JSON
  try {
    if (fs.existsSync(REVISIONS_FILE)) {
      const raw = fs.readFileSync(REVISIONS_FILE, "utf8");
      revisions = JSON.parse(raw);
      if (sectionKey) {
        revisions = revisions.filter((r) => r.section_key === sectionKey);
      }
      return revisions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    console.error("[RevisionService] Failed to read revisions file:", err);
  }

  return [];
}

export async function recordRevision({
  sectionKey,
  title,
  subtitle,
  content,
  author = "admin@kingspavilion.org",
  changeSummary = "Content updated via Main Admin CMS",
}: {
  sectionKey: string;
  title: string;
  subtitle: string;
  content: Record<string, any>;
  author?: string;
  changeSummary?: string;
}): Promise<ContentRevision> {
  const allRevisions = await getRevisions();
  const sectionRevs = allRevisions.filter((r) => r.section_key === sectionKey);
  const nextVersion = sectionRevs.length > 0 ? Math.max(...sectionRevs.map((r) => r.version)) + 1 : 1;

  const newRevision: ContentRevision = {
    id: `rev-${sectionKey}-v${nextVersion}-${Date.now()}`,
    section_key: sectionKey,
    version: nextVersion,
    title,
    subtitle,
    content,
    author,
    change_summary: changeSummary,
    created_at: new Date().toISOString(),
  };

  // 1. Try persisting to Supabase
  try {
    await supabaseServer.from("content_revisions").insert(newRevision);
  } catch {
    // Silent fallback
  }

  // 2. Persist to local JSON file
  try {
    allRevisions.unshift(newRevision);
    fs.writeFileSync(REVISIONS_FILE, JSON.stringify(allRevisions, null, 2), "utf8");
  } catch (err) {
    console.error("[RevisionService] Failed to write revision to disk:", err);
  }

  return newRevision;
}

export async function restoreRevision(
  revisionId: string,
  restoredBy: string
): Promise<{ success: boolean; restored?: ContentRevision; error?: string }> {
  const allRevisions = await getRevisions();
  const target = allRevisions.find((r) => r.id === revisionId);

  if (!target) {
    return { success: false, error: "Revision not found." };
  }

  // Record a new revision representing the restore action
  const restoredRevision = await recordRevision({
    sectionKey: target.section_key,
    title: target.title,
    subtitle: target.subtitle,
    content: target.content,
    author: restoredBy,
    changeSummary: `Restored from version ${target.version} (${new Date(target.created_at).toLocaleDateString()})`,
  });

  // Update Supabase site_content
  try {
    await supabaseServer
      .from("site_content")
      .update({
        title: target.title,
        subtitle: target.subtitle,
        content: target.content,
        version: restoredRevision.version,
        updated_at: new Date().toISOString(),
      })
      .eq("section_key", target.section_key);
  } catch {
    // Fallback
  }

  return { success: true, restored: restoredRevision };
}

