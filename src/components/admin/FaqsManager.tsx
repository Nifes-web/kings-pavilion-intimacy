"use client";

import React, { useState } from "react";
import { CmsContentData } from "./adminTypes";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Loader2,
} from "lucide-react";

interface FaqsManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

export function FaqsManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: FaqsManagerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);

  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [order, setOrder] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openAddModal = () => {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setCategory("general");
    setOrder(String((cmsData.faqs.length || 0) + 1));
    setShowModal(true);
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setQuestion(faq.question || "");
    setAnswer(faq.answer || "");
    setCategory(faq.category || "general");
    setOrder(String(faq.display_order ?? 1));
    setShowModal(true);
  };

  const generateSlug = (q: string) => {
    return q
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const slug = editingFaq?.slug || `faq-${generateSlug(question)}-${Date.now().toString().slice(-4)}`;
    const payload = {
      slug,
      question: question.trim(),
      answer: answer.trim(),
      category,
      display_order: parseInt(order, 10) || 0,
    };

    try {
      const isEdit = Boolean(editingFaq && editingFaq.id && !editingFaq.id.startsWith("faq-"));
      const mutationBody: any = {
        entity: "faqs",
        action: isEdit ? "update" : "create",
        payload,
        changeSummary: isEdit ? `Updated FAQ: ${question.slice(0, 30)}` : `Created FAQ: ${question.slice(0, 30)}`,
      };

      if (isEdit) {
        mutationBody.recordId = editingFaq.id;
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
        onMutateError(resData.error || "Failed to save FAQ.");
        return;
      }

      onMutateSuccess(isEdit ? "FAQ updated successfully." : "FAQ created successfully.");
      setShowModal(false);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error while saving FAQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (faq: any) => {
    const isPublished = faq.is_published;
    const action = isPublished ? "archive" : "publish";

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "faqs",
          action,
          recordId: faq.id,
          changeSummary: `${isPublished ? "Unpublished" : "Published"} FAQ ${faq.id}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || `Failed to ${action} FAQ.`);
        return;
      }

      onMutateSuccess(`FAQ status updated to ${isPublished ? "Unpublished" : "Published"}.`);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error updating publication status.");
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
          entity: "faqs",
          action: "delete",
          recordId: deleteId,
          changeSummary: `Deleted FAQ record ${deleteId}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to delete FAQ.");
        return;
      }

      onMutateSuccess("FAQ deleted successfully.");
      setDeleteId(null);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error while deleting FAQ.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFaqs = cmsData.faqs.filter((f) => {
    const matchesCategory =
      selectedCategory === "all" || f.category === selectedCategory;
    const matchesSearch =
      f.question?.toLowerCase().includes(search.toLowerCase()) ||
      f.answer?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#15111D] p-1 rounded-2xl border border-white/10">
            {["all", "general", "venue", "registration", "volunteering"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? "bg-brand-goldYellow text-gray-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold-glow transition-all"
        >
          <Plus className="w-4 h-4 text-gray-950" />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isPublished = faq.is_published;
          return (
            <div
              key={faq.id || faq.slug}
              className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-3 hover:border-white/20 transition-all shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-brand-goldYellow shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {faq.question}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-gray-300">
                        {faq.category}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        Order: #{faq.display_order ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleTogglePublish(faq)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                      isPublished
                        ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                    }`}
                  >
                    {isPublished ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isPublished ? "Published" : "Draft"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(faq)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteId(faq.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 pl-11 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400 rounded-3xl bg-[#15111D] border border-white/10">
            No FAQs found matching your criteria.
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16121D] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-extrabold text-base text-white">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
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
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Is registration completely free?"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D1728] border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  >
                    <option value="general">General</option>
                    <option value="venue">Venue &amp; Location</option>
                    <option value="registration">Registration</option>
                    <option value="volunteering">Volunteering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Answer *
                </label>
                <textarea
                  rows={4}
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter helpful, informative answer..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
                />
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
                    <span>{editingFaq ? "Save FAQ" : "Create FAQ"}</span>
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
            <h3 className="font-bold text-base text-white">Delete FAQ?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this FAQ item?
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
                  <span>Delete FAQ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

