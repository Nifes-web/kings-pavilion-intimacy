"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileJson,
  Calendar,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { BackupSnapshotMeta } from "@/lib/backupService";

interface BackupRecoveryProps {
  csrfToken: string;
  onShowFeedback: (type: "success" | "error" | "info", msg: string) => void;
}

export function BackupRecoveryManager({ csrfToken, onShowFeedback }: BackupRecoveryProps) {
  const [snapshots, setSnapshots] = useState<BackupSnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backups");
      const data = await res.json();
      if (res.ok && data.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const headers: Record<string, string> = {};
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create backup.");
      }

      onShowFeedback("success", `Backup snapshot created: ${data.snapshot.id}`);
      await fetchSnapshots();
    } catch (err: any) {
      onShowFeedback("error", err.message || "Failed to generate backup.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (snapshotId: string) => {
    const confirm = window.confirm(
      `CAUTION: Restoring from snapshot "${snapshotId}" will overwrite current content and settings with the archived state. Proceed?`
    );
    if (!confirm) return;

    setRestoringId(snapshotId);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      const res = await fetch("/api/admin/backups/restore", {
        method: "POST",
        headers,
        body: JSON.stringify({ snapshotId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to restore snapshot.");
      }

      onShowFeedback("success", `System successfully restored to state of ${snapshotId}!`);
    } catch (err: any) {
      onShowFeedback("error", err.message || "Restore failed.");
    } finally {
      setRestoringId(null);
    }
  };

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#120E1A] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-goldYellow" />
            <h2 className="text-xl font-bold text-white">Database Content &amp; Media Backup System</h2>
          </div>
          <p className="text-xs text-gray-400">
            Export point-in-time snapshots of all website content, ministers, media manifests, and settings.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110 disabled:opacity-50 flex items-center gap-2 shadow-gold-glow transition-all shrink-0"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Snapshot...</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              <span>Create New Backup Snapshot</span>
            </>
          )}
        </button>
      </div>

      {/* Snapshots Grid / List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Available Backup Snapshots ({snapshots.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-goldYellow mb-2" />
            <span className="text-xs">Reading backup repository...</span>
          </div>
        ) : snapshots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-4 shadow-lg hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-goldYellow/10 text-brand-goldYellow shrink-0">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-xs">{snap.id}</h4>
                      <span className="text-[11px] text-gray-400">
                        {new Date(snap.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-gray-400 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                    {(snap.size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>

                {/* Entity Counts Strip */}
                <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-300 pt-2 border-t border-white/5">
                  <div className="p-1.5 rounded bg-[#09080E] text-center">
                    <span className="text-gray-500 block">Content</span>
                    <strong className="text-white">{snap.entity_counts.site_content}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#09080E] text-center">
                    <span className="text-gray-500 block">Ministers</span>
                    <strong className="text-white">{snap.entity_counts.ministers}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#09080E] text-center">
                    <span className="text-gray-500 block">FAQs</span>
                    <strong className="text-white">{snap.entity_counts.faqs}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#09080E] text-center">
                    <span className="text-gray-500 block">Media</span>
                    <strong className="text-white">{snap.entity_counts.media_assets}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <a
                    href={`/api/admin/backups/download?id=${snap.id}`}
                    download
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-goldYellow" />
                    <span>Download JSON</span>
                  </a>

                  <button
                    onClick={() => handleRestore(snap.id)}
                    disabled={restoringId === snap.id}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {restoringId === snap.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span>Restore Snapshot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#15111D] border border-white/10 text-center text-xs text-gray-400">
            No snapshots created yet. Click &quot;Create New Backup Snapshot&quot; above to capture current state.
          </div>
        )}
      </div>

      {/* Production Disaster Recovery Reference Procedures */}
      <div className="p-6 rounded-2xl bg-[#09080E] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-goldYellow" />
          <h3 className="text-sm font-bold text-white">PostgreSQL &amp; Production Recovery Procedures</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          For full disaster recovery or database-level replication, execute these verified CLI commands:
        </p>

        <div className="space-y-3">
          {/* Command 1: pg_dump */}
          <div className="p-3.5 rounded-xl bg-[#120E1A] border border-white/10 flex items-center justify-between gap-4">
            <code className="text-xs font-mono text-emerald-400 select-all overflow-x-auto">
              pg_dump -h db.itgpcyuuhlujllpbcvkf.supabase.co -U postgres -d postgres -F c -b -v -f intimacy_cms_backup.dump
            </code>
            <button
              onClick={() =>
                copyCommand(
                  "pg_dump -h db.itgpcyuuhlujllpbcvkf.supabase.co -U postgres -d postgres -F c -b -v -f intimacy_cms_backup.dump",
                  "cmd-pgdump"
                )
              }
              className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              title="Copy Command"
            >
              {copiedCmd === "cmd-pgdump" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Command 2: restore */}
          <div className="p-3.5 rounded-xl bg-[#120E1A] border border-white/10 flex items-center justify-between gap-4">
            <code className="text-xs font-mono text-amber-300 select-all overflow-x-auto">
              pg_restore -h db.itgpcyuuhlujllpbcvkf.supabase.co -U postgres -d postgres -v --clean intimacy_cms_backup.dump
            </code>
            <button
              onClick={() =>
                copyCommand(
                  "pg_restore -h db.itgpcyuuhlujllpbcvkf.supabase.co -U postgres -d postgres -v --clean intimacy_cms_backup.dump",
                  "cmd-pgrestore"
                )
              }
              className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              title="Copy Command"
            >
              {copiedCmd === "cmd-pgrestore" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

