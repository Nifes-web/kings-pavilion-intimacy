import React from "react";
import Link from "next/link";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";

export function ClosingCtaBanner() {
  return (
    <div className="bg-gradient-to-r from-[#991B1B] via-[#C2410C] to-[#B45309] text-white py-14 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Saturday, 5 December 2026 &bull; IPMAN Event Hall, Ile Ife</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Join the Altar of Incubation. Free Registration Pass.
            </h2>
            <p className="text-sm sm:text-base text-amber-100 font-normal">
              Do not miss this 12-hour sacred encounter. Reserve your attendee place today.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black text-gray-900 bg-white hover:bg-gray-100 shadow-xl active:scale-98 transition-all"
            >
              <span>Register to Attend Now</span>
              <ArrowRight className="w-4 h-4 text-brand-fireRed" />
            </Link>
            <Link
              href="/volunteer"
              className="px-6 py-4 rounded-full text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Apply as Volunteer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

