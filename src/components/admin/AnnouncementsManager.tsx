"use client";

import React, { useState } from "react";
import { CmsContentData } from "./adminTypes";
import {
  Plus,
  Edit2,
  Trash2,
  Megaphone,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface AnnouncementsManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

export function AnnouncementsManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: AnnouncementsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("2026-12-05");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setPriority("normal");
    setIsActive(true);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("2026-12-05");
    setShowModal(true);
  };

  const openEditModal = (a: any) => {
    setEditingAnnouncement(a);
    setTitle(a.title || "");
    setContent(a.content || "");
    setPriority(a.priority || "normal");
    setIsActive(Boolean(a.is_active));
    setStartDate(a.start_date ? a.start_date.slice(0, 10) : "");
    setEndDate(a.end_date ? a.end_date.slice(0, 10) : "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const slug =
      editingAnnouncement?.slug ||
      `ann-${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30)}-${Date.now().toString().slice(-4)}`;

    const payload = {
      slug,
      title: title.trim(),
      content: content.trim(),
      priority,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
    };

    try {
      const isEdit = Boolean(
        editingAnnouncement &&
        editingAnnouncement.id &&
        !editingAnnouncement.id.startsWith("fallback-")
      );

      const mutationBody: any = {
        entity: "announcements",
        action: isEdit ? "update" : "create",
        payload,
        changeSummary: isEdit
          ? `Updated announcement: ${title}`
          : `Created announcement: ${title}`,
      };

      if (isEdit) {
        mutationBody.recordId = editingAnnouncement.id;
      }

      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(mutationBody),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to save announcement.");
        return;
      }

      onMutateSuccess(
        isEdit ? "Announcement updated successfully." : "Announcement created successfully."
      );
      setShowModal(false);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error while saving announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (a: any) => {
    const nextActive = !a.is_active;

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "announcements",
          action: nextActive ? "publish" : "archive",
          recordId: a.id,
          changeSummary: `${nextActive ? "Activated" : "Deactivated"} announcement ${a.title}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to toggle announcement status.");
        return;
      }

      onMutateSuccess(`Announcement set to ${nextActive ? "Active" : "Archived"}.`);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error updating announcement.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "announcements",
          action: "delete",
          recordId: deleteId,
          changeSummary: `Deleted announcement ${deleteId}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to delete announcement.");
        return;
      }

      onMutateSuccess("Announcement deleted successfully.");
      setDeleteId(null);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error deleting announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Active &amp; Scheduled Announcements
          </h2>
          <p className="text-xs text-gray-400">
            Broadcast emergency updates, prayer schedules, or arrival guidelines across the website.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold-glow transition-all"
        >
          <Plus className="w-4 h-4 text-gray-950" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="space-y-3">
        {cmsData.announcements && cmsData.announcements.length > 0 ? (
          cmsData.announcements.map((a) => {
            const isPriorityUrgent = a.priority === "urgent";
            const isPriorityHigh = a.priority === "high";

            const now = new Date();
            const start = a.start_date ? new Date(a.start_date) : null;
            const end = a.end_date ? new Date(a.end_date) : null;
            const isFuture = a.is_active && start && start > now;
            const isExpired = a.is_active && end && end < now;
            const isLiveNow = a.is_active && (!start || start <= now) && (!end || end >= now);

            return (
              <div
                key={a.id || a.slug}
                className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-3 hover:border-white/20 transition-all shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isPriorityUrgent
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : isPriorityHigh
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {a.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isPriorityUrgent
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : isPriorityHigh
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {a.priority} priority
                        </span>

                        {/* Lifecycle Status Pill */}
                        {isLiveNow && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Live Broadcast</span>
                          </span>
                        )}
                        {isFuture && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Scheduled ({start ? start.toLocaleDateString() : ""})
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Expired (Auto-Hidden)
                          </span>
                        )}
                        {!a.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-500/15 text-gray-400 border border-gray-500/30">
                            Draft / Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleActive(a)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        a.is_active
                          ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20"
                      }`}
                    >
                      {a.is_active ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span>{a.is_active ? "Enabled" : "Disabled"}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(a)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteId(a.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 pl-11 leading-relaxed">
                  {a.content}
                </p>

                <div className="pl-11 flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pt-1">
                  <span>Start: <strong>{a.start_date ? new Date(a.start_date).toLocaleDateString() : "Immediate"}</strong></span>
                  <span>&bull;</span>
                  <span>Expires: <strong>{a.end_date ? new Date(a.end_date).toLocaleDateString() : "Never"}</strong></span>
                  {isExpired && (
                    <button
                      onClick={async () => {
                        const newEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
                        try {
                          await fetch("/api/admin/cms/mutate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
                            body: JSON.stringify({
                              entity: "announcements",
                              action: "update",
                              recordId: a.id,
                              payload: { end_date: newEnd, is_active: true },
                              changeSummary: "Extended expiration by 7 days",
                            }),
                          });
                          onMutateSuccess("Announcement renewed for 7 additional days!");
                          onRefreshData();
                        } catch {
                          onMutateError("Failed to renew announcement");
                        }
                      }}
                      className="text-xs text-brand-goldYellow font-bold hover:underline ml-2"
                    >
                      + Extend 7 Days
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-gray-400 rounded-3xl bg-[#15111D] border border-white/10 space-y-1">
            <p>No announcements currently posted.</p>
            <p className="text-[11px] text-gray-400">Click &quot;New Announcement&quot; above to create a notice.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16121D] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-extrabold text-base text-white">
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official Registration Now Open"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1D1728] border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                >
                  <option value="low">Low Priority (General Note)</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority (Important Update)</option>
                  <option value="urgent">Urgent Priority (Emergency Notice)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Announcement Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter details of the notice..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    End Date (Expiration)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                  ) : (
                    <span>{editingAnnouncement ? "Save Changes" : "Post Notice"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#16121D] rounded-3xl border border-red-500/30 p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Delete Announcement?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this announcement?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-500 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

