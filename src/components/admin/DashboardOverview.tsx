"use client";

import React from "react";
import { AdminTab, CmsContentData } from "./adminTypes";
import {
  Users,
  HeartHandshake,
  QrCode,
  FileCheck2,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface DashboardOverviewProps {
  cmsData: CmsContentData;
  attendeesCount: number;
  volunteersCount: number;
  checkinsCount: number;
  onNavigateTab: (tab: AdminTab) => void;
}

export function DashboardOverview({
  cmsData,
  attendeesCount,
  volunteersCount,
  checkinsCount,
  onNavigateTab,
}: DashboardOverviewProps) {
  const publishedMinistersCount = cmsData.ministers.filter(
    (m) => m.is_published
  ).length;
  const publishedFaqsCount = cmsData.faqs.filter((f) => f.is_published).length;
  const activeAnnouncementsCount = cmsData.announcements.filter(
    (a) => a.is_active
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Migration Notice Banner if DB not migrated yet */}
      {cmsData.migrationPending && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm text-white block">
                CMS Foundation Migration Ready for Review
              </span>
              <p className="text-xs text-amber-200/80 leading-relaxed max-w-2xl">
                The database tables (<code>site_content</code>, <code>ministers</code>, <code>faqs</code>, <code>announcements</code>, <code>site_settings</code>) are prepared in{" "}
                <code>supabase/migrations/20261110210000_cms_foundation.sql</code>. All CMS editors are currently functioning in safe local fallback mode.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("settings")}
            className="px-4 py-2 rounded-full text-xs font-bold text-gray-950 bg-amber-400 hover:bg-amber-300 transition-all shrink-0"
          >
            Review SQL Details
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 relative overflow-hidden group hover:border-brand-flameOrange/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Registered Attendees
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-fireRed/10 border border-brand-fireRed/20 flex items-center justify-center text-brand-fireRed">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-white block tracking-tight">
              {attendeesCount}
            </span>
            <span className="text-[11px] text-gray-400">Verified registrations</span>
          </div>
          <button
            onClick={() => onNavigateTab("attendees")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-goldYellow hover:underline pt-1"
          >
            <span>View Registrations</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 relative overflow-hidden group hover:border-brand-goldYellow/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Volunteer Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-goldYellow/10 border border-brand-goldYellow/20 flex items-center justify-center text-brand-goldYellow">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-white block tracking-tight">
              {volunteersCount}
            </span>
            <span className="text-[11px] text-gray-400">Across 8 service departments</span>
          </div>
          <button
            onClick={() => onNavigateTab("volunteers")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-goldYellow hover:underline pt-1"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 relative overflow-hidden group hover:border-green-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Terminal Check-ins
            </span>
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-white block tracking-tight">
              {checkinsCount}
            </span>
            <span className="text-[11px] text-gray-400">
              {attendeesCount > 0
                ? `${Math.round((checkinsCount / attendeesCount) * 100)}% attendance check-in rate`
                : "No check-ins recorded"}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab("checkin")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-goldYellow hover:underline pt-1"
          >
            <span>Check-in Logs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[#15111D] border border-white/10 space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Published Content
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-white block tracking-tight">
              {publishedMinistersCount + publishedFaqsCount + activeAnnouncementsCount}
            </span>
            <span className="text-[11px] text-gray-400">
              {publishedMinistersCount} ministers &bull; {publishedFaqsCount} FAQs
            </span>
          </div>
          <button
            onClick={() => onNavigateTab("content")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-goldYellow hover:underline pt-1"
          >
            <span>Manage Content Hub</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigateTab("homepage")}
            className="p-4 rounded-2xl bg-[#15111D] border border-white/10 hover:border-brand-goldYellow/40 hover:bg-white/5 text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-brand-goldYellow group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Homepage Headings</span>
            <span className="text-[10px] text-gray-400 block">Edit hero &amp; CTAs</span>
          </button>

          <button
            onClick={() => onNavigateTab("ministers")}
            className="p-4 rounded-2xl bg-[#15111D] border border-white/10 hover:border-brand-goldYellow/40 hover:bg-white/5 text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-brand-fireRed group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Add Minister</span>
            <span className="text-[10px] text-gray-400 block">Biographies &amp; photos</span>
          </button>

          <button
            onClick={() => onNavigateTab("faqs")}
            className="p-4 rounded-2xl bg-[#15111D] border border-white/10 hover:border-brand-goldYellow/40 hover:bg-white/5 text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Manage FAQs</span>
            <span className="text-[10px] text-gray-400 block">Attendee questions</span>
          </button>

          <button
            onClick={() => onNavigateTab("announcements")}
            className="p-4 rounded-2xl bg-[#15111D] border border-white/10 hover:border-brand-goldYellow/40 hover:bg-white/5 text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-brand-flameOrange group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Post Notice</span>
            <span className="text-[10px] text-gray-400 block">Urgent announcements</span>
          </button>

          <button
            onClick={() => onNavigateTab("media")}
            className="p-4 rounded-2xl bg-[#15111D] border border-white/10 hover:border-brand-goldYellow/40 hover:bg-white/5 text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Media Assets</span>
            <span className="text-[10px] text-gray-400 block">Portraits &amp; flyers</span>
          </button>

          <Link
            href="/checkin"
            className="p-4 rounded-2xl bg-gradient-to-br from-brand-flameOrange/15 to-brand-goldYellow/10 border border-brand-goldYellow/30 hover:border-brand-goldYellow text-left transition-all space-y-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-goldYellow flex items-center justify-center text-gray-950 group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-brand-goldYellow block">Check-in Pass</span>
            <span className="text-[10px] text-gray-300 block">Open QR scanner</span>
          </Link>
        </div>
      </div>

      {/* Audit Log / Recent Activity Stream */}
      <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-brand-goldYellow" />
            <h3 className="text-base font-bold text-white">
              Recent Content Audit Trail
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Append-only immutably recorded in database
          </span>
        </div>

        {cmsData.auditLogs && cmsData.auditLogs.length > 0 ? (
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {cmsData.auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.action === "publish"
                          ? "bg-green-500/20 text-green-400"
                          : log.action === "create"
                          ? "bg-blue-500/20 text-blue-400"
                          : log.action === "delete"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-bold text-white">
                      {log.table_name}
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px] font-mono">
                    Record: {log.record_id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  {new Date(log.changed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 space-y-1">
            <p>No content mutations recorded yet.</p>
            <p className="text-[11px] text-gray-400">
              When you edit, create or publish content, audit entries will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

