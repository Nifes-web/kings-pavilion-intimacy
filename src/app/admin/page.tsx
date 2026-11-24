"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminTab, AdminUser, CmsContentData, FeedbackMessage } from "@/components/admin/adminTypes";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { ContentHub } from "@/components/admin/ContentHub";
import { HomepageEditor } from "@/components/admin/HomepageEditor";
import { MinistersManager } from "@/components/admin/MinistersManager";
import { FaqsManager } from "@/components/admin/FaqsManager";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { TestimoniesManager } from "@/components/admin/TestimoniesManager";
import { MediaManager } from "@/components/admin/MediaManager";
import { SeoManager } from "@/components/admin/SeoManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AttendeesManager } from "@/components/admin/AttendeesManager";
import { VolunteersManager } from "@/components/admin/VolunteersManager";
import { CheckinManager } from "@/components/admin/CheckinManager";
import { AccountsManager } from "@/components/admin/AccountsManager";
import { WebsiteSettingsManager } from "@/components/admin/WebsiteSettingsManager";
import { SitePreviewer } from "@/components/admin/SitePreviewer";
import { AuditLogsManager } from "@/components/admin/AuditLogsManager";
import { BackupRecoveryManager } from "@/components/admin/BackupRecoveryManager";
import { ReadinessScanner } from "@/components/admin/ReadinessScanner";
import { SecuritySettingsManager } from "@/components/admin/SecuritySettingsManager";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // CSRF Token
  const [csrfToken, setCsrfToken] = useState("");

  // Feedback Notification
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Operators List State (Preserving accounts management)
  const [operators, setOperators] = useState<AdminUser[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // CMS Content State
  const [cmsData, setCmsData] = useState<CmsContentData>({
    siteContent: [],
    ministers: [],
    faqs: [],
    announcements: [],
    siteSettings: [],
    testimonies: [],
    auditLogs: [],
    dbConnected: true,
    migrationPending: false,
  });
  const [cmsLoading, setCmsLoading] = useState(false);

  // Metrics counts
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [checkinsCount, setCheckinsCount] = useState(0);

  // 1. Authenticate Main Admin & Fetch CSRF
  useEffect(() => {
    // A. CSRF Token
    fetch("/api/csrf-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) setCsrfToken(data.token);
      })
      .catch(() => {});

    // B. Check Authenticated User
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.role !== "main_admin") {
            router.push("/checkin");
            return;
          }
          setCurrentUser(data.user);
          setAuthLoading(false);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // 2. Fetch CMS Content
  const fetchCmsContent = useCallback(async () => {
    setCmsLoading(true);
    try {
      const res = await fetch("/api/admin/cms/content");
      const data = await res.json();
      if (res.ok) {
        setCmsData({
          siteContent: data.siteContent || [],
          ministers: data.ministers || [],
          faqs: data.faqs || [],
          announcements: data.announcements || [],
          siteSettings: data.siteSettings || [],
          testimonies: data.testimonies || [],
          auditLogs: data.auditLogs || [],
          dbConnected: data.dbConnected ?? true,
          migrationPending: data.migrationPending ?? false,
        });
      }
    } catch {
      // Graceful error
    } finally {
      setCmsLoading(false);
    }
  }, []);

  // 3. Fetch Operators
  const fetchOperators = useCallback(async () => {
    setOperatorsLoading(true);
    try {
      const res = await fetch("/api/admin/operators");
      const data = await res.json();
      if (res.ok && data.operators) {
        setOperators(data.operators);
      }
    } catch {
      // Graceful error
    } finally {
      setOperatorsLoading(false);
    }
  }, []);

  // 4. Fetch Analytics Counts
  const fetchAnalyticsCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (res.ok && data.data) {
        setAttendeesCount(data.data.totalAttendees || 0);
        setVolunteersCount(data.data.totalVolunteers || 0);
        setCheckinsCount(data.data.totalCheckins || 0);
      }
    } catch {
      // Graceful error
    }
  }, []);

  // Load initial data on auth
  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchCmsContent();
      fetchOperators();
      fetchAnalyticsCounts();
    }
  }, [authLoading, currentUser, fetchCmsContent, fetchOperators, fetchAnalyticsCounts]);

  const handleRefreshAll = () => {
    fetchCmsContent();
    fetchOperators();
    fetchAnalyticsCounts();
    setFeedback({ type: "info", text: "Dashboard data refreshed from database." });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const showSuccessFeedback = (msg: string) => {
    setFeedback({ type: "success", text: msg });
  };

  const showErrorFeedback = (msg: string) => {
    setFeedback({ type: "error", text: msg });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09080E] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-goldYellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex selection:bg-brand-flameOrange selection:text-white">
      {/* 1. Collapsible Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Sticky Header */}
        <AdminHeader
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onRefresh={handleRefreshAll}
          isRefreshing={cmsLoading || operatorsLoading}
          onLogout={handleLogout}
          dbConnected={cmsData.dbConnected}
        />

        {/* Dynamic Main Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Dismissible Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
                feedback.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-200"
                  : feedback.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-200"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section Router */}
          {activeTab === "overview" && (
            <DashboardOverview
              cmsData={cmsData}
              attendeesCount={attendeesCount}
              volunteersCount={volunteersCount}
              checkinsCount={checkinsCount}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "content" && (
            <ContentHub cmsData={cmsData} onNavigateTab={setActiveTab} />
          )}

          {(activeTab === "homepage" || activeTab === "about") && (
            <HomepageEditor
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "ministers" && (
            <MinistersManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "faqs" && (
            <FaqsManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "announcements" && (
            <AnnouncementsManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "testimonies" && (
            <TestimoniesManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "media" && (
            <MediaManager
              csrfToken={csrfToken}
              onShowFeedback={(type, text) => setFeedback({ type, text })}
            />
          )}

          {activeTab === "seo" && (
            <SeoManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}

          {activeTab === "analytics" && <AnalyticsDashboard />}

          {activeTab === "attendees" && <AttendeesManager />}

          {activeTab === "volunteers" && <VolunteersManager />}

          {activeTab === "checkin" && (
            <CheckinManager
              attendeesCount={attendeesCount}
              checkinsCount={checkinsCount}
            />
          )}

          {activeTab === "accounts" && (
            <AccountsManager
              operators={operators}
              loading={operatorsLoading}
              onRefresh={fetchOperators}
              onSuccess={showSuccessFeedback}
              onError={showErrorFeedback}
            />
          )}

          {activeTab === "preview" && <SitePreviewer />}

          {activeTab === "security" && currentUser && (
            <SecuritySettingsManager
              currentUser={currentUser}
              csrfToken={csrfToken}
              onShowFeedback={(type, text) => setFeedback({ type, text })}
            />
          )}

          {activeTab === "audit" && <AuditLogsManager />}

          {activeTab === "backups" && (
            <BackupRecoveryManager
              csrfToken={csrfToken}
              onShowFeedback={(type, text) => setFeedback({ type, text })}
            />
          )}

          {activeTab === "readiness" && <ReadinessScanner />}

          {activeTab === "settings" && (
            <WebsiteSettingsManager
              cmsData={cmsData}
              csrfToken={csrfToken}
              onMutateSuccess={showSuccessFeedback}
              onMutateError={showErrorFeedback}
              onRefreshData={fetchCmsContent}
            />
          )}
        </main>
      </div>
    </div>
  );
}
