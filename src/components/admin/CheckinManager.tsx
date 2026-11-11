"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Users,
} from "lucide-react";

interface CheckinManagerProps {
  attendeesCount: number;
  checkinsCount: number;
}

export function CheckinManager({
  attendeesCount,
  checkinsCount,
}: CheckinManagerProps) {
  const [searchRef, setSearchRef] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    setLoading(true);
    setSearched(true);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/checkin/search?q=${encodeURIComponent(searchRef.trim())}`);
      const data = await res.json();
      if (res.ok && data.attendee) {
        setSearchResult(data.attendee);
      } else {
        setSearchResult(null);
      }
    } catch {
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const checkinRate =
    attendeesCount > 0 ? Math.round((checkinsCount / attendeesCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Launch Terminal Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-flameOrange/20 via-brand-goldYellow/15 to-[#15111D] border border-brand-goldYellow/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-goldYellow">
              Check-in Terminal Engine Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Live Hall Entrance Terminal
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
            The dedicated entrance terminal runs full-screen with camera QR barcode scanning, cryptographic HMAC token validation, offline sync queues, and rapid manual search.
          </p>
        </div>

        <Link
          href="/checkin"
          className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 flex items-center gap-2 transition-all shrink-0"
        >
          <QrCode className="w-4 h-4 text-gray-950" />
          <span>Launch Scanner Terminal</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-950" />
        </Link>
      </div>

      {/* Check-in Progress KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Expected
          </span>
          <span className="text-3xl font-black text-white block">
            {attendeesCount}
          </span>
          <span className="text-[11px] text-gray-400">Registered attendee passes</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Checked In
          </span>
          <span className="text-3xl font-black text-green-400 block">
            {checkinsCount}
          </span>
          <span className="text-[11px] text-gray-400">Verified at venue entrance</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Check-in Rate
          </span>
          <span className="text-3xl font-black text-brand-goldYellow block">
            {checkinRate}%
          </span>
          <span className="text-[11px] text-gray-400">Capacity utilization</span>
        </div>
      </div>

      {/* Manual Pass Lookup */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#15111D] border border-white/10 space-y-6 shadow-2xl">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Manual Attendee Pass Verification
          </h3>
          <p className="text-xs text-gray-400">
            Look up an attendee by Reference Number (e.g. <code>KP-1731...</code>) or registered email.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
          <input
            type="text"
            required
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Enter reference (e.g. KP-...) or email..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup</span>
          </button>
        </form>

        {searched && (
          <div className="pt-2">
            {searchResult ? (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white block">
                      {searchResult.full_name}
                    </span>
                    <span className="text-xs text-brand-goldYellow font-mono">
                      {searchResult.reference}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                      searchResult.checked_in_at
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {searchResult.checked_in_at ? "Checked In" : "Not Checked In"}
                  </span>
                </div>
                <div className="text-xs text-gray-400 space-y-1 pt-1 border-t border-white/5">
                  <div>Email: {searchResult.email}</div>
                  <div>Phone: {searchResult.phone}</div>
                  {searchResult.checked_in_at && (
                    <div className="text-green-400">
                      Scanned at: {new Date(searchResult.checked_in_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 max-w-lg">
                No registered attendee found matching &quot;{searchRef}&quot;.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

