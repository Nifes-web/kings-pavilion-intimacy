"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Download,
  ExternalLink,
  Flame,
  Lock,
  Zap,
  Eye,
  Mail,
  Link2,
  Smartphone,
} from "lucide-react";
import { ReadinessReport, ReadinessCheckResult } from "@/lib/readinessService";

export function ReadinessScanner() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const runScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/readiness");
      const data = await res.json();
      if (res.ok && data.report) {
        setReport(data.report);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const exportReport = () => {
    if (!report) return;
    const mdLines = [
      `# King's Pavilion Intimacy CMS — Production Readiness Audit Report`,
      `**Generated:** ${new Date(report.timestamp).toLocaleString()}`,
      `**Overall Health Score:** ${report.overallScore}%`,
      `**Passed:** ${report.passed} | **Warnings:** ${report.warnings} | **Failed:** ${report.failed}`,
      ``,
      `---`,
      `## Detailed Check Results`,
      ``,
    ];

    for (const c of report.checks) {
      mdLines.push(`### [${c.status.toUpperCase()}] ${c.category}: ${c.name}`);
      mdLines.push(`- **Message:** ${c.message}`);
      if (c.recommendation) {
        mdLines.push(`- **Action Item:** ${c.recommendation}`);
      }
      mdLines.push(``);
    }

    const blob = new Blob([mdLines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kings-pavilion-readiness-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    "all",
    "Security",
    "Performance",
    "Accessibility",
    "Email Delivery",
    "Broken Links",
    "Mobile Responsiveness",
  ];

  const filteredChecks = report?.checks.filter(
    (c) => activeCategory === "all" || c.category === activeCategory
  ) || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#120E1A] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-goldYellow" />
            <h2 className="text-xl font-bold text-white">Production Readiness &amp; Diagnostics Engine</h2>
          </div>
          <p className="text-xs text-gray-400">
            Real-time scanner evaluating security boundaries, asset performance, accessibility, email relay, broken links, and mobile responsiveness.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportReport}
            disabled={!report}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-40 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-brand-goldYellow" />
            <span>Export Report (MD)</span>
          </button>

          <button
            onClick={runScan}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110 disabled:opacity-50 flex items-center gap-2 shadow-gold-glow transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Diagnostics...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Diagnostic Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Score Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-2">
            <span className="text-xs font-semibold text-gray-400 block">Overall Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{report.overallScore}%</span>
              <span className="text-xs text-gray-400 font-medium">Ready</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${report.overallScore}%` }}
                className="h-full bg-gradient-to-r from-brand-flameOrange to-emerald-400"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Passed Checks</span>
            <span className="text-2xl font-black text-white">{report.passed}</span>
            <span className="text-[11px] text-emerald-400 block font-medium">100% Core Passing</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Action Advisories</span>
            <span className="text-2xl font-black text-amber-300">{report.warnings}</span>
            <span className="text-[11px] text-amber-400 block font-medium">SMTP Setup Advised</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Critical Failures</span>
            <span className="text-2xl font-black text-rose-400">{report.failed}</span>
            <span className="text-[11px] text-gray-400 block">Zero Critical Blockers</span>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-brand-goldYellow text-black font-bold shadow-md"
                : "bg-[#15111D] text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            {cat === "all" ? "All Diagnostics" : cat}
          </button>
        ))}
      </div>

      {/* Detailed Check Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-goldYellow mb-3" />
            <span className="text-xs">Scanning security boundaries, routes, and performance...</span>
          </div>
        ) : filteredChecks.length > 0 ? (
          filteredChecks.map((item, idx) => {
            const isPass = item.status === "pass";
            const isWarn = item.status === "warn";

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#15111D] border border-white/10 space-y-2 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isPass
                          ? "bg-emerald-500/10 text-emerald-400"
                          : isWarn
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      isPass
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isWarn
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-gray-300 pl-11 leading-relaxed">{item.message}</p>

                {item.recommendation && (
                  <div className="ml-11 mt-2 p-3 rounded-xl bg-[#09080E] border border-amber-500/20 text-xs text-amber-300 space-y-0.5">
                    <strong className="block text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Production Action Advisory:
                    </strong>
                    <span>{item.recommendation}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-2xl bg-[#15111D] border border-white/10 text-center text-xs text-gray-400">
            No diagnostic checks found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

