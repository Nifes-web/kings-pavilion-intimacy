"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Shield, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 1. Establish and verify recovery session on mount
  useEffect(() => {
    let isMounted = true;

    async function initRecoverySession() {
      try {
        if (typeof window === "undefined") return;

        const hash = window.location.hash;
        const search = window.location.search;

        // Check for PKCE exchange code if provided in query string
        if (search.includes("code=")) {
          const params = new URLSearchParams(search);
          const code = params.get("code");
          if (code) {
            const { error: exchangeError } = await supabaseBrowser.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              if (isMounted) {
                setSessionError("This password recovery link has expired or has already been used. Please request a fresh reset link.");
                setIsVerifyingSession(false);
              }
              return;
            }
          }
        }

        // Check if an active session already exists in memory or local storage
        const { data: sessionData, error: sessionError } = await supabaseBrowser.auth.getSession();

        if (sessionError) {
          if (isMounted) {
            setSessionError("Unable to verify recovery credentials. Please request a fresh reset link.");
            setIsVerifyingSession(false);
          }
          return;
        }

        if (sessionData.session) {
          if (isMounted) {
            setIsSessionValid(true);
            setIsVerifyingSession(false);
          }
          return;
        }

        // Check hash fragments if implicit flow was used
        if (hash && (hash.includes("access_token=") || hash.includes("type=recovery"))) {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setSessionErr } = await supabaseBrowser.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionErr) {
              if (isMounted) {
                setSessionError("The password reset session could not be established. Please request a new link.");
                setIsVerifyingSession(false);
              }
              return;
            }

            if (isMounted) {
              setIsSessionValid(true);
              setIsVerifyingSession(false);
            }
            return;
          }
        }

        // If no code, no token, and no active session
        if (isMounted) {
          setSessionError("No valid password recovery session detected. If you clicked an email link, it may have expired.");
          setIsVerifyingSession(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setSessionError(err?.message || "An unexpected error occurred while verifying your recovery link.");
          setIsVerifyingSession(false);
        }
      }
    }

    initRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Submit new password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        password: password,
      });

      if (error) {
        setSubmitError(error.message || "Failed to update password. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setSubmitting(false);

      // Sign out recovery session to require clean login with new credentials
      try {
        await supabaseBrowser.auth.signOut();
      } catch {
        // Non-blocking
      }

      // Automatically redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch {
      setSubmitError("A network error occurred. Please check your internet connection.");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#16121D] to-[#0E0C14] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Loading verification state */}
      {isVerifyingSession && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-goldYellow" />
          <p className="text-sm font-semibold text-gray-300">
            Verifying recovery credentials…
          </p>
          <p className="text-xs text-gray-400 max-w-xs">
            Establishing a secure session with Supabase Auth.
          </p>
        </div>
      )}

      {/* Invalid / Expired Session State */}
      {!isVerifyingSession && (!isSessionValid || sessionError) && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-brand-fireRed/10 border border-brand-fireRed/30 flex items-start gap-3 text-xs text-red-200">
            <AlertCircle className="w-5 h-5 text-brand-fireRed flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-100">Recovery Link Invalid or Expired</p>
              <p className="leading-relaxed text-gray-300">
                {sessionError || "The password recovery link you clicked is invalid, has expired, or has already been used."}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-full text-xs font-bold text-gray-900 bg-brand-goldYellow hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      )}

      {/* Valid Session: Password Reset Form */}
      {!isVerifyingSession && isSessionValid && (
        <>
          {submitSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-emerald-glow">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Password Updated!</h2>
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  Your administrator password has been safely updated. Redirecting you to sign in…
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/login?reset=success")}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-gray-900 bg-brand-goldYellow hover:brightness-110 transition-all inline-flex items-center gap-1.5"
                >
                  <span>Go to Login Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-brand-fireRed/10 border border-brand-fireRed/30 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-brand-fireRed flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
                >
                  New Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={submitting}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Must be at least 8 characters with at least one letter and one number.
                </p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={submitting}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-sm font-extrabold text-gray-900 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-gray-900" />
                      <span>Confirm &amp; Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <div className="pt-2 border-t border-white/5 text-center">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          King&apos;s Pavilion Intimacy Platform — Authenticated Session Protected.
        </p>
      </div>
    </div>
  );
}

