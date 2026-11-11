"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  X,
  Lock,
} from "lucide-react";
import { AuditLogEntry } from "@/lib/auditService";

export function AuditLogsManager() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entity", entityFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCsv = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Action", "Entity", "Record ID", "Actor", "IP Address"];
    const rows = logs.map((l) => [
      l.created_at,
      l.action,
      l.table_name,
      l.record_id || "",
      l.admin_email,
      l.ip_address || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kings-pavilion-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#120E1A] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Immutable Activity &amp; Audit Logs</h2>
          </div>
          <p className="text-xs text-gray-400">
            Cryptographically sealed and trigger-protected activity stream. UPDATE, DELETE, and TRUNCATE operations are rejected at the database engine level.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-40 flex items-center gap-2 transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-brand-goldYellow" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#15111D] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by admin email, entity or record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09080E] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-goldYellow"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#09080E] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-goldYellow"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="publish">Publish</option>
            <option value="archive">Archive</option>
            <option value="restore">Restore</option>
            <option value="backup">Backup</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-[#09080E] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-goldYellow"
          >
            <option value="all">All Entities</option>
            <option value="site_content">Site Content</option>
            <option value="ministers">Ministers</option>
            <option value="faqs">FAQs</option>
            <option value="announcements">Announcements</option>
            <option value="media_assets">Media Assets</option>
            <option value="site_settings">Site Settings</option>
            <option value="backups">Backups</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#15111D] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D0A14] text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Record ID / Key</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-goldYellow mb-2" />
                    <span>Loading tamper-proof audit trail...</span>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const isDelete = log.action === "delete";
                  const isPublish = log.action === "publish";
                  const isRestore = log.action === "restore";

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isDelete
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : isPublish
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isRestore
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-200">{log.table_name}</td>
                      <td className="py-3 px-4 font-mono text-gray-400 truncate max-w-[140px]">
                        {log.record_id || "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{log.admin_email}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px]"
                        >
                          Inspect Diff
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No audit records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Audit Log Inspection</h3>
                <span className="text-xs text-gray-400 font-mono">{selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">Actor</span>
                <strong className="text-white">{selectedLog.admin_email}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">Timestamp</span>
                <strong className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</strong>
              </div>
            </div>

            {/* Payloads */}
            <div className="space-y-4">
              {selectedLog.old_data && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Previous State (old_data)
                  </span>
                  <pre className="p-3 rounded-xl bg-[#09080E] border border-white/10 text-[11px] font-mono text-gray-300 max-h-40 overflow-y-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    New Applied State (new_data)
                  </span>
                  <pre className="p-3 rounded-xl bg-[#09080E] border border-white/10 text-[11px] font-mono text-gray-300 max-h-40 overflow-y-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

