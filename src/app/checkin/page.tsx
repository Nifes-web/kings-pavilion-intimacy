"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Wifi,
  WifiOff,
  LogOut,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Camera,
  Flame,
} from "lucide-react";

interface OperatorUser {
  adminId: string;
  email: string;
  fullName: string;
  role: "main_admin" | "checkin_operator";
}

interface AttendeeSummary {
  id?: string;
  reference: string;
  fullName: string;
  attendanceCategory: string;
  firstTime: boolean;
  checkedIn: boolean;
  checkedInAt?: string | null;
  operatorEmail?: string | null;
}

interface EventStats {
  totalRegistered: number;
  totalCheckedIn: number;
  remaining: number;
  percentage: number;
}

export default function CheckinPage() {
  const router = useRouter();

  // Auth & Session
  const [operator, setOperator] = useState<OperatorUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI State
  const [mode, setMode] = useState<"camera" | "search">("camera");
  const [stats, setStats] = useState<EventStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);

  // Camera Scanner
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const scannerRef = useRef<unknown>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AttendeeSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Active Verification / Confirmation
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeSummary | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // 1. Check Authentication on Mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setOperator(data.user);
          setAuthLoading(false);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // 2. Network status & Offline Queue Monitoring
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check localStorage offline queue
    try {
      const stored = localStorage.getItem("kp_offline_checkins");
      if (stored) {
        const queue = JSON.parse(stored);
        if (Array.isArray(queue)) setOfflineCount(queue.length);
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Fetch Event Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/checkin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore in offline mode
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && operator) {
      fetchStats();
    }
  }, [authLoading, operator]);

  // 4. Initialize Camera Scanner when mode === 'camera'
  useEffect(() => {
    let html5QrCode: any = null;

    if (mode === "camera" && !authLoading && operator) {
      import("html5-qrcode")
        .then((pkg) => {
          const Html5Qrcode = pkg.Html5Qrcode;
          html5QrCode = new Html5Qrcode("qr-reader-container");
          scannerRef.current = html5QrCode;

          return html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string) => {
              handleQrScanned(decodedText);
            },
            () => {
              // Ignore frame read misses
            }
          );
        })
        .then(() => {
          setCameraActive(true);
          setCameraError(null);
        })
        .catch((err) => {
          console.warn("[Scanner] Camera init error:", err);
          setCameraError(
            "Camera permission denied or camera unavailable. You can use the search bar or enter the reference code below."
          );
          setCameraActive(false);
        });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [mode, authLoading, operator]);

  // Handle scanned raw QR text
  const handleQrScanned = async (rawText: string) => {
    setScanMessage(null);
    setVerifying(true);

    let reference = "";
    let token = "";

    try {
      // Parse structured JSON payload
      if (rawText.startsWith("{")) {
        const payload = JSON.parse(rawText);
        reference = payload.ref || "";
        token = payload.tok || "";
      } else {
        // Direct reference code
        reference = rawText.trim();
      }
    } catch {
      reference = rawText.trim();
    }

    if (!reference) {
      setScanMessage({ type: "error", text: "Invalid QR code format." });
      setVerifying(false);
      return;
    }

    // Call verify endpoint
    try {
      const res = await fetch("/api/attendees/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, token: token || "manual-entry-token" }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setScanMessage({ type: "error", text: "Pass not found. Unrecognized reference code." });
        setSelectedAttendee(null);
        return;
      }

      if (res.status === 401) {
        setScanMessage({ type: "error", text: "Invalid or forged pass. Security token mismatch." });
        setSelectedAttendee(null);
        return;
      }

      if (res.ok && data.valid && data.attendee) {
        const att = data.attendee;
        setSelectedAttendee({
          reference: att.reference,
          fullName: att.fullName,
          attendanceCategory: att.attendanceCategory,
          firstTime: att.firstTime,
          checkedIn: att.checkedIn,
          checkedInAt: att.checkedInAt,
        });

        if (att.checkedIn) {
          setScanMessage({
            type: "warning",
            text: `Already Checked-In at ${new Date(att.checkedInAt).toLocaleTimeString()}`,
          });
        } else {
          setScanMessage({
            type: "success",
            text: "Pass Verified! Ready for check-in confirmation.",
          });
        }
      } else {
        setScanMessage({ type: "error", text: data.error || "Verification failed." });
      }
    } catch {
      setScanMessage({ type: "error", text: "Network error during pass verification." });
    } finally {
      setVerifying(false);
    }
  };

  // 5. Confirm Check-in Action
  const handleConfirmCheckin = async () => {
    if (!selectedAttendee) return;
    setConfirming(true);
    setScanMessage(null);

    // If device is offline, store in offline queue
    if (!navigator.onLine) {
      try {
        const stored = localStorage.getItem("kp_offline_checkins") || "[]";
        const queue: Array<{ reference: string; scannedAt: string; deviceId: string }> = JSON.parse(stored);
        
        // Prevent duplicate queueing of the same reference
        const alreadyQueued = queue.some((item) => item.reference === selectedAttendee.reference);
        if (alreadyQueued) {
          setScanMessage({
            type: "warning",
            text: `Pass ${selectedAttendee.reference} is already in the offline queue waiting to sync.`,
          });
          setConfirming(false);
          return;
        }

        queue.push({
          reference: selectedAttendee.reference,
          scannedAt: new Date().toISOString(),
          deviceId: `device-${operator?.email?.split("@")[0] || "op"}`,
        });
        localStorage.setItem("kp_offline_checkins", JSON.stringify(queue));
        setOfflineCount(queue.length);

        setSelectedAttendee((prev) =>
          prev ? { ...prev, checkedIn: true, checkedInAt: new Date().toISOString() } : null
        );
        setScanMessage({
          type: "success",
          text: "Checked-in saved locally! (Queued for sync when online)",
        });
      } catch {
        setScanMessage({ type: "error", text: "Failed to save offline check-in." });
      } finally {
        setConfirming(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: selectedAttendee.reference,
          deviceId: `terminal-${operator?.email?.split("@")[0] || "web"}`,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setSelectedAttendee((prev) =>
          prev
            ? {
                ...prev,
                checkedIn: true,
                checkedInAt: data.checkedInAt || new Date().toISOString(),
              }
            : null
        );
        setScanMessage({
          type: "warning",
          text: `Duplicate check-in prevented. ${data.error || "Already checked in."}`,
        });
        return;
      }

      if (!res.ok) {
        setScanMessage({ type: "error", text: data.error || "Check-in failed." });
        return;
      }

      // Success
      setSelectedAttendee((prev) =>
        prev
          ? {
              ...prev,
              checkedIn: true,
              checkedInAt: data.attendee.checkedInAt,
            }
          : null
      );
      setScanMessage({
        type: "success",
        text: `Check-in confirmed for ${selectedAttendee.fullName}!`,
      });

      // Refresh live counts
      fetchStats();
    } catch {
      setScanMessage({ type: "error", text: "Network error during check-in confirmation." });
    } finally {
      setConfirming(false);
    }
  };

  // 6. Manual Search lookup
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setSearchLoading(true);
    setSearchResults([]);
    setScanMessage(null);

    try {
      const res = await fetch(`/api/checkin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (res.ok && data.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          setScanMessage({ type: "warning", text: "No attendees found matching that query." });
        }
      } else {
        setScanMessage({ type: "error", text: data.error || "Search failed." });
      }
    } catch {
      setScanMessage({ type: "error", text: "Network error during search lookup." });
    } finally {
      setSearchLoading(false);
    }
  };

  // 7. Sync Offline Queue
  const handleSyncOfflineQueue = async () => {
    try {
      const stored = localStorage.getItem("kp_offline_checkins");
      if (!stored) return;
      const queue = JSON.parse(stored);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const res = await fetch("/api/checkin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkins: queue }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Retain only items that encountered network/server errors (clear successes and duplicates)
        const processedRefs = new Set(
          (data.results || [])
            .filter((r: any) => r.status === "synced" || r.status === "already_checked_in" || r.status === "not_found")
            .map((r: any) => r.reference)
        );
        const remainingQueue = queue.filter((item: any) => !processedRefs.has(item.reference));

        if (remainingQueue.length > 0) {
          localStorage.setItem("kp_offline_checkins", JSON.stringify(remainingQueue));
          setOfflineCount(remainingQueue.length);
        } else {
          localStorage.removeItem("kp_offline_checkins");
          setOfflineCount(0);
        }

        setScanMessage({
          type: "success",
          text: `Offline sync complete! ${data.summary.syncedCount} synced, ${data.summary.alreadyCheckedInCount} already present.`,
        });
        fetchStats();
      }
    } catch {
      setScanMessage({ type: "error", text: "Failed to synchronize offline queue." });
    }
  };

  // 8. Sign Out
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09080E] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-goldYellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      {/* Operator Header Bar */}
      <header className="sticky top-0 z-30 bg-[#120E1A]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-fireRed to-brand-goldYellow flex items-center justify-center text-white shadow-fire-glow">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">
                  Intimacy 2026
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-goldYellow/20 text-brand-goldYellow uppercase border border-brand-goldYellow/30">
                  Terminal
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-none">
                Operator: <span className="text-gray-200">{operator?.fullName}</span> ({operator?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online/Offline indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Admin portal link if user is main_admin */}
            {operator?.role === "main_admin" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-goldYellow" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Event Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#15111D] border border-white/5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Registered
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.totalRegistered ?? "—"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#15111D] border border-white/5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-400">
              Checked In
            </span>
            <div className="text-2xl sm:text-3xl font-black text-green-400">
              {stats?.totalCheckedIn ?? "—"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#15111D] border border-white/5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Remaining
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {stats?.remaining ?? "—"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#15111D] border border-white/5 space-y-1 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-goldYellow">
                Attendance %
              </span>
              <div className="text-2xl sm:text-3xl font-black text-brand-goldYellow">
                {stats ? `${stats.percentage}%` : "—"}
              </div>
            </div>
            <button
              onClick={fetchStats}
              disabled={statsLoading}
              title="Refresh Stats"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Offline Queue Notice */}
        {offlineCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>{offlineCount} offline check-in(s)</strong> waiting in local queue.
              </span>
            </div>
            {isOnline && (
              <button
                onClick={handleSyncOfflineQueue}
                className="px-3 py-1.5 rounded-full bg-amber-500 text-gray-950 font-bold hover:brightness-110 transition-all text-xs"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* Navigation Mode Switcher */}
        <div className="flex rounded-2xl bg-[#15111D] p-1 border border-white/10">
          <button
            onClick={() => {
              setMode("camera");
              setSelectedAttendee(null);
              setScanMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === "camera"
                ? "bg-gradient-to-r from-brand-flameOrange to-brand-goldYellow text-gray-950 shadow-gold-glow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera QR Scanner</span>
          </button>

          <button
            onClick={() => {
              setMode("search");
              setSelectedAttendee(null);
              setScanMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === "search"
                ? "bg-gradient-to-r from-brand-flameOrange to-brand-goldYellow text-gray-950 shadow-gold-glow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual Lookup</span>
          </button>
        </div>

        {/* Status / Alert Banner */}
        {scanMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 text-sm animate-in fade-in ${
              scanMessage.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-200"
                : scanMessage.type === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
          >
            {scanMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : scanMessage.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium">{scanMessage.text}</span>
          </div>
        )}

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scanner or Search */}
          <div className="lg:col-span-7 space-y-4">
            {mode === "camera" ? (
              <div className="rounded-3xl bg-[#15111D] border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-goldYellow" />
                    <span>Viewfinder Scanner</span>
                  </h2>
                  <span className="text-xs text-gray-400">Position QR code inside box</span>
                </div>

                {/* Viewfinder div required by html5-qrcode */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-[360px] mx-auto flex items-center justify-center border border-white/10">
                  <div id="qr-reader-container" className="w-full h-full" />
                  {verifying && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="flex items-center gap-2 text-sm text-brand-goldYellow font-bold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying QR Pass…</span>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                    {cameraError}
                  </div>
                )}

                {/* Quick Barcode Scanner / Manual Code Input fallback */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Or Enter / Scan Reference Code Directly:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQrScanned(manualCodeInput);
                          setManualCodeInput("");
                        }
                      }}
                      placeholder="e.g. KP-1793574757457-897EC8C7"
                      className="flex-grow px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleQrScanned(manualCodeInput);
                        setManualCodeInput("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 transition-all"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Search Interface */
              <div className="rounded-3xl bg-[#15111D] border border-white/10 p-5 space-y-4">
                <form onSubmit={handleSearch} className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Search Attendee
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by full name, phone number, or reference..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searchLoading}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow hover:brightness-110 transition-all flex items-center gap-1.5"
                    >
                      {searchLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                      ) : (
                        <span>Search</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Search Results List */}
                <div className="space-y-2 pt-2 max-h-[420px] overflow-y-auto">
                  {searchResults.map((att) => (
                    <div
                      key={att.id || att.reference}
                      onClick={() => {
                        setSelectedAttendee(att);
                        setScanMessage(
                          att.checkedIn
                            ? {
                                type: "warning",
                                text: `Already Checked-In at ${new Date(
                                  att.checkedInAt!
                                ).toLocaleTimeString()}`,
                              }
                            : null
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedAttendee?.reference === att.reference
                          ? "bg-brand-goldYellow/20 border-brand-goldYellow"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-white">{att.fullName}</div>
                        <div className="text-[11px] font-mono text-brand-goldYellow">
                          {att.reference}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {att.checkedIn ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Checked In
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Verification & Check-In Action Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-[#15111D] border border-white/10 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-goldYellow" />
                  <span>Pass Details</span>
                </h3>
                {selectedAttendee && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                      selectedAttendee.checkedIn
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-green-500/20 text-green-400 border-green-500/40"
                    }`}
                  >
                    {selectedAttendee.checkedIn ? "Already Admitted" : "Verified Pass"}
                  </span>
                )}
              </div>

              {selectedAttendee ? (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Attendee Name
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {selectedAttendee.fullName}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reference:</span>
                      <span className="font-mono font-bold text-brand-goldYellow">
                        {selectedAttendee.reference}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="font-semibold text-white capitalize">
                        {selectedAttendee.attendanceCategory}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">First-Time Attendee:</span>
                      <span className="font-semibold text-white">
                        {selectedAttendee.firstTime ? "Yes" : "No"}
                      </span>
                    </div>

                    {selectedAttendee.checkedInAt && (
                      <div className="flex justify-between pt-1 border-t border-white/5">
                        <span className="text-amber-400">Checked In At:</span>
                        <span className="font-semibold text-amber-200">
                          {new Date(selectedAttendee.checkedInAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Action Button */}
                  <div>
                    {selectedAttendee.checkedIn ? (
                      <button
                        disabled
                        className="w-full py-4 rounded-full text-sm font-extrabold text-gray-400 bg-white/5 border border-white/10 cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                        <span>Pass Already Admitted</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmCheckin}
                        disabled={confirming}
                        className="w-full py-4 rounded-full text-base font-extrabold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-gray-950" />
                            <span>Recording Check-In…</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-gray-950" />
                            <span>Confirm Attendee Entry</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 text-gray-400">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <p className="text-xs">
                    Scan a QR pass with the camera viewfinder or search for an attendee by reference/name to load pass details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

