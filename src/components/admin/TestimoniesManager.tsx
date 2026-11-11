"use client";

import React, { useState } from "react";
import { CmsContentData } from "./adminTypes";
import {
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Search,
  Loader2,
  User,
  Quote,
} from "lucide-react";

interface TestimoniesManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

export function TestimoniesManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: TestimoniesManagerProps) {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "rejected">("all");
  const [search, setSearch] = useState("");

  // Reject modal
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Edit modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Breakthrough");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleApprovePublish = async (item: any) => {
    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "testimonies",
          action: "publish",
          recordId: item.id,
          changeSummary: `Approved and published testimony by ${item.testifier_name}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to publish testimony.");
        return;
      }

      onMutateSuccess(`Testimony by '${item.testifier_name}' published live.`);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error publishing testimony.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setIsRejecting(true);

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "testimonies",
          action: "reject",
          recordId: rejectingItem.id,
          payload: {
            rejection_reason: rejectionReason.trim(),
          },
          changeSummary: `Rejected testimony by ${rejectingItem.testifier_name}: ${rejectionReason.slice(0, 30)}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to reject testimony.");
        return;
      }

      onMutateSuccess(`Testimony by '${rejectingItem.testifier_name}' rejected.`);
      setRejectingItem(null);
      setRejectionReason("");
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error rejecting testimony.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "testimonies",
          action: "update",
          recordId: editingItem.id,
          payload: {
            testifier_name: editName.trim(),
            content: editContent.trim(),
            category: editCategory,
          },
          changeSummary: `Edited testimony by ${editName}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to update testimony.");
        return;
      }

      onMutateSuccess("Testimony updated successfully.");
      setEditingItem(null);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error updating testimony.");
    } finally {
      setIsSavingEdit(false);
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
          entity: "testimonies",
          action: "delete",
          recordId: deleteId,
          changeSummary: `Deleted testimony ${deleteId}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to delete testimony.");
        return;
      }

      onMutateSuccess("Testimony deleted successfully.");
      setDeleteId(null);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error deleting testimony.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTestimonies = cmsData.testimonies.filter((t) => {
    const isPub = t.status === "published" || t.published === true;
    const isRej = Boolean(t.rejection_reason) || t.status === "archived";

    if (filter === "published" && !isPub) return false;
    if (filter === "draft" && (isPub || isRej)) return false;
    if (filter === "rejected" && !isRej) return false;

    const q = search.toLowerCase();
    return (
      t.testifier_name?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search testimonies by testifier or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#15111D] p-1 rounded-2xl border border-white/10">
            {[
              { id: "all", label: "All Records" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Pending Review" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.id
                    ? "bg-brand-goldYellow text-gray-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonies Cards */}
      <div className="space-y-4">
        {filteredTestimonies.map((item) => {
          const isPub = item.status === "published" || item.published === true;
          const isRej = Boolean(item.rejection_reason) || item.status === "archived";

          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-4 shadow-xl hover:border-white/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-goldYellow">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {item.testifier_name || "Anonymous Testifier"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Category: {item.category || "General"} &bull; Date:{" "}
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Status Pill */}
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                      isPub
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : isRej
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {isPub ? "Published Live" : isRej ? "Rejected" : "Pending Review"}
                  </span>

                  {!isPub && (
                    <button
                      onClick={() => handleApprovePublish(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-950 bg-green-400 hover:bg-green-300 transition-all flex items-center gap-1"
                      title="Approve and Publish to Website"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-950" />
                      <span>Approve</span>
                    </button>
                  )}

                  {!isRej && (
                    <button
                      onClick={() => {
                        setRejectingItem(item);
                        setRejectionReason("");
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center gap-1"
                      title="Reject with Reason"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditName(item.testifier_name || "");
                      setEditContent(item.content || "");
                      setEditCategory(item.category || "Breakthrough");
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                    title="Edit Testimony"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>

              {item.rejection_reason && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  <strong>Rejection Note:</strong> {item.rejection_reason}
                </div>
              )}
            </div>
          );
        })}

        {filteredTestimonies.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400 rounded-3xl bg-[#15111D] border border-white/10">
            No testimonies found for the selected view.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#16121D] rounded-3xl border border-red-500/30 p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">
              Reject Testimony
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              State the editorial or pastoral reason why this testimony cannot be published at this time.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unverified claims, duplicate submission, incomplete details..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-500 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isRejecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Reject Testimony</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#16121D] rounded-3xl border border-white/10 p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Edit Testimony</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Testifier Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Healing, Breakthrough, Deliverance"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Testimony Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-950" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#16121D] rounded-3xl border border-red-500/30 p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Delete Testimony?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to permanently delete this testimony record?
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

