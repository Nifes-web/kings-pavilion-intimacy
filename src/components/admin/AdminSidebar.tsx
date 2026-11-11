"use client";

import React from "react";
import Link from "next/link";
import { AdminTab } from "./adminTypes";
import {
  LayoutDashboard,
  FileText,
  Home,
  BookOpen,
  Users2,
  HelpCircle,
  Megaphone,
  MessageSquareQuote,
  Image as ImageIcon,
  Search,
  BarChart3,
  UserCheck,
  HeartHandshake,
  QrCode,
  ShieldCheck,
  Settings,
  ExternalLink,
  Flame,
  Database,
  Smartphone,
  KeyRound,
  ShieldAlert,
  Lock,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  isOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const navSections = [
    {
      group: "Overview",
      items: [
        { id: "overview" as AdminTab, label: "Dashboard Overview", icon: LayoutDashboard },
      ],
    },
    {
      group: "Website Content",
      items: [
        { id: "content" as AdminTab, label: "Content Hub", icon: FileText },
        { id: "homepage" as AdminTab, label: "Homepage Editor", icon: Home },
        { id: "about" as AdminTab, label: "About the Bootcamp", icon: BookOpen },
        { id: "ministers" as AdminTab, label: "Ministers Management", icon: Users2 },
        { id: "faqs" as AdminTab, label: "FAQs Management", icon: HelpCircle },
        { id: "announcements" as AdminTab, label: "Announcements", icon: Megaphone },
        { id: "testimonies" as AdminTab, label: "Testimonies", icon: MessageSquareQuote },
      ],
    },
    {
      group: "Assets & Marketing",
      items: [
        { id: "media" as AdminTab, label: "Media Library", icon: ImageIcon },
        { id: "seo" as AdminTab, label: "SEO Management", icon: Search },
        { id: "analytics" as AdminTab, label: "Analytics Telemetry", icon: BarChart3 },
        { id: "preview" as AdminTab, label: "Multi-Device Preview", icon: Smartphone },
      ],
    },
    {
      group: "Bootcamp Operations",
      items: [
        { id: "attendees" as AdminTab, label: "Registered Attendees", icon: UserCheck },
        { id: "volunteers" as AdminTab, label: "Volunteer Applicants", icon: HeartHandshake },
        { id: "checkin" as AdminTab, label: "Check-in Management", icon: QrCode },
      ],
    },
    {
      group: "System & Governance",
      items: [
        { id: "accounts" as AdminTab, label: "Admin & Operators", icon: ShieldCheck },
        { id: "security" as AdminTab, label: "Security & MFA", icon: KeyRound },
        { id: "audit" as AdminTab, label: "Activity & Audit Logs", icon: Lock },
        { id: "backups" as AdminTab, label: "Backup & Recovery", icon: Database },
        { id: "readiness" as AdminTab, label: "Production Diagnostics", icon: ShieldAlert },
        { id: "settings" as AdminTab, label: "Website Settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#100D18] border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-fireRed to-brand-goldYellow flex items-center justify-center text-white shadow-fire-glow">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-tight">
                King&apos;s Pavilion
              </span>
              <span className="block text-[10px] font-bold text-brand-goldYellow uppercase tracking-wider">
                CMS Expansion
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {section.group}
              </span>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-brand-fireRed/20 via-brand-flameOrange/15 to-transparent text-white border-l-2 border-brand-goldYellow font-bold"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-brand-goldYellow" : "text-gray-400"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-[#0C0A12] space-y-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <span>View Live Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>
        </div>
      </aside>
    </>
  );
}

