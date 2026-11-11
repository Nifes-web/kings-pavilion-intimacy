"use client";

import React, { useState } from "react";
import { AdminUser } from "./adminTypes";
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";

interface AccountsManagerProps {
  operators: AdminUser[];
  loading: boolean;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AccountsManager({
  operators,
  loading,
  onRefresh,
  onSuccess,
  onError,
}: AccountsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to provision operator account.");
        setModalLoading(false);
        return;
      }

      onSuccess(`Check-in account provisioned for ${newName} (${newEmail})!`);
      setShowModal(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      onRefresh();
    } catch {
      setModalError("Network error while provisioning account.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (operatorId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: operatorId, isActive: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "Failed to update account status.");
        return;
      }

      onSuccess(`Account status updated to ${!currentStatus ? "Active" : "Deactivated"}!`);
      onRefresh();
    } catch {
      onError("Network error updating account status.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white">
            Administration &amp; Operator Accounts
          </h2>
          <p className="text-xs text-gray-400">
            Manage individual check-in officer email accounts, permissions, and security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#15111D] border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-950 bg-brand-goldYellow hover:brightness-110 transition-all flex items-center gap-1.5 shadow-gold-glow"
          >
            <Plus className="w-4 h-4 text-gray-950" />
            <span>Provision Check-In Operator</span>
          </button>
        </div>
      </div>

      {/* Accounts Table Card */}
      <div className="rounded-3xl bg-[#15111D] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Account / Officer</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {operators.map((op) => {
                const isMainAdmin = op.role === "main_admin";
                return (
                  <tr key={op.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-white">
                        {op.full_name || "—"}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">{op.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isMainAdmin
                            ? "bg-brand-goldYellow/20 text-brand-goldYellow border-brand-goldYellow/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {isMainAdmin ? "Main Admin" : "Check-in Operator"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          op.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            op.is_active ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        <span>{op.is_active ? "Active" : "Deactivated"}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-400">
                      {op.last_sign_in_at
                        ? new Date(op.last_sign_in_at).toLocaleString()
                        : "Never signed in"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {!isMainAdmin && (
                        <button
                          onClick={() => handleToggleStatus(op.id, op.is_active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            op.is_active
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30"
                              : "bg-green-500/10 hover:bg-green-500/20 text-green-300 border-green-500/30"
                          }`}
                        >
                          {op.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {operators.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No accounts found. Click &quot;Provision Check-In Operator&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#16121D] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-extrabold text-base text-white">
                Provision Check-In Operator
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateOperator} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Officer Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sister Deborah Ade"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Authorized Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. deborah.checkin@churchdomain.org"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 text-[11px] text-gray-400 leading-relaxed">
                Check-in accounts are strictly scoped to the <code>/checkin</code> terminal. They cannot view confidential attendee responses, volunteer data, or administration settings.
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-gray-950 bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow shadow-gold-glow hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {modalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

