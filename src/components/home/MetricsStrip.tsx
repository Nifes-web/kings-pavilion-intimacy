import React from "react";
import { Clock, Users, ShieldCheck, Calendar } from "lucide-react";

export function MetricsStrip() {
  const stats = [
    {
      icon: Clock,
      value: "12",
      suffix: "Hours",
      label: "Continuous Intercession",
      description: "8:00 AM – 8:00 PM WAT uninterrupted prayer watches",
    },
    {
      icon: Users,
      value: "8",
      suffix: "Teams",
      label: "Volunteer Departments",
      description: "Media, Prayer, Ushering, Sanitation, Protocol, Care & more",
    },
    {
      icon: ShieldCheck,
      value: "100%",
      suffix: "Free",
      label: "Admission Required",
      description: "Open admission with secure registration pass",
    },
    {
      icon: Calendar,
      value: "5th Dec",
      suffix: "2026",
      label: "Bootcamp Gathering",
      description: "IPMAN Event Hall, Ibadan Road, Ile Ife, Osun State",
    },
  ];

  return (
    <div className="bg-white border-y border-gray-200 py-10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col text-left group">
                <div className="flex items-center gap-2 mb-2 text-brand-flameOrange">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-brand-fireRed">
                    {stat.suffix}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
