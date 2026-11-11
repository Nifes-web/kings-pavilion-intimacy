"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  Eye,
  RefreshCw,
  FolderOpen,
  Settings2,
} from "lucide-react";

export interface MediaAssetItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  dimensions?: string;
  category: "flyer" | "logo" | "portrait" | "section" | "banner" | "video" | "general";
  alt_text?: string;
  description?: string;
  is_system?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AssetAssignmentItem {
  url: string;
  alt: string;
  fit: "cover" | "contain" | "fill";
  position: "center" | "top" | "bottom" | "left" | "right";
  section_name: string;
  updated_at: string;
}

export type AssetAssignmentsMap = Record<string, AssetAssignmentItem>;

interface MediaManagerProps {
  csrfToken?: string;
  onShowFeedback?: (type: "success" | "error" | "info", message: string) => void;
}

const SECTION_DEFAULTS: Record<string, { title: string; desc: string; defaultUrl: string; recommended: string }> = {
  hero_flyer: {
    title: "Homepage Hero Visual Centerpiece",
    desc: "The primary high-impact prayer altar visual framed in the hero section.",
    defaultUrl: "/assets/intimacy-flyer.jpg",
    recommended: "928 x 1024 px (Aspect 4:5)",
  },
  website_logo: {
    title: "Website Header & Footer Logo",
    desc: "Official King's Pavilion church branding displayed across the top navbar and footer.",
    defaultUrl: "/assets/kings-pavilion-logo-cropped.png",
    recommended: "420 x 140 px (Transparent PNG / SVG)",
  },
  event_flyer: {
    title: "Event Flyer (Full Resolution)",
    desc: "The complete event poster with dates, ministers, and venue details.",
    defaultUrl: "/assets/intimacy-flyer.jpg",
    recommended: "928 x 1024 px",
  },
  about_image: {
    title: "About the Bootcamp Artwork",
    desc: "Worshippers in deep prayer and travail featured in the 'Hour of Incubation' section.",
    defaultUrl: "/assets/flyer-intercession-travail.jpg",
    recommended: "600 x 750 px (Aspect 4:5)",
  },
  volunteer_image: {
    title: "Volunteer Callout & Readiness Banner",
    desc: "Altar ministers banner displayed on the volunteer service callout section.",
    defaultUrl: "/assets/flyer-fiery-warriors.jpg",
    recommended: "800 x 450 px (Aspect 16:9)",
  },
  shofar_image: {
    title: "Feature Showcase Artwork",
    desc: "Consecrated shofar blower illustration for the 'Sound of Awakening' card.",
    defaultUrl: "/assets/flyer-shofar-blower.jpg",
    recommended: "500 x 500 px (Aspect 1:1)",
  },
  seo_og_image: {
    title: "SEO & Social Sharing Card (OpenGraph)",
    desc: "Preview thumbnail generated when the website link is shared on WhatsApp, X, and Facebook.",
    defaultUrl: "/assets/intimacy-flyer.jpg",
    recommended: "1200 x 630 px",
  },
};

export function MediaManager({ csrfToken, onShowFeedback }: MediaManagerProps) {
  // Navigation tabs within Media Management
  const [activeTab, setActiveTab] = useState<"assignments" | "library" | "upload">("assignments");

  // State
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignmentsMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectorSlotKey, setSelectorSlotKey] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAssetItem | null>(null);
  const [editingAsset, setEditingAsset] = useState<MediaAssetItem | null>(null);
  const [displayAdjustSlot, setDisplayAdjustSlot] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<MediaAssetItem["category"]>("general");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Media Assets & Assignments
  const fetchMediaData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        if (data.assets) setAssets(data.assets);
        if (data.assignments) setAssignments(data.assignments);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaData();
  }, [fetchMediaData]);

  // 2. Handle Copy URL
  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onShowFeedback) {
      onShowFeedback("info", `Copied public URL: ${fullUrl}`);
    }
  };

  // 3. Handle File Selection for Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(objectUrl);
    if (!uploadAlt) {
      setUploadAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  // 4. Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      formData.append("altText", uploadAlt);
      formData.append("description", uploadDesc);

      const headers: Record<string, string> = {};
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      if (onShowFeedback) {
        onShowFeedback("success", `Media asset "${data.asset.name}" uploaded successfully!`);
      }

      // Reset form
      setUploadFile(null);
      setUploadPreviewUrl(null);
      setUploadAlt("");
      setUploadDesc("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      await fetchMediaData();

      // If in selector modal, automatically assign and close!
      if (selectorSlotKey) {
        await handleSaveAssignment(selectorSlotKey, data.asset.url, data.asset.alt_text);
        setSelectorSlotKey(null);
      } else {
        setActiveTab("library");
      }
    } catch (err: any) {
      if (onShowFeedback) {
        onShowFeedback("error", err.message || "Failed to upload file.");
      }
    } finally {
      setUploading(false);
    }
  };

  // 5. Save Assignment
  const handleSaveAssignment = async (
    slotKey: string,
    newUrl: string,
    altText?: string,
    fit?: "cover" | "contain" | "fill",
    position?: "center" | "top" | "bottom" | "left" | "right"
  ) => {
    try {
      const current = assignments[slotKey] || {};
      const payload = {
        slotKey,
        url: newUrl,
        alt: altText !== undefined ? altText : current.alt || SECTION_DEFAULTS[slotKey]?.title,
        fit: fit || current.fit || "cover",
        position: position || current.position || "center",
        section_name: SECTION_DEFAULTS[slotKey]?.title || slotKey,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update visual assignment");
      }

      setAssignments(data.assignments);

      // Real-time synchronization for global website logo
      if (slotKey === "website_logo" && typeof window !== "undefined") {
        const brandPayload = {
          logoUrl: payload.url,
          logoAlt: payload.alt,
          logoFit: payload.fit,
          logoPosition: payload.position,
          updatedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem("kp_global_branding", JSON.stringify(brandPayload));
        } catch {}
        window.dispatchEvent(new CustomEvent("kp-branding-updated", { detail: brandPayload }));
      }

      if (onShowFeedback) {
        onShowFeedback(
          "success",
          `Assigned new image to "${SECTION_DEFAULTS[slotKey]?.title || slotKey}". Live website updated!`
        );
      }
    } catch (err: any) {
      if (onShowFeedback) {
        onShowFeedback("error", err.message || "Assignment failed.");
      }
    }
  };

  // 6. Delete Asset
  const handleDeleteAsset = async (asset: MediaAssetItem) => {
    if (asset.is_system) {
      alert("System assets cannot be deleted. You may replace their assignment instead.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const headers: Record<string, string> = {};
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete asset");
      }

      if (onShowFeedback) {
        onShowFeedback("success", `Media asset "${asset.name}" deleted.`);
      }
      setEditingAsset(null);
      await fetchMediaData();
    } catch (err: any) {
      if (onShowFeedback) {
        onShowFeedback("error", err.message || "Could not delete asset.");
      }
    }
  };

  // Filtered library assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.alt_text && asset.alt_text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = categoryFilter === "all" || asset.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#120E1A] border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-goldYellow" />
            <h2 className="text-xl font-bold text-white">Media Library &amp; Asset Replacement System</h2>
          </div>
          <p className="text-xs text-gray-400">
            Upload, replace, and visually assign images across all live website sections without editing source code.
          </p>
        </div>

        {/* Sub-nav Buttons */}
        <div className="flex items-center gap-2 bg-[#09080E] p-1.5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === "assignments"
                ? "bg-brand-flameOrange text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Visual Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === "library"
                ? "bg-brand-flameOrange text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Assets ({assets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === "upload"
                ? "bg-brand-goldYellow text-black shadow-md font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Media</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISUAL ASSET ASSIGNMENTS TABLE                                     */}
      {/* ========================================================================= */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-brand-goldYellow shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Live Visual Asset Mapping</strong>
              Every public section below uses the assigned image dynamically. Clicking <strong>Change Image</strong>{" "}
              lets you pick an existing image or upload a new one. Once assigned, the live website updates immediately!
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {Object.keys(SECTION_DEFAULTS).map((slotKey) => {
              const meta = SECTION_DEFAULTS[slotKey];
              const assignment = assignments[slotKey] || {
                url: meta.defaultUrl,
                alt: meta.title,
                fit: "cover" as const,
                position: "center" as const,
                section_name: meta.title,
                updated_at: "",
              };

              return (
                <div
                  key={slotKey}
                  className="p-5 rounded-2xl bg-[#120E1A] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail Preview */}
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0 shadow-lg group">
                      <Image
                        src={assignment.url || meta.defaultUrl}
                        alt={assignment.alt || meta.title}
                        fill
                        style={{ objectFit: assignment.fit || "cover", objectPosition: assignment.position || "center" }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => setSelectorSlotKey(slotKey)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-brand-goldYellow text-black rounded shadow"
                        >
                          Replace
                        </button>
                      </div>
                    </div>

                    {/* Section Information */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-brand-goldYellow">
                          {slotKey.replace("_", " ")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          Active Live
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{meta.title}</h3>
                      <p className="text-xs text-gray-400 max-w-xl leading-relaxed">{meta.desc}</p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-500">
                        <span>Rec: <strong className="text-gray-300">{meta.recommended}</strong></span>
                        <span>&bull;</span>
                        <span>Fit: <strong className="text-gray-300 uppercase">{assignment.fit || "cover"}</strong></span>
                        <span>&bull;</span>
                        <span>Position: <strong className="text-gray-300 uppercase">{assignment.position || "center"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setDisplayAdjustSlot(slotKey)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-colors flex items-center gap-1.5"
                      title="Adjust Fit, Alignment & Alt Text"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-brand-flameOrange" />
                      <span>Adjust Display</span>
                    </button>

                    <button
                      onClick={() => setSelectorSlotKey(slotKey)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-fireRed to-brand-flameOrange hover:brightness-110 shadow-fire-glow transition-all flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FULL MEDIA ASSETS LIBRARY                                          */}
      {/* ========================================================================= */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#120E1A] border border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assets by name or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09080E] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-goldYellow"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
              {["all", "flyer", "logo", "portrait", "section", "banner", "video"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-brand-goldYellow text-black font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat === "all" ? "All Media" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Grid */}
          {loading ? (
            <div className="py-20 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-goldYellow" />
              <span className="text-xs">Loading media assets library...</span>
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredAssets.map((asset) => {
                const isAssigned = Object.values(assignments).some((v) => v.url === asset.url);

                return (
                  <div
                    key={asset.id}
                    className="group rounded-2xl bg-[#120E1A] border border-white/10 hover:border-brand-goldYellow/40 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Media Preview Box */}
                    <div className="relative aspect-[4/3] w-full bg-black/60 overflow-hidden flex items-center justify-center">
                      {asset.type.includes("video") ? (
                        <video src={asset.url} className="w-full h-full object-cover" controls={false} />
                      ) : (
                        <Image
                          src={asset.url}
                          alt={asset.alt_text || asset.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-brand-goldYellow border border-white/10">
                          {asset.category}
                        </span>

                        {isAssigned && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow">
                            Assigned Live
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewAsset(asset)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                          title="View Full Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(asset.url, asset.id)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                          title="Copy Public URL"
                        >
                          {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingAsset(asset)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                          title="Edit Details / Delete"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate" title={asset.name}>
                          {asset.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate" title={asset.filename}>
                          {asset.filename}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                        <span>{(asset.size / 1024).toFixed(0)} KB</span>
                        {asset.dimensions && <span>{asset.dimensions}</span>}
                        <button
                          onClick={() => handleCopyUrl(asset.url, asset.id)}
                          className="text-brand-goldYellow hover:underline flex items-center gap-1 font-medium"
                        >
                          {copiedId === asset.id ? "Copied!" : "Copy URL"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#120E1A] border border-white/10 text-gray-500 text-xs">
              No media assets found matching the search or category filter.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: UPLOAD NEW MEDIA                                                   */}
      {/* ========================================================================= */}
      {activeTab === "upload" && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-[#120E1A] border border-white/10 space-y-6">
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-white">Upload New Website Asset</h3>
            <p className="text-xs text-gray-400">
              Upload event flyers, minister portraits, logo variations, banners, or video files.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            {/* Dropzone / File Picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-brand-goldYellow rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#09080E]/60 flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadPreviewUrl ? (
                <div className="relative w-44 h-44 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                  {uploadFile?.type.includes("video") ? (
                    <video src={uploadPreviewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={uploadPreviewUrl} alt="Upload preview" fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                    Click to replace
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-white/5 text-brand-goldYellow">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-white block">
                      Choose file or drag &amp; drop here
                    </span>
                    <span className="text-xs text-gray-500 block">
                      Supported: JPG, PNG, WebP, SVG (up to 15MB) &bull; MP4 (up to 50MB)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Asset Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                >
                  <option value="general">General Asset</option>
                  <option value="flyer">Event Flyer / Poster</option>
                  <option value="logo">Logo &amp; Brand Badge</option>
                  <option value="portrait">Minister Portrait</option>
                  <option value="section">Section Artwork</option>
                  <option value="banner">Callout Banner</option>
                  <option value="video">Promotional Video</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Alternative Text (SEO / Accessibility)</label>
                <input
                  type="text"
                  placeholder="Descriptive image alt text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Internal notes on where this asset belongs..."
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
              />
            </div>

            {/* Upload Button */}
            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="w-full py-3 rounded-xl font-bold text-sm text-black bg-brand-goldYellow hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating &amp; Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Save Asset to Library</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SELECT EXISTING IMAGE OR UPLOAD TO REASSIGN                      */}
      {/* ========================================================================= */}
      {selectorSlotKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Select Asset for &quot;{SECTION_DEFAULTS[selectorSlotKey]?.title || selectorSlotKey}&quot;
                </h3>
                <p className="text-xs text-gray-400">
                  Choose from existing media assets or upload a new image directly.
                </p>
              </div>
              <button
                onClick={() => setSelectorSlotKey(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Quick Upload Banner */}
              <div className="p-4 rounded-2xl bg-[#09080E] border border-dashed border-white/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-goldYellow/10 text-brand-goldYellow">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Upload a New Image Directly</span>
                    <span className="text-[11px] text-gray-400 block">
                      Files are immediately validated, persisted, and assigned to this section.
                    </span>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-goldYellow text-black cursor-pointer hover:brightness-110 transition-all shrink-0">
                  <span>Browse Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("category", "section");
                      formData.append("altText", file.name);

                      const headers: Record<string, string> = {};
                      if (csrfToken) headers["x-csrf-token"] = csrfToken;

                      const res = await fetch("/api/admin/media/upload", {
                        method: "POST",
                        headers,
                        body: formData,
                      });
                      const data = await res.json();
                      if (res.ok && data.success && data.asset) {
                        await handleSaveAssignment(selectorSlotKey, data.asset.url, data.asset.alt_text);
                        await fetchMediaData();
                        setSelectorSlotKey(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Grid of Available Assets */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Choose from Existing Assets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {assets.map((item) => (
                    <div
                      key={item.id}
                      onClick={async () => {
                        await handleSaveAssignment(selectorSlotKey, item.url, item.alt_text);
                        setSelectorSlotKey(null);
                      }}
                      className="group cursor-pointer rounded-xl bg-[#09080E] border border-white/10 hover:border-brand-goldYellow p-2 transition-all space-y-2"
                    >
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black">
                        <Image src={item.url} alt={item.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-brand-goldYellow/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs text-black bg-brand-goldYellow/80 backdrop-blur-xs">
                          Assign This
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white block truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADJUST DISPLAY & CROPPING FOR A SLOT                             */}
      {/* ========================================================================= */}
      {displayAdjustSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Image Display &amp; Focal Alignment</h3>
                <p className="text-xs text-gray-400">
                  {SECTION_DEFAULTS[displayAdjustSlot]?.title || displayAdjustSlot}
                </p>
              </div>
              <button
                onClick={() => setDisplayAdjustSlot(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Interactive Preview */}
            {(() => {
              const current = assignments[displayAdjustSlot] || {
                url: SECTION_DEFAULTS[displayAdjustSlot]?.defaultUrl,
                alt: "",
                fit: "cover" as const,
                position: "center" as const,
              };

              return (
                <div className="space-y-5">
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-black">
                    <Image
                      src={current.url}
                      alt={current.alt || "Preview"}
                      fill
                      style={{ objectFit: current.fit, objectPosition: current.position }}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white">
                      Fit: {current.fit.toUpperCase()} &bull; Position: {current.position.toUpperCase()}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Object Fitting</label>
                      <select
                        value={current.fit || "cover"}
                        onChange={(e) =>
                          handleSaveAssignment(
                            displayAdjustSlot,
                            current.url,
                            current.alt,
                            e.target.value as any,
                            current.position
                          )
                        }
                        className="w-full bg-[#09080E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                      >
                        <option value="cover">Cover (Fill space, preserve ratio)</option>
                        <option value="contain">Contain (Fit entirely within frame)</option>
                        <option value="fill">Fill (Stretch to boundary)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Focal Alignment</label>
                      <select
                        value={current.position || "center"}
                        onChange={(e) =>
                          handleSaveAssignment(
                            displayAdjustSlot,
                            current.url,
                            current.alt,
                            current.fit,
                            e.target.value as any
                          )
                        }
                        className="w-full bg-[#09080E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Alt text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Accessibility Alt Text</label>
                    <input
                      type="text"
                      value={current.alt || ""}
                      onChange={(e) =>
                        handleSaveAssignment(
                          displayAdjustSlot,
                          current.url,
                          e.target.value,
                          current.fit,
                          current.position
                        )
                      }
                      className="w-full bg-[#09080E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setDisplayAdjustSlot(null)}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110"
                    >
                      Done Adjusting
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSET PREVIEW & METADATA INSPECTOR                               */}
      {/* ========================================================================= */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">{previewAsset.name}</h3>
                <span className="text-xs text-gray-400">{previewAsset.filename}</span>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
              <Image src={previewAsset.url} alt={previewAsset.name} fill className="object-contain" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">File Size</span>
                <strong className="text-white">{(previewAsset.size / 1024).toFixed(1)} KB</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">Dimensions</span>
                <strong className="text-white">{previewAsset.dimensions || "Vector / Flexible"}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">Category</span>
                <strong className="text-white uppercase">{previewAsset.category}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#09080E] border border-white/5 space-y-1">
                <span className="text-gray-500 block">Type</span>
                <strong className="text-white">{previewAsset.type}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopyUrl(previewAsset.url, previewAsset.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Public URL</span>
              </button>

              <button
                onClick={() => setPreviewAsset(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-brand-goldYellow text-black hover:brightness-110"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT ASSET DETAILS & DELETE UNUSED                               */}
      {/* ========================================================================= */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white">Edit Media Details</h3>
              <button
                onClick={() => setEditingAsset(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Asset Title</label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Alt Text</label>
                <input
                  type="text"
                  value={editingAsset.alt_text || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, alt_text: e.target.value })}
                  className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Description</label>
                <textarea
                  rows={2}
                  value={editingAsset.description || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                  className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => handleDeleteAsset(editingAsset)}
                disabled={editingAsset.is_system}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Asset</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const headers: Record<string, string> = { "Content-Type": "application/json" };
                    if (csrfToken) headers["x-csrf-token"] = csrfToken;

                    await fetch(`/api/admin/media/${editingAsset.id}`, {
                      method: "PUT",
                      headers,
                      body: JSON.stringify(editingAsset),
                    });

                    if (onShowFeedback) {
                      onShowFeedback("success", "Asset details updated successfully.");
                    }
                    setEditingAsset(null);
                    await fetchMediaData();
                  } catch {
                    // Graceful error
                  }
                }}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-brand-goldYellow text-black hover:brightness-110"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
