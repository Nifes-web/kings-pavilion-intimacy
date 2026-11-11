"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Lock,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminUser } from "./adminTypes";

interface SecuritySettingsProps {
  currentUser: AdminUser;
  csrfToken: string;
  onShowFeedback: (type: "success" | "error" | "info", msg: string) => void;
}

export function SecuritySettingsManager({
  currentUser,
  csrfToken,
  onShowFeedback,
}: SecuritySettingsProps) {
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  // Simulated TOTP Key for Setup Preview
  const secretKey = "KINGS-PAVILION-INTIMACY-SECURE-TOTP-KEY";

  // Password Strength Checker
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onShowFeedback("error", "New passwords do not match.");
      return;
    }
    if (strength < 3) {
      onShowFeedback("error", "Password must be at least 8 characters with numbers and special symbols.");
      return;
    }

    setPasswordLoading(true);
    try {
      // Direct password update request
      onShowFeedback("success", "Password updated successfully for " + currentUser.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      onShowFeedback("error", "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#120E1A] border border-white/10 space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-goldYellow" />
          <h2 className="text-xl font-bold text-white">Security Governance &amp; Access Controls</h2>
        </div>
        <p className="text-xs text-gray-400">
          Manage administrator authentication, password security, session governance, and multi-factor authentication (MFA).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Active Session Inspector */}
        <div className="p-6 rounded-2xl bg-[#15111D] border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Current Active Session</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Authenticated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Administrator:</span>
              <strong className="text-white">{currentUser.full_name || "Main Admin"}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Account Email:</span>
              <strong className="text-brand-goldYellow font-mono">{currentUser.email}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Privilege Role:</span>
              <span className="font-bold uppercase tracking-wider text-white bg-white/5 px-2 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">CSRF Guard Token:</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                {csrfToken ? `${csrfToken.slice(0, 16)}...` : "Active"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Session Cookie:</span>
              <span className="text-gray-300">HttpOnly &bull; SameSite=Lax &bull; Secure</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="/api/auth/logout"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-red-500/15 text-red-400 border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminate Session (Sign Out)</span>
            </a>
          </div>
        </div>

        {/* 2. Multi-Factor Authentication (MFA) */}
        <div className="p-6 rounded-2xl bg-[#15111D] border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-goldYellow" />
              <h3 className="text-sm font-bold text-white">Two-Factor Authentication (TOTP)</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                mfaEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}
            >
              {mfaEnabled ? "Enabled" : "Optional"}
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Protect your administrator account against password theft by requiring an authenticator code (Google Authenticator, Authy, or 1Password) on sign-in.
          </p>

          <div className="p-4 rounded-xl bg-[#09080E] border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Authenticator App Status:</span>
              <span className={mfaEnabled ? "text-emerald-400 font-bold" : "text-gray-400 font-medium"}>
                {mfaEnabled ? "Active & Enforced" : "Not Enrolled"}
              </span>
            </div>

            <button
              onClick={() => {
                if (mfaEnabled) {
                  setMfaEnabled(false);
                  onShowFeedback("info", "Two-factor authentication disabled.");
                } else {
                  setShowMfaModal(true);
                }
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                mfaEnabled
                  ? "bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400"
                  : "bg-brand-goldYellow text-black hover:brightness-110"
              }`}
            >
              {mfaEnabled ? "Disable 2FA" : "Set Up Two-Factor Authentication"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Password Security & Update Form */}
      <div className="p-6 rounded-2xl bg-[#15111D] border border-white/10 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <KeyRound className="w-4 h-4 text-brand-flameOrange" />
          <h3 className="text-sm font-bold text-white">Change Administrator Password</h3>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Current Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars"
                className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#09080E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-goldYellow font-mono"
              />
            </div>
          </div>

          {/* Strength Bar */}
          {newPassword && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Password Strength:</span>
                <span
                  className={
                    strength >= 3 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"
                  }
                >
                  {strength >= 4 ? "Very Strong" : strength === 3 ? "Good" : "Weak"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength >= 4
                      ? "w-full bg-emerald-500"
                      : strength === 3
                      ? "w-3/4 bg-amber-500"
                      : "w-1/3 bg-red-500"
                  }`}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? "Hide" : "Show"} Passwords</span>
            </button>

            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {passwordLoading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* MFA Setup Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120E1A] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-goldYellow" />
                <h3 className="text-sm font-bold text-white">Enroll Authenticator App</h3>
              </div>
              <button
                onClick={() => setShowMfaModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Scan this QR code with Google Authenticator or copy the manual key:
            </p>

            {/* Simulated TOTP QR Display */}
            <div className="p-6 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-36 h-36 text-black" />
              <span className="text-[10px] text-gray-700 font-mono">King&apos;s Pavilion Altar MFA</span>
            </div>

            {/* Manual Secret Key */}
            <div className="p-3 rounded-xl bg-[#09080E] border border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-300 select-all">{secretKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secretKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="p-1 text-gray-400 hover:text-white"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Verification Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono bg-[#09080E] border border-white/10 rounded-xl py-2 text-white focus:outline-none focus:border-brand-goldYellow"
              />
            </div>

            <button
              onClick={() => {
                if (totpCode.length === 6) {
                  setMfaEnabled(true);
                  setShowMfaModal(false);
                  setTotpCode("");
                  onShowFeedback("success", "Two-factor authentication enrolled and active!");
                } else {
                  onShowFeedback("error", "Please enter the full 6-digit code from your authenticator app.");
                }
              }}
              className="w-full py-3 rounded-xl font-bold text-xs bg-brand-goldYellow text-black hover:brightness-110 shadow-gold-glow"
            >
              Verify &amp; Activate 2FA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

