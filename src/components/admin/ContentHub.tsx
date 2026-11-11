"use client";

import React from "react";
import { AdminTab, CmsContentData } from "./adminTypes";
import {
  FileText,
  Home,
  BookOpen,
  MapPin,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface ContentHubProps {
  cmsData: CmsContentData;
  onNavigateTab: (tab: AdminTab) => void;
}

export function ContentHub({ cmsData, onNavigateTab }: ContentHubProps) {
  const sections = [
    {
      key: "hero",
      title: "Hero & Altar Header",
      description: "Controls the main headline, event badges, description, date pills, and action buttons.",
      icon: Home,
      targetTab: "homepage" as AdminTab,
    },
    {
      key: "about",
      title: "About the Gathering",
      description: "Vision narrative, 12-hour incubation purpose, and travailing prayer pillars.",
      icon: BookOpen,
      targetTab: "homepage" as AdminTab,
    },
    {
      key: "event_info",
      title: "Venue & Schedule Details",
      description: "IPMAN Event Hall address, landmarks, arrival timeline, and FAQs.",
      icon: MapPin,
      targetTab: "homepage" as AdminTab,
    },
    {
      key: "volunteer_callout",
      title: "Volunteer Service Callout",
      description: "Invitation to serve across 8 designated bootcamp service departments.",
      icon: HeartHandshake,
      targetTab: "homepage" as AdminTab,
    },
    {
      key: "closing_cta",
      title: "Closing Altar Banner",
      description: "Full-width bottom banner prompting registration and prayer readiness.",
      icon: Sparkles,
      targetTab: "homepage" as AdminTab,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-base font-black text-white">
          Website Content Hub
        </h2>
        <p className="text-xs text-gray-400">
          Manage and review all public content sections displayed across the King&apos;s Pavilion website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const record = cmsData.siteContent.find((s) => s.section_key === sec.key);
          const isPublished = record?.status === "published";
          const version = record?.version || 1;
          const updatedAt = record?.updated_at
            ? new Date(record.updated_at).toLocaleString()
            : "Default Content";

          return (
            <div
              key={sec.key}
              className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-4 hover:border-brand-goldYellow/40 transition-all shadow-xl group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-goldYellow group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">
                        {sec.title}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        key: {sec.key}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                      isPublished
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {isPublished ? "Published" : "Draft Mode"}
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {sec.description}
                </p>

                {record?.title && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-300">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Current Headline
                    </span>
                    <span className="font-bold text-white line-clamp-1">
                      {record.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400">
                  Version: v{version} &bull; {updatedAt}
                </span>

                <button
                  onClick={() => onNavigateTab(sec.targetTab)}
                  className="inline-flex items-center gap-1.5 font-bold text-brand-goldYellow hover:underline"
                >
                  <span>Open Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

