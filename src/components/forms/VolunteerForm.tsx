"use client";

import React, { useState, useRef, useEffect } from "react";
import { VOLUNTEER_DEPARTMENTS } from "@/data/eventData";
import { normaliseEmail, normalisePhoneNumber } from "@/lib/utils";
import { VolunteerDepartment, VolunteerFormData } from "@/lib/types";
import {
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// CSRF fetch helper
// ---------------------------------------------------------------------------
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", { credentials: "same-origin" });
  if (!res.ok) throw new Error("Could not fetch CSRF token.");
  const json = await res.json();
  return json.token as string;
}

export function VolunteerForm() {
  const [formData, setFormData] = useState<VolunteerFormData>({
    fullName: "",
    phone: "",
    email: "",
    residentialAddress: "",
    experienceDescription: "",
    availability: "",
    department: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const csrfTokenRef = useRef<string | null>(null);

  // Pre-fetch CSRF token on mount
  useEffect(() => {
    fetchCsrfToken()
      .then((t) => { csrfTokenRef.current = t; })
      .catch(() => { /* will retry on submit */ });
  }, []);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required.";
    }

    const cleanedPhone = formData.phone.replace(/[\s\-()]/g, "");
    if (!cleanedPhone) {
      errs.phone = "Phone number is required.";
    } else if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
      errs.phone = "Enter a valid phone number (e.g. 08012345678 or +2348012345678).";
    }

    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = "Enter a valid email address.";
      }
    }

    if (!formData.residentialAddress.trim()) {
      errs.residentialAddress = "Residential address or city is required.";
    }

    if (!formData.department) {
      errs.department = "Please select a department to serve in.";
    }

    if (!formData.availability) {
      errs.availability = "Please indicate your availability schedule.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitState({ status: "submitting" });

    try {
      if (!csrfTokenRef.current) {
        csrfTokenRef.current = await fetchCsrfToken();
      }

      const res = await fetch("/api/volunteers", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfTokenRef.current,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          residentialAddress: formData.residentialAddress,
          department: formData.department,
          availability: formData.availability,
          experienceDescription: formData.experienceDescription,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error?.toLowerCase().includes("csrf")) {
        csrfTokenRef.current = await fetchCsrfToken();
        const retryRes = await fetch("/api/volunteers", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfTokenRef.current,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            residentialAddress: formData.residentialAddress,
            department: formData.department,
            availability: formData.availability,
            experienceDescription: formData.experienceDescription,
          }),
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.error || "Application submission failed. Please try again.");
        }
        setSubmitState({
          status: "success",
          reference: retryData.reference || "VOLUNTEER-SUBMITTED",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Application submission failed. Please try again.");
      }

      setSubmitState({
        status: "success",
        reference: data.reference || "VOLUNTEER-SUBMITTED",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitState({ status: "error", message: msg });
    }
  };

  const handleEditAgain = () => {
    setSubmitState({ status: "idle" });
    fetchCsrfToken().then((t) => { csrfTokenRef.current = t; }).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-goldYellow uppercase tracking-wider">
          <HeartHandshake className="w-3.5 h-3.5 text-brand-goldYellow" />
          <span>Altar Service Team</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Serve at{" "}
          <span className="bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-white bg-clip-text text-transparent">
            INTIMACY 2026
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Join our consecrated workforce for the 12 Hours Prayer Bootcamp on Saturday, 5 December 2026 at IPMAN Event Hall, Ile Ife.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#16121D] to-[#0E0C14] border border-white/10 p-6 sm:p-10 shadow-2xl">
        {/* Success State */}
        {submitState.status === "success" ? (
          <div className="p-6 rounded-2xl bg-[#1A1424] border border-brand-goldYellow/40 space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Application Received</h3>
                <p className="text-xs text-gray-400">
                  Thank you for offering your service unto the Lord.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Application Reference
                </span>
                <span className="font-mono font-bold text-brand-goldYellow text-sm">
                  {submitState.reference}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Applicant Name
                </span>
                <span className="text-white font-medium">{formData.fullName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Assigned Department
                </span>
                <span className="text-brand-goldYellow font-medium">{formData.department}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Phone
                </span>
                <span className="text-white font-medium">{formData.phone}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Our workforce coordination team will review your application and reach out via phone/WhatsApp with orientation details and departmental briefing schedules.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {submitState.status === "error" && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-brand-fireRed/10 border border-brand-fireRed/30 flex items-start gap-3 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-brand-fireRed flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Application could not be submitted</p>
                  <p className="leading-relaxed">{submitState.message}</p>
                </div>
              </div>
            )}

            {/* 1. Full Name */}
            <div>
              <label htmlFor="vol-fullname" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Full Name <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="vol-fullname"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Oluwaseun Adeleke"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all ${
                  errors.fullName ? "border-brand-fireRed ring-1 ring-brand-fireRed" : "border-white/10"
                }`}
              />
              {errors.fullName && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.fullName}</p>}
            </div>

            {/* 2. Phone Number */}
            <div>
              <label htmlFor="vol-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Phone Number (WhatsApp Preferred) <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="vol-phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="e.g. 08012345678 or +2348012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all ${
                  errors.phone ? "border-brand-fireRed ring-1 ring-brand-fireRed" : "border-white/10"
                }`}
              />
              {errors.phone && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.phone}</p>}
            </div>

            {/* 3. Email Address */}
            <div>
              <label htmlFor="vol-email" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Email Address <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="vol-email"
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. oluwaseun@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all ${
                  errors.email ? "border-brand-fireRed ring-1 ring-brand-fireRed" : "border-white/10"
                }`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.email}</p>}
            </div>

            {/* 4. Residential Address */}
            <div>
              <label htmlFor="vol-address" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Residential Address / Area <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="vol-address"
                type="text"
                required
                placeholder="e.g. Mayfair, Ile-Ife, Osun State"
                value={formData.residentialAddress}
                onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all ${
                  errors.residentialAddress ? "border-brand-fireRed ring-1 ring-brand-fireRed" : "border-white/10"
                }`}
              />
              {errors.residentialAddress && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.residentialAddress}</p>}
            </div>

            {/* 5. Department Selection */}
            <div>
              <label htmlFor="vol-department" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Preferred Service Department <span className="text-brand-flameOrange">*</span>
              </label>
              <select
                id="vol-department"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as VolunteerDepartment })}
                className={`w-full px-4 py-3 rounded-xl bg-[#16121D] border text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all ${
                  errors.department ? "border-brand-fireRed ring-1 ring-brand-fireRed" : "border-white/10"
                }`}
              >
                <option value="" disabled className="text-gray-500">
                  Select a department…
                </option>
                {VOLUNTEER_DEPARTMENTS.map((dept) => (
                  <option key={dept.name} value={dept.name} className="bg-[#16121D] text-white py-1">
                    {dept.name} — {dept.description}
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.department}</p>}
            </div>

            {/* 6. Availability */}
            <div>
              <fieldset>
                <legend className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Availability Schedule <span className="text-brand-flameOrange">*</span>
                </legend>
                <div className="space-y-2">
                  {[
                    "Full Day (Setup through Teardown — 6:00 AM to 10:00 PM)",
                    "Bootcamp Duration (7:30 AM to 8:30 PM)",
                    "Morning Shift (7:00 AM to 2:00 PM)",
                    "Afternoon / Evening Shift (1:30 PM to 8:30 PM)",
                  ].map((sched) => (
                    <label
                      key={sched}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                        formData.availability === sched
                          ? "bg-brand-goldYellow/15 border-brand-goldYellow text-white font-semibold"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        className="sr-only"
                        checked={formData.availability === sched}
                        onChange={() => setFormData({ ...formData, availability: sched })}
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.availability === sched ? "border-brand-goldYellow" : "border-gray-500"
                      }`}>
                        {formData.availability === sched && (
                          <div className="w-2 h-2 rounded-full bg-brand-goldYellow" />
                        )}
                      </div>
                      <span>{sched}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {errors.availability && <p className="mt-1.5 text-xs text-brand-fireRed">{errors.availability}</p>}
            </div>

            {/* 7. Prior Experience */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="vol-experience" className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Relevant Experience or Qualifications
                </label>
                <span className="text-[11px] text-gray-500 font-medium">Optional</span>
              </div>
              <textarea
                id="vol-experience"
                rows={3}
                placeholder="Share any relevant church department, technical, media, medical, or ushering experience you have."
                value={formData.experienceDescription}
                onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all resize-none"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitState.status === "submitting"}
                className="w-full py-4 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitState.status === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Application…</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4" />
                    <span>Submit Volunteer Application</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 mt-3">
                All volunteers must participate in mandatory prayer briefing and department orientation prior to the event.
              </p>
            </div>
          </form>
        )}

        {submitState.status === "success" && (
          <button
            type="button"
            onClick={handleEditAgain}
            className="mt-4 w-full py-3 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors"
          >
            Submit Another Application
          </button>
        )}
      </div>
    </div>
  );
}

