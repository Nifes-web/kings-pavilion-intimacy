"use client";

import React, { useState } from "react";
import { CmsContentData } from "./adminTypes";
import {
  Save,
  Globe,
  RotateCcw,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  HeartHandshake,
  History,
  X,
} from "lucide-react";

interface HomepageEditorProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData?: () => void;
}

export function HomepageEditor({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: HomepageEditorProps) {
  // Find hero section in cmsData
  const heroRecord = cmsData.siteContent.find((s) => s.section_key === "hero");
  const heroContent = heroRecord?.content || {};

  // Form states for Hero
  const [heroTitle, setHeroTitle] = useState(
    heroRecord?.title || "12 Hours of Prayer, Warfare & Consecration"
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    heroRecord?.subtitle || "King's Pavilion Presents • Hour of Incubation"
  );
  const [heroHighlight, setHeroHighlight] = useState(
    heroContent.headline_highlight || "INTIMACY"
  );
  const [heroTag, setHeroTag] = useState(heroContent.event_tag || "Bootcamp 2026");
  const [heroDesc, setHeroDesc] = useState(
    heroContent.description ||
      "A consecrated 12-hour spiritual altar convened at IPMAN Event Hall, Ile Ife, Osun State. Join united intercessors for sustained prayer, prophetic worship, and spiritual revival."
  );
  const [heroDate, setHeroDate] = useState(heroContent.date || "Sat, 5 Dec 2026");
  const [heroTime, setHeroTime] = useState(
    heroContent.time || "8:00 AM WAT (12 Continuous Hours)"
  );
  const [heroVenue, setHeroVenue] = useState(
    heroContent.venue || "IPMAN Hall, Ibadan Rd, Ile Ife"
  );
  const [heroAdmission, setHeroAdmission] = useState(
    heroContent.admission || "Free Admission"
  );
  const [heroRegBtn, setHeroRegBtn] = useState(
    heroContent.register_button_text || "Register to Attend (Free)"
  );
  const [heroVolBtn, setHeroVolBtn] = useState(
    heroContent.volunteer_button_text || "Apply as Volunteer"
  );

  // About Section state
  const aboutRecord = cmsData.siteContent.find((s) => s.section_key === "about");
  const aboutContent = aboutRecord?.content || {};
  const [aboutTitle, setAboutTitle] = useState(
    aboutRecord?.title || "Why Believers Gather for INTIMACY 2026"
  );
  const [aboutDesc, setAboutDesc] = useState(
    aboutContent.description ||
      "Convened by King's Pavilion, Intimacy is not a conventional conference—it is a continuous 12-hour sacred prayer incubation where worshippers converge from across Nigeria at IPMAN Event Hall, Ile Ife to meet God intimately."
  );

  // Event Info Section state
  const eventInfoRecord = cmsData.siteContent.find(
    (s) => s.section_key === "event_info"
  );
  const eventInfoContent = eventInfoRecord?.content || {};
  const [venueName, setVenueName] = useState(
    eventInfoContent.venueName || "IPMAN Event Hall"
  );
  const [venueLandmark, setVenueLandmark] = useState(
    eventInfoContent.landmark || "Beside Harvard Hotel, Opposite NASFAT"
  );
  const [venueAddress, setVenueAddress] = useState(
    eventInfoContent.address || "Ibadan Road, Ile Ife, Osun State, Nigeria"
  );
  const [eventDate, setEventDate] = useState(
    eventInfoContent.date || "Saturday, 5 December 2026"
  );
  const [eventTime, setEventTime] = useState(
    eventInfoContent.time || "8:00 AM - 8:00 PM WAT"
  );

  // Expectations Section state
  const expectationsRecord = cmsData.siteContent.find(
    (s) => s.section_key === "expectations"
  );
  const expectationsContent = expectationsRecord?.content || {};
  const [expTitle, setExpTitle] = useState(
    expectationsRecord?.title || "Explore the Bootcamp Experience"
  );
  const [expDesc, setExpDesc] = useState(
    expectationsContent.description ||
      "Four consecrated pillars orchestrating an unforgettable 12-hour prayer incubation at IPMAN Event Hall."
  );

  // Prayer Focus Section state
  const prayerRecord = cmsData.siteContent.find(
    (s) => s.section_key === "prayer_focus"
  );
  const prayerContent = prayerRecord?.content || {};
  const [prayerTitle, setPrayerTitle] = useState(
    prayerRecord?.title || "Official Prayer Focus"
  );
  const [prayerDesc, setPrayerDesc] = useState(
    prayerContent.description ||
      "Strategic corporate prayer focuses guiding the 12-hour prayer incubation watches."
  );
  const [prayerNote, setPrayerNote] = useState(
    prayerContent.note ||
      "Corporate themes are public. Personal prayer points submitted during individual registration remain strictly confidential."
  );

  // Volunteer Callout Section state
  const volunteerRecord = cmsData.siteContent.find(
    (s) => s.section_key === "volunteer_callout"
  );
  const volunteerContent = volunteerRecord?.content || {};
  const [volTitle, setVolTitle] = useState(
    volunteerRecord?.title || "Serve at the Altar of Intimacy 2026"
  );
  const [volDesc, setVolDesc] = useState(
    volunteerContent.description ||
      "Join one of the 8 approved volunteer departments to coordinate, serve, and minister at IPMAN Event Hall on Saturday, 5 December 2026."
  );

  // Closing CTA Section state
  const closingRecord = cmsData.siteContent.find(
    (s) => s.section_key === "closing_cta"
  );
  const closingContent = closingRecord?.content || {};
  const [closingHeadline, setClosingHeadline] = useState(
    closingContent.headline ||
      closingRecord?.title ||
      "Join the Altar of Incubation. Free Registration Pass."
  );
  const [closingDesc, setClosingDesc] = useState(
    closingContent.description ||
      "Do not miss this 12-hour sacred encounter. Reserve your attendee place today."
  );

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "hero" | "about" | "venue" | "expectations" | "prayer_focus" | "volunteer_callout" | "closing_cta"
  >("hero");

  const getActiveRecord = () => {
    switch (activeTab) {
      case "hero":
        return heroRecord;
      case "about":
        return aboutRecord;
      case "venue":
        return eventInfoRecord;
      case "expectations":
        return expectationsRecord;
      case "prayer_focus":
        return prayerRecord;
      case "volunteer_callout":
        return volunteerRecord;
      case "closing_cta":
        return closingRecord;
    }
  };
  const activeRecord = getActiveRecord();

  const fetchRevisions = async (secKey: string) => {
    setRevisionsLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/revisions?section=${secKey === "venue" ? "event_info" : secKey}`);
      const data = await res.json();
      if (res.ok && data.revisions) {
        setRevisions(data.revisions);
      }
    } catch {
      // Graceful error
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleRestoreRevision = async (rev: any) => {
    try {
      const res = await fetch("/api/admin/cms/revisions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ revisionId: rev.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMutateError(data.error || "Failed to restore revision");
        return;
      }

      // Populate form fields with restored content
      if (rev.section_key === "hero") {
        if (rev.title) setHeroTitle(rev.title);
        if (rev.subtitle) setHeroSubtitle(rev.subtitle);
        const c = rev.content || {};
        if (c.headline_highlight) setHeroHighlight(c.headline_highlight);
        if (c.event_tag) setHeroTag(c.event_tag);
        if (c.description) setHeroDesc(c.description);
        if (c.date) setHeroDate(c.date);
        if (c.time) setHeroTime(c.time);
        if (c.venue) setHeroVenue(c.venue);
        if (c.admission) setHeroAdmission(c.admission);
        if (c.register_button_text) setHeroRegBtn(c.register_button_text);
        if (c.volunteer_button_text) setHeroVolBtn(c.volunteer_button_text);
      } else if (rev.section_key === "about") {
        if (rev.title) setAboutTitle(rev.title);
        const c = rev.content || {};
        if (c.description) setAboutDesc(c.description);
      } else if (rev.section_key === "event_info") {
        const c = rev.content || {};
        if (c.venueName) setVenueName(c.venueName);
        if (c.landmark) setVenueLandmark(c.landmark);
        if (c.address) setVenueAddress(c.address);
      }

      onMutateSuccess(`Successfully restored version ${rev.version} (${new Date(rev.created_at).toLocaleDateString()})!`);
      setShowRevisionsModal(false);
    } catch (err: any) {
      onMutateError(err.message || "Failed to restore revision");
    }
  };

  // Save changes handler
  const handleSave = async (shouldPublish: boolean = false) => {
    if (shouldPublish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      let payload: Record<string, any> = {};
      let sectionKey = "hero";
      let title = heroTitle;
      let subtitle = heroSubtitle;

      if (activeTab === "hero") {
        sectionKey = "hero";
        title = heroTitle;
        subtitle = heroSubtitle;
        payload = {
          section_key: "hero",
          title: heroTitle,
          subtitle: heroSubtitle,
          content: {
            headline_highlight: heroHighlight,
            event_tag: heroTag,
            description: heroDesc,
            date: heroDate,
            time: heroTime,
            venue: heroVenue,
            admission: heroAdmission,
            register_button_text: heroRegBtn,
            volunteer_button_text: heroVolBtn,
          },
        };
      } else if (activeTab === "about") {
        sectionKey = "about";
        title = aboutTitle;
        subtitle = "The Vision & Sacred Calling";
        payload = {
          section_key: "about",
          title: aboutTitle,
          subtitle,
          content: {
            description: aboutDesc,
          },
        };
      } else if (activeTab === "venue") {
        sectionKey = "event_info";
        title = "Venue, Location & Directions";
        subtitle = "Location & Logistics";
        payload = {
          section_key: "event_info",
          title,
          subtitle,
          content: {
            venueName,
            landmark: venueLandmark,
            address: venueAddress,
            date: eventDate,
            time: eventTime,
          },
        };
      } else if (activeTab === "expectations") {
        sectionKey = "expectations";
        title = expTitle;
        subtitle = "Programme Dimensions";
        payload = {
          section_key: "expectations",
          title: expTitle,
          subtitle,
          content: {
            ...expectationsContent,
            description: expDesc,
          },
        };
      } else if (activeTab === "prayer_focus") {
        sectionKey = "prayer_focus";
        title = prayerTitle;
        subtitle = "Themes of Intercession";
        payload = {
          section_key: "prayer_focus",
          title: prayerTitle,
          subtitle,
          content: {
            ...prayerContent,
            description: prayerDesc,
            note: prayerNote,
          },
        };
      } else if (activeTab === "volunteer_callout") {
        sectionKey = "volunteer_callout";
        title = volTitle;
        subtitle = "Ministry Call to Service";
        payload = {
          section_key: "volunteer_callout",
          title: volTitle,
          subtitle,
          content: {
            ...volunteerContent,
            headline: volTitle,
            description: volDesc,
          },
        };
      } else if (activeTab === "closing_cta") {
        sectionKey = "closing_cta";
        title = closingHeadline;
        subtitle = "Saturday, 5 December 2026 • IPMAN Event Hall, Ile Ife";
        payload = {
          section_key: "closing_cta",
          title: closingHeadline,
          subtitle,
          content: {
            ...closingContent,
            headline: closingHeadline,
            description: closingDesc,
          },
        };
      }

      // 1. First ensure the active section record is updated / created
      const currentRecord = getActiveRecord();
      const isExisting =
        currentRecord &&
        currentRecord.id &&
        !currentRecord.id.startsWith("fallback-");

      const mutationBody: any = {
        entity: "site_content",
        action: isExisting ? "update" : "create",
        payload,
        changeSummary: shouldPublish
          ? `Published ${sectionKey} section updates`
          : `Saved ${sectionKey} section draft updates`,
      };

      if (isExisting) {
        mutationBody.recordId = currentRecord.id;
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
        if (
          resData.error &&
          (resData.error.includes("Could not find the function") ||
            resData.error.includes("does not exist") ||
            resData.code === "PGRST205")
        ) {
          onMutateError(
            `Database migration pending: ${resData.error}. Review supabase/migrations/20261110210000_cms_foundation.sql.`
          );
        } else {
          onMutateError(resData.error || "Failed to save content.");
        }
        return;
      }

      const savedRecord = resData.data?.record;
      const savedRecordId = savedRecord?.id || currentRecord?.id;
      const currentStatus = savedRecord?.status || currentRecord?.status;

      // 2. If shouldPublish is requested and record is not already published, call publish
      if (shouldPublish && savedRecordId && currentStatus !== "published") {
        const pubRes = await fetch("/api/admin/cms/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            entity: "site_content",
            action: "publish",
            recordId: savedRecordId,
            changeSummary: `Published ${sectionKey} live to website`,
          }),
        });

        const pubData = await pubRes.json();
        if (!pubRes.ok) {
          onMutateError(pubData.error || "Failed to publish content.");
          return;
        }
      }

      if (shouldPublish) {
        onMutateSuccess(
          `Section '${sectionKey}' published successfully! Live website updated.`
        );
      } else {
        onMutateSuccess(
          `Section '${sectionKey}' draft saved successfully in database.`
        );
      }

      onRefreshData?.();

      // Record snapshot in content revision history
      fetch("/api/admin/cms/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          sectionKey,
          title,
          subtitle,
          content: payload,
          changeSummary: shouldPublish ? `Published ${sectionKey} live to website` : `Saved ${sectionKey} draft`,
        }),
      }).catch(() => {});
    } catch (err: any) {
      onMutateError(err.message || "Network error while saving content.");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!activeRecord?.id || activeRecord.id.startsWith("fallback-")) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/admin/cms/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          entity: "site_content",
          action: "archive",
          recordId: activeRecord.id,
          changeSummary: `Unpublished ${activeRecord.section_key} section`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMutateError(data.error || "Failed to unpublish section.");
        return;
      }
      onMutateSuccess(`Section '${activeRecord.section_key}' unpublished.`);
      onRefreshData?.();
    } catch (err: any) {
      onMutateError(err.message || "Network error while unpublishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetDefaults = () => {
    if (activeTab === "hero") {
      setHeroTitle("12 Hours of Prayer, Warfare & Consecration");
      setHeroSubtitle("King's Pavilion Presents • Hour of Incubation");
      setHeroHighlight("INTIMACY");
      setHeroTag("Bootcamp 2026");
      setHeroDesc(
        "A consecrated 12-hour spiritual altar convened at IPMAN Event Hall, Ile Ife, Osun State. Join united intercessors for sustained prayer, prophetic worship, and spiritual revival."
      );
      setHeroDate("Sat, 5 Dec 2026");
      setHeroTime("8:00 AM WAT (12 Continuous Hours)");
      setHeroVenue("IPMAN Hall, Ibadan Rd, Ile Ife");
      setHeroAdmission("Free Admission");
      setHeroRegBtn("Register to Attend (Free)");
      setHeroVolBtn("Apply as Volunteer");
    } else if (activeTab === "about") {
      setAboutTitle("Why Believers Gather for INTIMACY 2026");
      setAboutDesc(
        "Convened by King's Pavilion, Intimacy is not a conventional conference—it is a continuous 12-hour sacred prayer incubation where worshippers converge from across Nigeria at IPMAN Event Hall, Ile Ife to meet God intimately."
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Subnav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#15111D] p-1 rounded-2xl border border-white/10">
          {(
            [
              { id: "hero", label: "Hero & Header" },
              { id: "about", label: "About" },
              { id: "venue", label: "Venue & Schedule" },
              { id: "expectations", label: "Expectations" },
              { id: "prayer_focus", label: "Prayer Focus" },
              { id: "volunteer_callout", label: "Volunteer Callout" },
              { id: "closing_cta", label: "Closing CTA" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? "bg-brand-goldYellow text-gray-950 shadow-gold-glow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all"
            title="Reset to canonical default text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchRevisions(activeTab);
              setShowRevisionsModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all"
            title="View revision history and restore past versions"
          >
            <History className="w-3.5 h-3.5 text-brand-goldYellow" />
            <span className="hidden sm:inline">Revision History</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-brand-goldYellow" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            disabled={isSaving || isPublishing}
            onClick={() => handleSave(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={isSaving || isPublishing}
            onClick={() => handleSave(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-950" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-gray-950" />
            )}
            <span>
              {activeRecord?.status === "published" ? "Save & Update Live" : "Publish to Live"}
            </span>
          </button>

          {activeRecord?.status === "published" && !activeRecord.id?.startsWith("fallback-") && (
            <button
              type="button"
              disabled={isSaving || isPublishing}
              onClick={handleUnpublish}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "hero" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              Hero Section Editor
            </h3>
            <p className="text-xs text-gray-400">
              Controls the main top title, event badges, description, date pills, and call-to-action buttons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Top Subtitle / Tagline
              </label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Event Tag Badge
              </label>
              <input
                type="text"
                value={heroTag}
                onChange={(e) => setHeroTag(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Main Headline (Large Bold Title)
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Highlight Word (3D Flame Typography)
              </label>
              <input
                type="text"
                value={heroHighlight}
                onChange={(e) => setHeroHighlight(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Admission Badge
              </label>
              <input
                type="text"
                value={heroAdmission}
                onChange={(e) => setHeroAdmission(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Introductory Description Paragraph
              </label>
              <textarea
                rows={3}
                value={heroDesc}
                onChange={(e) => setHeroDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Event Date String
              </label>
              <input
                type="text"
                value={heroDate}
                onChange={(e) => setHeroDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Event Time String
              </label>
              <input
                type="text"
                value={heroTime}
                onChange={(e) => setHeroTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Venue Summary String
              </label>
              <input
                type="text"
                value={heroVenue}
                onChange={(e) => setHeroVenue(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Primary Button Label (Registration)
              </label>
              <input
                type="text"
                value={heroRegBtn}
                onChange={(e) => setHeroRegBtn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Secondary Button Label (Volunteering)
              </label>
              <input
                type="text"
                value={heroVolBtn}
                onChange={(e) => setHeroVolBtn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>
          </div>
        </div>
      )}

      {/* About Section Editor */}
      {activeTab === "about" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              About the Gathering Section
            </h3>
            <p className="text-xs text-gray-400">
              Customize the event vision, purpose, and spiritual incubation narrative.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Section Headline
              </label>
              <input
                type="text"
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Event Description Narrative
              </label>
              <textarea
                rows={5}
                value={aboutDesc}
                onChange={(e) => setAboutDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Venue Section Editor */}
      {activeTab === "venue" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              Venue &amp; Location Details
            </h3>
            <p className="text-xs text-gray-400">
              Update IPMAN Event Hall landmarks and address.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Landmarks
              </label>
              <input
                type="text"
                value={venueLandmark}
                onChange={(e) => setVenueLandmark(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Full Physical Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Event Date
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Time &amp; Schedule
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expectations Section Editor */}
      {activeTab === "expectations" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              What to Expect Section
            </h3>
            <p className="text-xs text-gray-400">
              Customize the programme dimensions heading and summary description.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Section Title
              </label>
              <input
                type="text"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Section Description
              </label>
              <textarea
                rows={4}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Prayer Focus Section Editor */}
      {activeTab === "prayer_focus" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              Official Prayer Focus Section
            </h3>
            <p className="text-xs text-gray-400">
              Update the prayer focus title, introduction, and confidentiality notice.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Section Title
              </label>
              <input
                type="text"
                value={prayerTitle}
                onChange={(e) => setPrayerTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Section Description
              </label>
              <textarea
                rows={3}
                value={prayerDesc}
                onChange={(e) => setPrayerDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Confidentiality Note
              </label>
              <input
                type="text"
                value={prayerNote}
                onChange={(e) => setPrayerNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
              />
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Callout Section Editor */}
      {activeTab === "volunteer_callout" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              Volunteer Service Callout
            </h3>
            <p className="text-xs text-gray-400">
              Edit the volunteer invitation headline and callout description.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Headline
              </label>
              <input
                type="text"
                value={volTitle}
                onChange={(e) => setVolTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={volDesc}
                onChange={(e) => setVolDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Closing CTA Section Editor */}
      {activeTab === "closing_cta" && (
        <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              Closing Altar Banner
            </h3>
            <p className="text-xs text-gray-400">
              Edit the closing call-to-action headline and description.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Headline
              </label>
              <input
                type="text"
                value={closingHeadline}
                onChange={(e) => setClosingHeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={closingDesc}
                onChange={(e) => setClosingDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#09080E] rounded-3xl border border-white/20 overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-goldYellow" />
                <span className="font-bold text-sm text-white">
                  Live Preview: {activeTab === "hero" ? "Hero Header" : activeTab}
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Rendered Preview Box */}
            <div className="rounded-2xl border border-white/10 p-8 bg-gradient-to-b from-[#15111D] to-[#0A0810] space-y-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                {heroSubtitle}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {heroTitle}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-black text-brand-goldYellow uppercase">
                  {heroHighlight}
                </span>
                <span className="text-xs font-bold text-brand-flameOrange bg-brand-flameOrange/10 border border-brand-flameOrange/30 px-3 py-1 rounded-full">
                  {heroTag}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                {heroDesc}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow text-white text-xs font-bold shadow-fire-glow">
                  {heroRegBtn}
                </div>
                <div className="px-5 py-2.5 rounded-full border border-white/20 text-gray-200 text-xs font-bold">
                  {heroVolBtn}
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>📅 {heroDate}</span>
                <span>⏰ {heroTime}</span>
                <span>📍 {heroVenue}</span>
                <span className="text-emerald-400 font-bold">
                  ✓ {heroAdmission}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History & Restore Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-goldYellow" />
                <h3 className="text-base font-bold text-white">
                  Content Revision History &bull; {activeTab.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setShowRevisionsModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Restore previous published or saved versions of this section. Restoring creates a new point-in-time version while preserving the full audit trail.
            </p>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {revisionsLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-goldYellow mb-2" />
                  <span className="text-xs">Loading past revisions...</span>
                </div>
              ) : revisions.length > 0 ? (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-[#09080E] border border-white/10 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-goldYellow font-mono">
                          v{rev.version}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {rev.title || "Section Snapshot"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{rev.change_summary}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{new Date(rev.created_at).toLocaleString()}</span>
                        <span>&bull;</span>
                        <span>Author: {rev.author}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreRevision(rev)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-goldYellow text-black hover:brightness-110 shrink-0 shadow-sm transition-all"
                    >
                      Restore This Version
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-500">
                  No previous revisions recorded for this section yet.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowRevisionsModal(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

