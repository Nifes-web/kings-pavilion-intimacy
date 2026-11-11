"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  HeartHandshake,
  QrCode,
  TrendingUp,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load database analytics.");
        return;
      }
      setAnalytics(data.data);
    } catch {
      setError("Network error loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-goldYellow" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-200 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="font-bold">Analytics Unavailable</span>
        </div>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  const deptCounts = analytics.departmentCounts || {};
  const maxDept = Math.max(1, ...Object.values(deptCounts).map((v: any) => Number(v) || 0));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Real-time Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white">
              Database Real-time Telemetry
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Computed directly from PostgreSQL database records. Zero fabricated statistics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Attendees
          </span>
          <span className="text-4xl font-black text-white block tracking-tight">
            {analytics.totalAttendees}
          </span>
          <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-1 border-t border-white/5">
            <span>{analytics.firstTimeAttendees} First-timers</span>
            <span>&bull;</span>
            <span>{analytics.returningAttendees} Returning</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            First-Timer Ratio
          </span>
          <span className="text-4xl font-black text-brand-goldYellow block tracking-tight">
            {analytics.totalAttendees > 0
              ? `${Math.round((analytics.firstTimeAttendees / analytics.totalAttendees) * 100)}%`
              : "0%"}
          </span>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-white/5">
            Percentage of new believers attending
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Volunteers
          </span>
          <span className="text-4xl font-black text-brand-flameOrange block tracking-tight">
            {analytics.totalVolunteers}
          </span>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-white/5">
            Applied across 8 departments
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#15111D] border border-white/10 space-y-2 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Check-in Rate
          </span>
          <span className="text-4xl font-black text-green-400 block tracking-tight">
            {analytics.checkinRate}%
          </span>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-white/5">
            {analytics.checkedInAttendees} of {analytics.totalAttendees} scanned at entrance
          </div>
        </div>
      </div>

      {/* Volunteer Distribution Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#15111D] border border-white/10 space-y-6 shadow-2xl">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Volunteer Applications by Department
          </h3>
          <p className="text-xs text-gray-400">
            Actual applicant counts for each designated ministry service department.
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(deptCounts).map(([dept, count]: [string, any]) => {
            const num = Number(count) || 0;
            const pct = Math.round((num / maxDept) * 100);
            return (
              <div key={dept} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{dept}</span>
                  <span className="text-brand-goldYellow font-mono font-bold">
                    {num} applicants
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow transition-all duration-500"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transparent Disclaimer on Unavailable Telemetry */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brand-goldYellow shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Telemetry Boundary &amp; Tracking Notice
          </h4>
        </div>
        <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
          <p>
            The metrics above reflect <strong>authoritative database records</strong> stored inside your Supabase PostgreSQL cluster.
          </p>
          <p>
            The following external analytics streams are currently <strong>unconfigured</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-500">
            {analytics.unsupportedMetrics?.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

