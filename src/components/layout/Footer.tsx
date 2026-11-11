"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ShieldCheck, HeartHandshake } from "lucide-react";
import { useBranding } from "@/lib/useBranding";

export interface FooterProps {
  logoUrl?: string;
  logoAlt?: string;
}

export function Footer({ logoUrl, logoAlt }: FooterProps = {}) {
  const branding = useBranding(logoUrl, logoAlt);
  const brandLogo = branding.logoUrl;
  const brandAlt = branding.logoAlt;

  return (
    <footer className="bg-brand-deepBlack text-gray-400 border-t border-white/10 pt-16 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="relative h-12 w-36 overflow-hidden">
              <Image
                src={brandLogo}
                alt={brandAlt}
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-gray-400 leading-relaxed text-xs">
              <strong className="text-white">INTIMACY 2026:</strong> 12 Hours Prayer Bootcamp (Hour of Incubation). A consecrated spiritual altar convened by King&apos;s Pavilion for prayer, worship, and divine encounter.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Official Social Handle:
              </span>
              <a
                href="https://instagram.com/Rccg_kings_Pavilion_Ife"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-goldYellow text-xs font-bold hover:bg-white/10 transition-colors"
              >
                <span>f / 📸</span>
                <span>@Rccg_kings_Pavilion_Ife</span>
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Attendee Registration (Free)
                </Link>
              </li>
              <li>
                <Link href="/volunteer" className="hover:text-white transition-colors">
                  Volunteer Application
                </Link>
              </li>
              <li>
                <Link href="/ministers" className="hover:text-white transition-colors">
                  Minister Profiles
                </Link>
              </li>
              <li>
                <Link href="/testimonies" className="hover:text-white transition-colors">
                  Published Testimonies
                </Link>
              </li>
              <li>
                <Link href="/#prayer-focus" className="hover:text-white transition-colors">
                  Themes of Intercession
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Confirmed Details
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-brand-flameOrange shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Saturday, 5 Dec 2026</span>
                  <span className="text-gray-400">8:00 AM WAT (12 Hours)</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-fireRed shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">IPMAN Event Hall</span>
                  <span className="text-gray-400 leading-normal">
                    Beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Free Admission</span>
                  <span className="text-gray-400">Pass required for entry verification</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Volunteer Teams */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Volunteer Departments
            </h4>
            <p className="text-gray-400 mb-3 text-[11px]">
              Join one of 8 approved ministry teams:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Media",
                "Prayer",
                "Ushering",
                "Sanitation",
                "Protocol",
                "Care",
                "Logistics",
                "Security",
              ].map((dept) => (
                <Link
                  key={dept}
                  href={`/volunteer?dept=${encodeURIComponent(dept)}`}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:text-white hover:border-brand-goldYellow transition-colors"
                >
                  {dept}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-[11px]">
          <p>
            &copy; {new Date().getFullYear()} King&apos;s Pavilion. All rights reserved. Intimacy: 12 Hours Prayer Bootcamp.
          </p>
          <div className="flex items-center gap-4">
            <span>Hour of Incubation</span>
            <span>&bull;</span>
            <span>Ile Ife, Osun State</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
