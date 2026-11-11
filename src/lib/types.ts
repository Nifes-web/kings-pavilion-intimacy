export interface Minister {
  id: string;
  name: string;
  title: string;
  biography: string;
  ministryPosition: string;
  programmeRole: string;
  portraitPath?: string;
  isPlaceholder: boolean;
  publicationStatus: "draft" | "preview" | "published" | "unpublished";
}

export interface Testimony {
  id: string;
  slug: string;
  testifierName: string;
  title: string;
  excerpt: string;
  fullTestimony: string;
  profilePhotoPath?: string;
  isPlaceholder: boolean;
  publicationStatus: "draft" | "preview" | "published" | "unpublished";
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "venue" | "registration" | "volunteering";
  isDraftPlaceholder: boolean;
}

export interface PrayerFocusItem {
  id: string;
  title: string;
  scriptureReference?: string;
  description: string;
  session?: string;
  isDraftPlaceholder: boolean;
}

export type VolunteerDepartment =
  | "Media"
  | "Prayer"
  | "Ushering"
  | "Sanitation"
  | "Protocol"
  | "Care"
  | "Logistics"
  | "Security";

export interface DepartmentInfo {
  name: VolunteerDepartment;
  description: string;
  keyResponsibilities: string[];
  meetingRequirementNotice: string;
}

export interface AttendeeFormData {
  fullName: string;
  residentialAddress: string;
  phone: string;
  email: string;
  firstTimeAttendee: boolean | null;
  prayerPoints?: string;
  expectations?: string;
}

export interface VolunteerFormData {
  fullName: string;
  phone: string;
  email: string;
  residentialAddress: string;
  experienceDescription: string;
  availability: string;
  department: VolunteerDepartment | "";
}

export interface RegistrationSystemState {
  isConfigured: boolean;
  isOpen: boolean;
  backendConnected: boolean;
  message: string;
}
