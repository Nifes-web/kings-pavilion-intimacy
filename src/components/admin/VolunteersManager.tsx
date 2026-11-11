"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  HeartHandshake,
  Search,
  Download,
  Loader2,
  Mail,
  Phone,
  Eye,
  Calendar,
  Briefcase,
} from "lucide-react";

export function VolunteersManager() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);

  const fetchVolunteers = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const q = searchQuery !== undefined ? searchQuery : search;
      if (q) params.set("search", q);
      if (department !== "all") params.set("department", department);

      const res = await fetch(`/api/admin/volunteers?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.volunteers) {
        setVolunteers(data.volunteers);
      }
    } catch {
      // Graceful error
    } finally {
      setLoading(false);
    }
  }, [search, department]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVolunteers();
  };

  const exportCsv = () => {
    if (volunteers.length === 0) return;
    const headers = [
      "Reference",
      "Full Name",
      "Email",
      "Phone",
      "Department",
      "Availability",
      "Address",
      "Status",
      "Applied At",
    ];
    const rows = volunteers.map((v) => [
      `"${v.reference || ""}"`,
      `"${v.full_name || ""}"`,
      `"${v.email || ""}"`,
      `"${v.phone || ""}"`,
      `"${v.department || ""}"`,
      `"${(v.availability || "").replace(/"/g, '""')}"`,
      `"${(v.residential_address || "").replace(/"/g, '""')}"`,
      v.application_status || "pending",
      v.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `kings-pavilion-volunteers-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search volunteers by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-[#15111D] border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-goldYellow"
          >
            <option value="all">All Departments</option>
            <option value="Media">Media</option>
            <option value="Prayer">Prayer</option>
            <option value="Ushering">Ushering</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Protocol">Protocol</option>
            <option value="Care">Care</option>
            <option value="Logistics">Logistics</option>
            <option value="Security">Security</option>
          </select>

          <button
            onClick={exportCsv}
            disabled={volunteers.length === 0}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Volunteers Table */}
      <div className="rounded-3xl bg-[#15111D] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Applicant / Reference</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Assigned Department</th>
                <th className="px-6 py-4">Availability</th>
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
              ) : volunteers.length > 0 ? (
                volunteers.map((item) => (
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
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-goldYellow/10 text-brand-goldYellow border border-brand-goldYellow/30">
                        {item.department}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {item.availability || "Full Day"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedVolunteer(item)}
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
                    No volunteer applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16121D] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {selectedVolunteer.full_name}
                </h3>
                <span className="text-xs font-mono text-brand-goldYellow">
                  Reference: {selectedVolunteer.reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedVolunteer(null)}
                className="text-gray-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Assigned Department
                  </span>
                  <span className="text-brand-goldYellow font-bold">
                    {selectedVolunteer.department}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Application Status
                  </span>
                  <span className="text-white capitalize font-medium">
                    {selectedVolunteer.application_status || "Pending Review"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Email
                  </span>
                  <span className="text-white font-medium break-all">
                    {selectedVolunteer.email}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Phone
                  </span>
                  <span className="text-white font-medium">
                    {selectedVolunteer.phone}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Availability Schedule
                </span>
                <span className="text-gray-300">
                  {selectedVolunteer.availability}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Relevant Experience / Background Notes
                </span>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedVolunteer.experience || "No background details provided."}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-gray-400">
                Applied: {new Date(selectedVolunteer.created_at).toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => setSelectedVolunteer(null)}
              className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
