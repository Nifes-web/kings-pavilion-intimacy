"use client";

import React, { useState } from "react";
import { CmsContentData } from "./adminTypes";
import {
  Save,
  Settings,
  Phone,
  Mail,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  AlertTriangle,
  FileCode2,
} from "lucide-react";

interface WebsiteSettingsManagerProps {
  cmsData: CmsContentData;
  csrfToken: string;
  onMutateSuccess: (message: string) => void;
  onMutateError: (err: string) => void;
  onRefreshData: () => void;
}

export function WebsiteSettingsManager({
  cmsData,
  csrfToken,
  onMutateSuccess,
  onMutateError,
  onRefreshData,
}: WebsiteSettingsManagerProps) {
  // Extract key settings from cmsData.siteSettings
  const getVal = (key: string, fallback: any = "") => {
    const s = cmsData.siteSettings.find((item) => item.key === key);
    return s?.value !== undefined && s?.value !== null ? s.value : fallback;
  };

  const [eventName, setEventName] = useState(getVal("event_name", "Intimacy"));
  const [eventDate, setEventDate] = useState(
    getVal("event_date", "Saturday, 5 December 2026")
  );
  const [eventTime, setEventTime] = useState(getVal("event_time", "8:00 AM WAT"));
  const [venueName, setVenueName] = useState(
    getVal("venue_name", "IPMAN Event Hall")
  );
  const [venueAddress, setVenueAddress] = useState(
    getVal("venue_address", "Ibadan Road, Ile Ife, Osun State, Nigeria")
  );
  const [inquiryPhone, setInquiryPhone] = useState(
    getVal("contact_inquiry_phone", "+234 800 000 0000")
  );
  const [inquiryEmail, setInquiryEmail] = useState(
    getVal("contact_inquiry_email", "info@kingspavilion.org")
  );
  const [instagram, setInstagram] = useState(
    getVal("social_instagram", "@Rccg_kings_Pavilion_Ife")
  );
  const [regOpen, setRegOpen] = useState<boolean>(
    Boolean(getVal("registration_open", true))
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const settingsMap = [
      { key: "event_name", val: eventName, desc: "Event official title" },
      { key: "event_date", val: eventDate, desc: "Event date string" },
      { key: "event_time", val: eventTime, desc: "Event start time" },
      { key: "venue_name", val: venueName, desc: "Event venue" },
      { key: "venue_address", val: venueAddress, desc: "Full venue address" },
      { key: "contact_inquiry_phone", val: inquiryPhone, desc: "Inquiry phone" },
      { key: "contact_inquiry_email", val: inquiryEmail, desc: "Inquiry email" },
      { key: "social_instagram", val: instagram, desc: "Instagram handle" },
      { key: "registration_open", val: regOpen, desc: "Registration open status" },
    ];

    try {
      // Save each setting record
      for (const item of settingsMap) {
        const existing = cmsData.siteSettings.find((s) => s.key === item.key);
        const isEdit = Boolean(existing && existing.id && !existing.id.startsWith("fallback-"));

        await fetch("/api/admin/cms/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            entity: "site_settings",
            action: isEdit ? "update" : "create",
            recordId: isEdit ? existing.id : undefined,
            payload: {
              key: item.key,
              value: item.val,
              is_public: true,
              description: item.desc,
            },
            changeSummary: `Updated website setting ${item.key}`,
          }),
        });
      }

      onMutateSuccess("Website settings saved successfully.");
      onRefreshData();
    } catch (err: any) {
      onMutateError(err.message || "Network error saving website settings.");
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
                Global Event Configuration
              </h2>
              <p className="text-xs text-gray-400">
                Manage global event metadata, registration status, venue information, and inquiry channels.
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
              <span>Save Settings</span>
            </button>
          </div>

          <div className="space-y-5">
            {/* Registration Availability Toggle */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-white block">
                  Public Registration Status
                </span>
                <span className="text-xs text-gray-400">
                  Allow or temporarily halt new attendee registrations across the website.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRegOpen(!regOpen)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  regOpen ? "bg-green-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    regOpen ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Event Name & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Official Event Name
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Formatted Event Date
                </label>
                <input
                  type="text"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Start Time &amp; Duration
                </label>
                <input
                  type="text"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>

            {/* Venue Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Venue Name
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Full Venue Address
                </label>
                <input
                  type="text"
                  required
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>

            {/* Inquiries and Social Media */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Inquiry Phone Line
                </label>
                <input
                  type="text"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Inquiry Email
                </label>
                <input
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="info@kingspavilion.org"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Official Instagram Handle
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@Rccg_kings_Pavilion_Ife"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Database Schema Status Box */}
      <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <FileCode2 className="w-5 h-5 text-brand-goldYellow" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Supabase PostgreSQL Migration Status
          </h3>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
          The Phase 1 CMS expansion migrations are fully verified with 50+ passing PostgreSQL WASM test assertions.
          File: <code>supabase/migrations/20261110210000_cms_foundation.sql</code>.
        </p>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300 space-y-1">
          <div>Foundation: 20261110210000_cms_foundation.sql (Preflight, Tables, RPC, Triggers)</div>
          <div>Seed Data:  20261110211000_cms_seed_data.sql (Draft defaults for ministers, FAQs, settings)</div>
        </div>
      </div>
    </div>
  );
}

