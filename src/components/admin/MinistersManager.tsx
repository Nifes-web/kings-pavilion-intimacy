"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CmsContentData } from "./adminTypes";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Users,
  Search,
  Upload,
} from "lucide-react";

interface MinistersManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

const LOCAL_PORTRAITS = [
  { name: "Pastor David Olayiwola", path: "/assets/ministers/portraits/david-olayiwola.jpg" },
  { name: "Pastor Amas Amajo", path: "/assets/ministers/portraits/amas-amajo.jpg" },
  { name: "Pastor Isaiah Adebambowale Adesupo", path: "/assets/ministers/portraits/isaiah-adesupo.jpg" },
  { name: "Pastor Victor Olamide", path: "/assets/ministers/portraits/victor-olamide.jpg" },
  { name: "Pastor Fikayo Afolabi", path: "/assets/ministers/portraits/fikayo-afolabi.jpg" },
  { name: "Uche Peter", path: "/assets/ministers/portraits/uche-peter.jpg" },
  { name: "Bethel Emmanuel", path: "/assets/ministers/portraits/bethel-emmanuel.jpg" },
];

export function MinistersManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: MinistersManagerProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMinister, setEditingMinister] = useState<any | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formCategory, setFormCategory] = useState("Minister");
  const [formBio, setFormBio] = useState("");
  const [formPhoto, setFormPhoto] = useState("/assets/ministers/portraits/david-olayiwola.jpg");
  const [formOrder, setFormOrder] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openAddModal = () => {
    setEditingMinister(null);
    setFormName("");
    setFormSlug("");
    setFormRole("Minister");
    setFormCategory("Minister");
    setFormBio("");
    setFormPhoto("/assets/ministers/portraits/david-olayiwola.jpg");
    setFormOrder(String((cmsData.ministers.length || 0) + 1));
    setShowModal(true);
  };

  const openEditModal = (minister: any) => {
    setEditingMinister(minister);
    setFormName(minister.name || "");
    setFormSlug(minister.slug || "");
    setFormRole(minister.role_title || "");
    setFormCategory(minister.category || "Minister");
    setFormBio(minister.biography || "");
    setFormPhoto(minister.photo_url || "/assets/ministers/portraits/david-olayiwola.jpg");
    setFormOrder(String(minister.display_order ?? 1));
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const saveMinister = async (shouldPublish: boolean) => {
    if (!formName.trim()) return;
    setIsSubmitting(true);

    const slug = formSlug.trim() || generateSlug(formName);
    const payload = {
      slug,
      name: formName.trim(),
      role_title: formRole.trim() || null,
      category: formCategory,
      biography: formBio.trim() || null,
      photo_url: formPhoto.trim() || null,
      display_order: parseInt(formOrder, 10) || 0,
    };

    try {
      const isEdit = Boolean(editingMinister && editingMinister.id && !editingMinister.id.startsWith("fallback-"));
      const mutationBody: any = {
        entity: "ministers",
        action: isEdit ? "update" : "create",
        payload,
        changeSummary: isEdit ? `Updated minister ${formName}` : `Added minister ${formName}`,
      };

      if (isEdit) {
        mutationBody.recordId = editingMinister.id;
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
        onMutateError(resData.error || "Failed to save minister.");
        return;
      }

      const savedRecord = resData.data?.record;
      const savedId = savedRecord?.id || editingMinister?.id;
      const alreadyPublished = Boolean(savedRecord?.is_published ?? editingMinister?.is_published);

      if (shouldPublish && savedId && !alreadyPublished) {
        const pubRes = await fetch("/api/admin/cms/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            entity: "ministers",
            action: "publish",
            recordId: savedId,
            changeSummary: `Published minister ${formName}`,
          }),
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) {
          onMutateError(pubData.error || "Saved, but failed to publish minister.");
          onRefreshData();
          return;
        }
      }

      onMutateSuccess(
        shouldPublish
          ? `Minister '${formName}' saved and published live.`
          : isEdit
          ? `Minister '${formName}' updated successfully.`
          : `Minister '${formName}' created as draft.`
      );
      setShowModal(false);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error while saving minister.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMinister(Boolean(editingMinister?.is_published));
  };

  const handleTogglePublish = async (minister: any) => {
    const isPublished = minister.is_published;
    const action = isPublished ? "archive" : "publish";

    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "ministers",
          action,
          recordId: minister.id,
          changeSummary: `${isPublished ? "Unpublished" : "Published"} minister ${minister.name}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || `Failed to ${action} minister.`);
        return;
      }

      onMutateSuccess(
        `Minister '${minister.name}' status set to ${isPublished ? "Unpublished" : "Published"}.`
      );
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
          entity: "ministers",
          action: "delete",
          recordId: deleteId,
          changeSummary: `Deleted minister record ${deleteId}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        onMutateError(resData.error || "Failed to delete minister.");
        return;
      }

      onMutateSuccess("Minister profile deleted successfully.");
      setDeleteId(null);
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error while deleting minister.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMinisters = cmsData.ministers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.role_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ministers by name or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
          />
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold-glow transition-all"
        >
          <Plus className="w-4 h-4 text-gray-950" />
          <span>Add New Minister</span>
        </button>
      </div>

      {/* Ministers Table */}
      <div className="rounded-3xl bg-[#15111D] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Minister Profile</th>
                <th className="px-6 py-4">Role &amp; Category</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Publication Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMinisters.map((minister) => {
                const photo =
                  minister.photo_url ||
                  minister.img ||
                  "/assets/ministers/portraits/david-olayiwola.jpg";
                const isPublished = minister.is_published;

                return (
                  <tr
                    key={minister.id || minister.slug}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                          <Image
                            src={photo}
                            alt={minister.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {minister.name}
                          </span>
                          <span className="text-gray-400 text-[11px] font-mono">
                            /{minister.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">
                          {minister.role_title || "Facilitator"}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-brand-goldYellow">
                          {minister.category || "Minister"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-300 font-mono font-bold">
                      #{minister.display_order ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(minister)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          isPublished
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                        }`}
                        title="Click to toggle publish status"
                      >
                        {isPublished ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{isPublished ? "Published" : "Draft (Hidden)"}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(minister)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(minister.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMinisters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No ministers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Minister Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16121D] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-extrabold text-base text-white">
                {editingMinister ? "Edit Minister Profile" : "Add New Minister"}
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
                  Minister Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingMinister) {
                      setFormSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. Pastor David Olayiwola"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. david-olayiwola"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D1728] border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  >
                    <option value="Minister">Minister</option>
                    <option value="Guest Minister">Guest Minister</option>
                    <option value="Minstrel">Minstrel / Psalmist</option>
                    <option value="Convener">Convener / Host</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Senior Pastor / Guest Speaker"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Portrait Photograph
                  </label>
                  <label className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-goldYellow/15 hover:bg-brand-goldYellow/25 text-brand-goldYellow cursor-pointer border border-brand-goldYellow/30 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("category", "portrait");
                          formData.append("altText", formName || file.name);

                          const res = await fetch("/api/admin/media/upload", {
                            method: "POST",
                            headers: { "x-csrf-token": csrfToken },
                            body: formData,
                          });
                          const data = await res.json();
                          if (res.ok && data.success && data.asset) {
                            setFormPhoto(data.asset.url);
                            onMutateSuccess(`Uploaded new portrait: ${data.asset.name}`);
                          } else {
                            onMutateError(data.error || "Failed to upload photo");
                          }
                        } catch {
                          onMutateError("Network error uploading photo");
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    placeholder="/assets/ministers/portraits/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                  />
                  {/* Quick Select Buttons from Existing Portraits */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 block w-full">
                      Quick select verified portrait asset:
                    </span>
                    {LOCAL_PORTRAITS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormPhoto(p.path)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          formPhoto === p.path
                            ? "bg-brand-goldYellow text-gray-950 font-bold border-brand-goldYellow"
                            : "bg-white/5 text-gray-400 hover:text-white border-white/10"
                        }`}
                      >
                        {p.name.split(" ")[1] || p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Ministerial Biography
                </label>
                <textarea
                  rows={4}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Enter detailed biographical notes, ministry assignment, education, etc."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingMinister?.is_published ? "Save & Update Live" : "Save Draft"}</span>
                  )}
                </button>
                {!editingMinister?.is_published && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => saveMinister(true)}
                    className="flex-1 py-3 rounded-full text-xs font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                    ) : (
                      <span>Save &amp; Publish Live</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#16121D] rounded-3xl border border-red-500/30 p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="font-bold text-base text-white">
              Delete Minister Profile?
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this minister profile? This action will remove the minister from the database and public directory.
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
                  <span>Delete Profile</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

