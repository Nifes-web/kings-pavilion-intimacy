"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Clock,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Recovery modal/mode state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Rate-limit cooldown timer to prevent spamming submissions
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (searchParams?.get("reset") === "success") {
      setResetSuccess(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Check if temporary recovery password was used requiring immediate update
      if (data.requiresPasswordChange) {
        router.push("/admin/security?prompt=change-password");
        return;
      }

      // Login successful, redirect based on assigned role
      if (data.user?.role === "checkin_operator") {
        router.push("/admin?tab=checkin");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setRecoveryError(null);
    setRecoverySuccess(false);
    setRecoveryLoading(true);

    const targetEmail = recoveryEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setRecoveryError("Please enter a valid administrator email address.");
      setRecoveryLoading(false);
      return;
    }

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "http://localhost:3000/reset-password";

      const { error: resetErr } = await supabaseBrowser.auth.resetPasswordForEmail(
        targetEmail,
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetErr) {
        const msg = resetErr.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("too many requests")) {
          setRecoveryError("Too many password reset requests. Please wait a few minutes before trying again.");
        } else {
          setRecoveryError(resetErr.message);
        }
        setRecoveryLoading(false);
        return;
      }

      // Success: show confirmation and trigger a 60-second cooldown
      setRecoverySuccess(true);
      setCooldownSeconds(60);
      setRecoveryLoading(false);
    } catch (err: any) {
      setRecoveryError(err.message || "Failed to dispatch recovery email. Please try again.");
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#16121D] to-[#0E0C14] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Forgot Password View */}
      {showForgotModal ? (
        <div className="space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setRecoveryError(null);
                setRecoverySuccess(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-goldYellow transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-goldYellow bg-brand-goldYellow/10 border border-brand-goldYellow/30 px-2.5 py-0.5 rounded-full">
              Password Recovery
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Reset Administrative Password</h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Enter your authorized email. We will send a secure password reset link to your inbox.
            </p>
          </div>

          {recoverySuccess ? (
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-100">Recovery Email Dispatched</p>
                  <p className="text-gray-300 leading-relaxed">
                    If an administrator account is associated with <strong className="text-white">{recoveryEmail}</strong>, a recovery link has been sent. Please check your inbox and click the link to set a new password.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setRecoverySuccess(false);
                  setRecoveryEmail("");
                }}
                className="w-full py-3 rounded-full text-xs font-bold text-gray-900 bg-brand-goldYellow hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              {recoveryError && (
                <div className="p-3.5 rounded-xl bg-brand-fireRed/10 border border-brand-fireRed/30 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-brand-fireRed flex-shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="admin@kingspavilion.org"
                    disabled={recoveryLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={recoveryLoading || cooldownSeconds > 0}
                  className="w-full py-3 rounded-full text-xs font-bold text-gray-900 bg-brand-goldYellow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-gold-glow"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-900" />
                      <span>Dispatching Link…</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-gray-900" />
                      <span>Resend in {cooldownSeconds}s</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-gray-900" />
                      <span>Send Recovery Instructions</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Regular Login Form View */
        <>
          {resetSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Your password has been successfully reset. You may now sign in with your new credentials.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-brand-fireRed/10 border border-brand-fireRed/30 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-brand-fireRed flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kingspavilion.org"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-brand-goldYellow hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-sm font-extrabold text-gray-900 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-gray-900" />
                    <span>Authorize &amp; Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-white/5 space-y-2 text-center">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Public registration is disabled. Accounts are provisioned solely by the Main Administrator.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

