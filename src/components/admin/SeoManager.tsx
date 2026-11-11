"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CmsContentData } from "./adminTypes";
import {
  Save,
  Globe,
  Search,
  Eye,
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";

interface SeoManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

export function SeoManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: SeoManagerProps) {
  const seoSetting = cmsData.siteSettings.find((s) => s.key === "seo_global");
  const seoData = seoSetting?.value || {};

  const [pageTitle, setPageTitle] = useState(
    seoData.pageTitle || "King's Pavilion Intimacy | 12 Hours Prayer Bootcamp"
  );
  const [metaDescription, setMetaDescription] = useState(
    seoData.metaDescription ||
      "A consecrated 12-hour spiritual altar convened at IPMAN Event Hall, Ile Ife, Osun State. Join united intercessors for sustained prayer, prophetic worship, and spiritual revival."
  );
  const [ogTitle, setOgTitle] = useState(
    seoData.ogTitle || "Intimacy: 12 Hours Prayer Bootcamp • King's Pavilion"
  );
  const [ogDescription, setOgDescription] = useState(
    seoData.ogDescription ||
      "12 continuous hours of prayer, warfare, and consecration. Saturday, 5 December 2026 at IPMAN Event Hall, Ile Ife. Free admission."
  );
  const [ogImage, setOgImage] = useState(
    seoData.ogImage || "/assets/intimacy-flyer.jpg"
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    seoData.canonicalUrl || "https://kingspavilion.org"
  );
  const [keywords, setKeywords] = useState(
    seoData.keywords ||
      "prayer bootcamp, intimacy 2026, ile ife prayer conference, kings pavilion, 12 hours prayer, christian warfare"
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      key: "seo_global",
      value: {
        pageTitle,
        metaDescription,
        ogTitle,
        ogDescription,
        ogImage,
        canonicalUrl,
        keywords,
      },
      is_public: true,
      description: "Global website metadata, SEO tags and Open Graph settings",
    };

    try {
      const isEdit = Boolean(
        seoSetting && seoSetting.id && !seoSetting.id.startsWith("fallback-")
      );

      const mutationBody: any = {
        entity: "site_settings",
        action: isEdit ? "update" : "create",
        payload,
        changeSummary: "Updated global SEO and Open Graph metadata",
      };

      if (isEdit) {
        mutationBody.recordId = seoSetting.id;
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
        onMutateError(resData.error || "Failed to save SEO settings.");
        return;
      }

      onMutateSuccess("SEO metadata and social sharing settings saved successfully.");
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error saving SEO settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-black text-white">
                Search Engine Optimization &amp; Social Metadata
              </h2>
              <p className="text-xs text-gray-400">
                Configure search engine crawler titles, descriptions, and social share cards (WhatsApp, X, Facebook, Telegram).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center gap-1.5 shadow-gold-glow disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-950" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save SEO Settings</span>
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Page Title Tag (Browser &amp; Search Results)
              </label>
              <input
                type="text"
                required
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
              <span className="text-[11px] text-gray-400 block mt-1">
                Length: {pageTitle.length} characters (Optimal: 50–65 characters)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Meta Description (Search Snippet)
              </label>
              <textarea
                rows={3}
                required
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
              <span className="text-[11px] text-gray-400 block mt-1">
                Length: {metaDescription.length} characters (Optimal: 140–160 characters)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Open Graph Title (Social Cards)
                </label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Social Sharing Image URL (og:image)
                </label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Open Graph Description
              </label>
              <textarea
                rows={2}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Canonical Base URL
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Meta Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Visual Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google SERP Card Preview */}
        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Search className="w-4 h-4 text-brand-goldYellow" />
            <span>Google Search Result Snippet Preview</span>
          </div>

          <div className="p-4 rounded-2xl bg-white text-gray-900 space-y-1 font-sans">
            <div className="text-[11px] text-gray-600 truncate flex items-center gap-1">
              <span>{canonicalUrl}</span>
              <span>› event</span>
            </div>
            <h3 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer truncate">
              {pageTitle}
            </h3>
            <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              {metaDescription}
            </p>
          </div>
        </div>

        {/* Social Share Card Preview */}
        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Share2 className="w-4 h-4 text-brand-fireRed" />
            <span>Social Share Card Preview (WhatsApp / X / Telegram)</span>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
            <div className="relative aspect-[16/9] w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImage || "/assets/intimacy-flyer.jpg"}
                alt="OG Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-[#110D18] space-y-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                kingspavilion.org
              </span>
              <h4 className="text-xs font-bold text-white truncate">{ogTitle}</h4>
              <p className="text-[11px] text-gray-400 line-clamp-1">
                {ogDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

