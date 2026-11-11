// Location: src/components/admin/adminTypes.ts

export type AdminTab =
  | "overview"
  | "content"
  | "homepage"
  | "about"
  | "ministers"
  | "faqs"
  | "announcements"
  | "testimonies"
  | "media"
  | "seo"
  | "analytics"
  | "preview"
  | "attendees"
  | "volunteers"
  | "checkin"
  | "accounts"
  | "security"
  | "audit"
  | "backups"
  | "readiness"
  | "settings";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "main_admin" | "checkin_operator";
  is_active: boolean;
  last_sign_in_at?: string | null;
  created_at: string;
}

export interface CmsContentData {
  siteContent: any[];
  ministers: any[];
  faqs: any[];
  announcements: any[];
  siteSettings: any[];
  testimonies: any[];
  auditLogs: any[];
  dbConnected: boolean;
  migrationPending: boolean;
}

export interface FeedbackMessage {
  type: "success" | "error" | "info";
  text: string;
}

