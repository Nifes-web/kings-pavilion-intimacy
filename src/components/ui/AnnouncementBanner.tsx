"use client";

import React, { useState } from "react";
import { Megaphone, X, ArrowRight, AlertTriangle, Flame } from "lucide-react";

export interface AnnouncementItem {
  id?: string;
  slug?: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  start_date?: string;
  end_date?: string;
}

interface AnnouncementBannerProps {
  announcements?: AnnouncementItem[];
}

export function AnnouncementBanner({ announcements = [] }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || announcements.length === 0) return null;

  // Pick highest priority active announcement
  const activeItem = [...announcements].sort((a, b) => {
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    return (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
  })[0];

  if (!activeItem) return null;

  const isUrgent = activeItem.priority === "urgent";
  const isHigh = activeItem.priority === "high";

  return (
    <aside
      aria-label="Important Announcement"
      className={`relative z-50 px-4 py-2.5 text-xs font-medium border-b transition-all ${
        isUrgent
          ? "bg-gradient-to-r from-brand-fireRed via-red-600 to-brand-flameOrange text-white border-red-500/50 shadow-lg"
          : isHigh
          ? "bg-gradient-to-r from-amber-600 via-brand-flameOrange to-amber-700 text-white border-amber-400/30"
          : "bg-[#15111D] text-gray-200 border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1 rounded bg-black/20 text-brand-goldYellow shrink-0">
            {isUrgent ? <Flame className="w-3.5 h-3.5 animate-pulse" /> : <Megaphone className="w-3.5 h-3.5" />}
          </div>
          <p className="truncate">
            <strong className="font-bold uppercase tracking-wider text-white mr-1.5">
              {activeItem.title}:
            </strong>
            <span className="opacity-95">{activeItem.content}</span>
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors shrink-0"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

