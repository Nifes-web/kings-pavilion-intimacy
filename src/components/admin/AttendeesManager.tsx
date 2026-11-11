"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export function AttendeesManager() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "first_time" | "returning">("all");
  const [selectedAttendee, setSelectedAttendee] = useState<any | null>(null);

  const fetchAttendees = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const q = searchQuery !== undefined ? searchQuery : search;
      if (q) params.set("search", q);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/admin/attendees?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.attendees) {
        setAttendees(data.attendees);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttendees();
  };

  const exportCsv = () => {
    if (attendees.length === 0) return;
    const headers = [
      "Reference",
      "Full Name",
      "Email",
      "Phone",
      "Address",
      "First Time",
      "Checked In At",
      "Registered At",
    ];
    const rows = attendees.map((a) => [
      `"${a.reference || ""}"`,
      `"${a.full_name || ""}"`,
      `"${a.email || ""}"`,
      `"${a.phone || ""}"`,
      `"${(a.residential_address || "").replace(/"/g, '""')}"`,
      a.first_time ? "Yes" : "No",
      a.checked_in_at || "Not checked in",
      a.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kings-pavilion-attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or reference..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#15111D] p-1 rounded-2xl border border-white/10 text-xs">
            {[
              { id: "all", label: "All Attendees" },
              { id: "first_time", label: "First-timers" },
              { id: "returning", label: "Returning" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  filter === f.id
                    ? "bg-brand-goldYellow text-gray-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportCsv}
            disabled={attendees.length === 0}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="rounded-3xl bg-[#15111D] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Attendee / Reference</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Check-in Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-goldYellow" />
                  </td>
                </tr>
              ) : attendees.length > 0 ? (
                attendees.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">
                        {item.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-brand-goldYellow">
                        {item.reference}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{item.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.first_time
                            ? "bg-brand-flameOrange/10 text-brand-flameOrange border-brand-flameOrange/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {item.first_time ? "First Time" : "Returning"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.checked_in_at ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Checked In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/30">
                          <Clock className="w-3 h-3" />
                          <span>Not Checked In</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedAttendee(item)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No attendee records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendee Details Modal */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16121D] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {selectedAttendee.full_name}
                </h3>
                <span className="text-xs font-mono text-brand-goldYellow">
                  Reference: {selectedAttendee.reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedAttendee(null)}
                className="text-gray-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Email
                  </span>
                  <span className="text-white font-medium break-all">
                    {selectedAttendee.email}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Phone
                  </span>
                  <span className="text-white font-medium">
                    {selectedAttendee.phone}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Residential Address
                </span>
                <span className="text-gray-300">
                  {selectedAttendee.residential_address || "Not provided"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Prayer Request / Focus
                </span>
                <p className="text-gray-300 leading-relaxed italic">
                  {selectedAttendee.prayer_point || "No prayer point submitted."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Expectations for the Altar
                </span>
                <p className="text-gray-300 leading-relaxed">
                  {selectedAttendee.expectation || "No expectation notes provided."}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-gray-400 flex justify-between">
                <span>Registered: {new Date(selectedAttendee.created_at).toLocaleString()}</span>
                <span>
                  Status: {selectedAttendee.checked_in_at ? "Checked in" : "Awaiting check-in"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedAttendee(null)}
              className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-all"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
