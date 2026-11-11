"use client";

import React from "react";
import { ShieldCheck, AlertCircle, Clock } from "lucide-react";

interface RegistrationStatusBannerProps {
  status?: "preview" | "open" | "closed";
  customMessage?: string;
}

export function RegistrationStatusBanner({
  status = "preview",
  customMessage,
}: RegistrationStatusBannerProps) {
  if (status === "preview") {
    return (
      <div
        role="status"
        aria-label="Registration status"
        className="w-full bg-[#110E18] border-b border-white/5 py-2 px-4 text-xs text-gray-300 relative z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-goldYellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-goldYellow"></span>
            </span>
            <span className="font-semibold text-brand-goldYellow text-[11px] uppercase tracking-wider">
              Preview Mode:
            </span>
            <span className="text-gray-300">
              {customMessage ||
                "Attendee & Volunteer registration interfaces are active for client-side preview. Backend persistence connects in Phase 4."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-flameOrange" />
            <span>Secure Platform Architecture</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <div
        role="status"
        aria-label="Registration is currently closed"
        className="w-full bg-[#1F0A0A] border-b border-red-500/30 py-2.5 px-4 text-xs text-red-200 relative z-30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
          <AlertCircle className="w-4 h-4 text-brand-fireRed shrink-0" />
          <span className="font-semibold text-white">Registration Closed:</span>
          <span>
            {customMessage ||
              "Registration for King's Pavilion Intimacy Prayer Bootcamp is currently closed."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Registration is currently open"
      className="w-full bg-[#0D1C10] border-b border-emerald-500/30 py-2.5 px-4 text-xs text-emerald-200 relative z-30"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold text-white">Registration Open:</span>
        <span>
          {customMessage ||
            "Attendee registration and Volunteer applications are now open for 5 Dec 2026."}
        </span>
      </div>
    </div>
  );
}
