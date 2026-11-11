import fs from "fs";
import path from "path";
import { supabaseServer } from "@/lib/supabaseClient";

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id?: string | null;
  action: "create" | "update" | "delete" | "publish" | "archive" | "reject" | "restore" | "login" | "backup";
  admin_email: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

const AUDIT_FILE = path.join(process.cwd(), "src", "data", "auditLogRegistry.json");

export async function getAuditLogs(params?: {
  action?: string;
  entity?: string;
  search?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const limit = params?.limit || 100;

  // A. Try Supabase
  try {
    let query = supabaseServer
      .from("content_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (params?.action && params.action !== "all") {
      query = query.eq("action", params.action);
    }
    if (params?.entity && params.entity !== "all") {
      query = query.eq("table_name", params.entity);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as AuditLogEntry[];
    }
  } catch {
    // Fallback
  }

  // B. Fallback to local persistent JSON
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, "utf8");
      let entries: AuditLogEntry[] = JSON.parse(raw);

      if (params?.action && params.action !== "all") {
        entries = entries.filter((e) => e.action === params.action);
      }
      if (params?.entity && params.entity !== "all") {
        entries = entries.filter((e) => e.table_name === params.entity);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        entries = entries.filter(
          (e) =>
            e.admin_email.toLowerCase().includes(s) ||
            e.table_name.toLowerCase().includes(s) ||
            (e.record_id && e.record_id.toLowerCase().includes(s))
        );
      }

      return entries
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    }
  } catch (err) {
    console.error("[AuditService] Failed to read audit logs:", err);
  }

  return [];
}

export async function recordAuditLogEntry({
  tableName,
  recordId,
  action,
  adminEmail,
  oldData = null,
  newData = null,
  ipAddress = "127.0.0.1",
  userAgent = "Antigravity Main Admin Console",
}: {
  tableName: string;
  recordId?: string | null;
  action: AuditLogEntry["action"];
  adminEmail: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    table_name: tableName,
    record_id: recordId,
    action,
    admin_email: adminEmail,
    old_data: oldData,
    new_data: newData,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  };

  // Try Supabase insert
  try {
    await supabaseServer.from("content_audit_logs").insert({
      table_name: tableName,
      record_id: recordId,
      action: action === "restore" || action === "login" || action === "backup" ? "update" : action,
      admin_email: adminEmail,
      old_data: oldData,
      new_data: newData,
    });
  } catch {
    // Fallback
  }

  // Persist locally
  try {
    let currentLogs: AuditLogEntry[] = [];
    if (fs.existsSync(AUDIT_FILE)) {
      currentLogs = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
    }
    currentLogs.unshift(entry);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(currentLogs.slice(0, 500), null, 2), "utf8");
  } catch (err) {
    console.error("[AuditService] Failed to write audit log locally:", err);
  }

  return entry;
}

