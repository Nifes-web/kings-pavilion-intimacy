"use client";

import React from "react";
import Link from "next/link";
import { AdminTab, AdminUser } from "./adminTypes";
import {
  Menu,
  QrCode,
  LogOut,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminHeaderProps {
  activeTab: AdminTab;
  currentUser: AdminUser | null;
  onOpenMobileSidebar: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  dbConnected: boolean;
}

export function AdminHeader({
  activeTab,
  currentUser,
  onOpenMobileSidebar,
  onRefresh,
  isRefreshing,
  onLogout,
  dbConnected,
}: AdminHeaderProps) {
  const tabTitles: Record<AdminTab, string> = {
    overview: "Dashboard Overview",
    content: "Website Content Hub",
    homepage: "Homepage Section Editor",
    about: "About the Bootcamp",
    ministers: "Ministers Management",
    faqs: "FAQs Management",
    announcements: "Announcements & Banners",
    testimonies: "Testimonies Moderation",
    media: "Media Asset Library",
    seo: "SEO & Social Sharing",
    analytics: "Real-time Analytics Telemetry",
    attendees: "Registered Attendees",
    volunteers: "Volunteer Applications",
    checkin: "Check-in Management",
    accounts: "Administration & Accounts",
    security: "Security Governance & MFA",
    audit: "Activity & Audit Logs",
    backups: "Database & Media Backups",
    readiness: "Production Readiness Diagnostics",
    preview: "Multi-Device Website Preview",
    settings: "Website Settings",
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#120E1A]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white lg:hidden"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>{tabTitles[activeTab]}</span>
          </h1>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            King&apos;s Pavilion Intimacy Prayer Bootcamp &bull; Management Console
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* DB Connection Pill */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            dbConnected
              ? "bg-green-500/10 text-green-400 border-green-500/30"
              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
          }`}
          title={
            dbConnected
              ? "Connected to Supabase PostgreSQL database"
              : "CMS tables pending migration on Supabase"
          }
        >
          {dbConnected ? (
            <CheckCircle2 className="w-3 h-3 text-green-400" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
          <span>{dbConnected ? "Database Live" : "Migration Pending"}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Check-in Terminal Link */}
        <Link
          href="/checkin"
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 transition-all"
        >
          <QrCode className="w-3.5 h-3.5 text-gray-950" />
          <span>Check-in Terminal</span>
        </Link>

        {/* Admin User Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
          <Shield className="w-3.5 h-3.5 text-brand-goldYellow" />
          <span className="font-semibold text-white max-w-[120px] sm:max-w-[160px] truncate">
            {currentUser?.email || "Admin"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Sign Out"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

