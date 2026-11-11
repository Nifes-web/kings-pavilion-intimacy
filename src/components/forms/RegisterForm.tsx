"use client";

import React, { useState, useRef, useEffect } from "react";
import { normaliseEmail, normalisePhoneNumber } from "@/lib/utils";
import { AttendeeFormData } from "@/lib/types";
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  QrCode,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string; qrCodeDataUrl?: string | null }
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

export function RegisterForm() {
  const [formData, setFormData] = useState<AttendeeFormData>({
    fullName: "",
    residentialAddress: "",
    phone: "",
    email: "",
    firstTimeAttendee: null,
    prayerPoints: "",
    expectations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const csrfTokenRef = useRef<string | null>(null);

  // Pre-fetch a CSRF token when the page loads so the first submission is instant.
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

    if (!formData.residentialAddress.trim()) {
      errs.residentialAddress = "Residential address is required.";
    }

    const cleanedPhone = formData.phone.replace(/[\s\-()]/g, "");
    if (!cleanedPhone) {
      errs.phone = "Phone number is required.";
    } else if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
      errs.phone = "Enter a valid phone number (e.g. 08012345678 or +2348012345678).";
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = "Enter a valid email address.";
      }
    }

    if (formData.firstTimeAttendee === null) {
      errs.firstTimeAttendee = "Please select whether this is your first time attending.";
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

      const res = await fetch("/api/attendees", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfTokenRef.current,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          residentialAddress: formData.residentialAddress,
          phone: formData.phone,
          email: formData.email,
          firstTimeAttendee: formData.firstTimeAttendee,
          prayerPoints: formData.prayerPoints,
          expectations: formData.expectations,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error?.toLowerCase().includes("csrf")) {
        csrfTokenRef.current = await fetchCsrfToken();
        const retryRes = await fetch("/api/attendees", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfTokenRef.current,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            residentialAddress: formData.residentialAddress,
            phone: formData.phone,
            email: formData.email,
            firstTimeAttendee: formData.firstTimeAttendee,
            prayerPoints: formData.prayerPoints,
            expectations: formData.expectations,
          }),
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.error || "Submission failed. Please try again.");
        }
        setSubmitState({
          status: "success",
          reference: retryData.reference || retryData.attendee?.id || "REGISTERED",
          qrCodeDataUrl: retryData.qrCodeDataUrl ?? null,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setSubmitState({
        status: "success",
        reference: data.reference || data.attendee?.id || "REGISTERED",
        qrCodeDataUrl: data.qrCodeDataUrl ?? null,
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
          <Flame className="w-3.5 h-3.5 text-brand-flameOrange" />
          <span>Free Individual Registration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Register for{" "}
          <span className="bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-white bg-clip-text text-transparent">
            INTIMACY 2026
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Saturday, 5 December 2026 &bull; 8:00 AM WAT &bull; IPMAN Event Hall, Ile Ife.
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
                <h3 className="font-bold text-white text-base">Registration Confirmed</h3>
                <p className="text-xs text-gray-400">
                  A place has been reserved for you at INTIMACY 2026.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Registration Code
                </span>
                <span className="font-mono font-bold text-brand-goldYellow text-sm">
                  {submitState.reference}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Attendee Name
                </span>
                <span className="text-white font-medium">{formData.fullName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-gray-400 uppercase tracking-wider font-semibold">
                  Phone
                </span>
                <span className="text-white font-medium">{formData.phone}</span>
              </div>
              {formData.email && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <span className="text-gray-400 uppercase tracking-wider font-semibold">
                    Email
                  </span>
                  <span className="text-white font-medium">{formData.email}</span>
                </div>
              )}
            </div>

            {submitState.qrCodeDataUrl ? (
              <div className="flex flex-col items-center justify-center p-6 bg-black/60 border border-brand-goldYellow/30 rounded-2xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-goldYellow inline-flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Personal Check-in Pass
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Screenshot or download this QR pass to scan at the entrance on Saturday, 5 December 2026.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submitState.qrCodeDataUrl}
                    alt={`QR Code Pass for ${formData.fullName}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                </div>
                <a
                  href={submitState.qrCodeDataUrl}
                  download={`intimacy-2026-pass-${submitState.reference}.png`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR Pass Image</span>
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Please screenshot or save your reference code <strong className="text-white">{submitState.reference}</strong>. Present it at the check-in desk upon arrival.
              </div>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              We look forward to seeking the Lord together with you. Please arrive early at IPMAN Event Hall, Ile Ife to complete your check-in.
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
                  <p className="font-bold">Registration could not be completed</p>
                  <p className="leading-relaxed">{submitState.message}</p>
                </div>
              </div>
            )}

            {/* 1. Full Name */}
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Full Name <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="reg-fullname"
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
              <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Phone Number <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="reg-phone"
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Email Address
                </label>
                <span className="text-[11px] text-gray-500 font-medium">Optional</span>
              </div>
              <input
                id="reg-email"
                type="email"
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
              <label htmlFor="reg-address" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Residential Address / Area <span className="text-brand-flameOrange">*</span>
              </label>
              <input
                id="reg-address"
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

            {/* 5. First-Time Attendee Radio */}
            <div>
              <fieldset>
                <legend className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Is this your first time attending INTIMACY? <span className="text-brand-flameOrange">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                      formData.firstTimeAttendee === true
                        ? "bg-brand-goldYellow/15 border-brand-goldYellow text-brand-goldYellow"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="firstTime"
                      className="sr-only"
                      checked={formData.firstTimeAttendee === true}
                      onChange={() => setFormData({ ...formData, firstTimeAttendee: true })}
                    />
                    <span>Yes, First Time</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                      formData.firstTimeAttendee === false
                        ? "bg-brand-goldYellow/15 border-brand-goldYellow text-brand-goldYellow"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="firstTime"
                      className="sr-only"
                      checked={formData.firstTimeAttendee === false}
                      onChange={() => setFormData({ ...formData, firstTimeAttendee: false })}
                    />
                    <span>Returning Attendee</span>
                  </label>
                </div>
              </fieldset>
              {errors.firstTimeAttendee && (
                <p className="mt-1.5 text-xs text-brand-fireRed">{errors.firstTimeAttendee}</p>
              )}
            </div>

            {/* 6. Prayer Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="reg-prayer" className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Specific Prayer Points
                </label>
                <span className="text-[11px] text-gray-500 font-medium">Optional</span>
              </div>
              <textarea
                id="reg-prayer"
                rows={3}
                placeholder="What burden or petition are you bringing before God's altar at this bootcamp?"
                value={formData.prayerPoints}
                onChange={(e) => setFormData({ ...formData, prayerPoints: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all resize-none"
              />
            </div>

            {/* 7. Expectations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="reg-expectations" className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Expectations for the Bootcamp
                </label>
                <span className="text-[11px] text-gray-500 font-medium">Optional</span>
              </div>
              <textarea
                id="reg-expectations"
                rows={3}
                placeholder="What are you believing God to encounter, experience, or receive during these 12 hours?"
                value={formData.expectations}
                onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
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
                    <span>Reserving Your Seat…</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 mt-3">
                Admission is completely free. Early registration helps our protocol and prayer teams prepare adequately.
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
            Register Another Attendee
          </button>
        )}
      </div>
    </div>
  );
}

