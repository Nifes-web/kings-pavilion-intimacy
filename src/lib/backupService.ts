import fs from "fs";
import path from "path";
import { supabaseServer } from "@/lib/supabaseClient";
import { getMediaAssets, getAssetAssignments, saveAssetAssignment } from "@/lib/mediaService";
import { recordAuditLogEntry } from "@/lib/auditService";

export interface BackupSnapshotMeta {
  id: string;
  filename: string;
  created_at: string;
  created_by: string;
  size_bytes: number;
  entity_counts: {
    site_content: number;
    ministers: number;
    faqs: number;
    announcements: number;
    site_settings: number;
    testimonies: number;
    media_assets: number;
  };
}

export interface BackupPayload {
  meta: BackupSnapshotMeta;
  data: {
    site_content: any[];
    ministers: any[];
    faqs: any[];
    announcements: any[];
    site_settings: any[];
    testimonies: any[];
    media_assets: any[];
    asset_assignments: Record<string, any>;
  };
  media_manifest: {
    system_assets_count: number;
    uploaded_assets_count: number;
  };
}

const BACKUPS_DIR = path.join(process.cwd(), "data", "backups");

export async function createBackupSnapshot(adminEmail: string): Promise<BackupSnapshotMeta> {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // 1. Gather all datasets
  let siteContent: any[] = [];
  let ministers: any[] = [];
  let faqs: any[] = [];
  let announcements: any[] = [];
  let siteSettings: any[] = [];
  let testimonies: any[] = [];

  try {
    const [sc, m, f, a, ss, t] = await Promise.all([
      supabaseServer.from("site_content").select("*"),
      supabaseServer.from("ministers").select("*"),
      supabaseServer.from("faqs").select("*"),
      supabaseServer.from("announcements").select("*"),
      supabaseServer.from("site_settings").select("*"),
      supabaseServer.from("testimonies").select("*"),
    ]);

    siteContent = sc.data || [];
    ministers = m.data || [];
    faqs = f.data || [];
    announcements = a.data || [];
    siteSettings = ss.data || [];
    testimonies = t.data || [];
  } catch {
    // Fallback
  }

  const mediaAssets = await getMediaAssets();
  const assetAssignments = await getAssetAssignments();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotId = `snapshot-${timestamp}`;
  const filename = `${snapshotId}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const payload: BackupPayload = {
    meta: {
      id: snapshotId,
      filename,
      created_at: new Date().toISOString(),
      created_by: adminEmail,
      size_bytes: 0,
      entity_counts: {
        site_content: siteContent.length,
        ministers: ministers.length,
        faqs: faqs.length,
        announcements: announcements.length,
        site_settings: siteSettings.length,
        testimonies: testimonies.length,
        media_assets: mediaAssets.length,
      },
    },
    data: {
      site_content: siteContent,
      ministers,
      faqs,
      announcements,
      site_settings: siteSettings,
      testimonies,
      media_assets: mediaAssets,
      asset_assignments: assetAssignments,
    },
    media_manifest: {
      system_assets_count: mediaAssets.filter((m) => m.is_system).length,
      uploaded_assets_count: mediaAssets.filter((m) => !m.is_system).length,
    },
  };

  const serialized = JSON.stringify(payload, null, 2);
  payload.meta.size_bytes = Buffer.byteLength(serialized, "utf8");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

  await recordAuditLogEntry({
    tableName: "backups",
    recordId: snapshotId,
    action: "backup",
    adminEmail,
    newData: payload.meta as any,
  });

  return payload.meta;
}

export async function listBackupSnapshots(): Promise<BackupSnapshotMeta[]> {
  if (!fs.existsSync(BACKUPS_DIR)) return [];

  const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith(".json"));
  const snapshots: BackupSnapshotMeta[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BACKUPS_DIR, file), "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.meta) {
        snapshots.push(parsed.meta);
      }
    } catch {
      // Ignore corrupt backup file
    }
  }

  return snapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function restoreBackupSnapshot(
  snapshotId: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string; restoredMeta?: BackupSnapshotMeta }> {
  const filePath = path.join(BACKUPS_DIR, `${snapshotId}.json`);
  if (!fs.existsSync(filePath)) {
    return { success: false, error: "Snapshot file not found." };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const payload: BackupPayload = JSON.parse(raw);

    if (!payload.data || !payload.meta) {
      return { success: false, error: "Invalid backup format." };
    }

    // 1. Restore asset assignments
    if (payload.data.asset_assignments) {
      for (const [key, val] of Object.entries(payload.data.asset_assignments)) {
        await saveAssetAssignment(key, val);
      }
    }

    // 2. Try restoring Supabase records if tables exist
    try {
      if (payload.data.site_content?.length > 0) {
        await supabaseServer.from("site_content").upsert(payload.data.site_content);
      }
      if (payload.data.ministers?.length > 0) {
        await supabaseServer.from("ministers").upsert(payload.data.ministers);
      }
      if (payload.data.faqs?.length > 0) {
        await supabaseServer.from("faqs").upsert(payload.data.faqs);
      }
      if (payload.data.announcements?.length > 0) {
        await supabaseServer.from("announcements").upsert(payload.data.announcements);
      }
      if (payload.data.site_settings?.length > 0) {
        await supabaseServer.from("site_settings").upsert(payload.data.site_settings);
      }
    } catch {
      // Graceful fallback
    }

    await recordAuditLogEntry({
      tableName: "backups",
      recordId: snapshotId,
      action: "restore",
      adminEmail,
      newData: { restored_snapshot: snapshotId, restored_counts: payload.meta.entity_counts },
    });

    return { success: true, restoredMeta: payload.meta };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to restore backup snapshot." };
  }
}

