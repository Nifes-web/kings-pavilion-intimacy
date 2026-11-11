import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Shield, Sparkles, ArrowRight, Check } from "lucide-react";

export interface FeatureShowcaseSectionProps {
  mediaAssignment?: {
    url: string;
    alt?: string;
    fit?: "cover" | "contain" | "fill";
    position?: "center" | "top" | "bottom" | "left" | "right";
  };
}

export function FeatureShowcaseSection({ mediaAssignment }: FeatureShowcaseSectionProps = {}) {
  const shofarUrl = mediaAssignment?.url || "/assets/flyer-shofar-blower.jpg";
  const shofarAlt = mediaAssignment?.alt || "Worshipper sounding the shofar from official flyer";
  const shofarFit = (mediaAssignment?.fit as any) || "cover";
  const shofarPosition = mediaAssignment?.position || "center";
  return (
    <section className="py-20 bg-brand-obsidian text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A0E13] via-[#120D18] to-[#0A0910] border border-white/10 p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-fireRed/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-goldYellow uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-flameOrange" />
                <span>Consecration &bull; Warfare &bull; Encounter</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                An Unbroken Altar of Prayer &amp; Travail
              </h2>

              <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
                At <strong>IPMAN Event Hall</strong>, believers from diverse backgrounds will unite under one mantle. Bring your spiritual hunger, family needs, and personal expectations before the Lord in 12 consecutive hours of corporate prayer.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-brand-flameOrange/20 text-brand-flameOrange flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Continuous 8AM to 8PM Intercession</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-brand-flameOrange/20 text-brand-flameOrange flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Confidential Prayer Point Submission</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-brand-flameOrange/20 text-brand-flameOrange flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Prophetic Worship & Altar Ministry</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-brand-flameOrange/20 text-brand-flameOrange flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Free Registration with Check-in Pass</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 active:scale-98 transition-all"
                >
                  <span>Reserve Your Free Entry Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/#event-info"
                  className="px-6 py-3.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white border border-white/15 hover:bg-white/5 transition-all"
                >
                  View Venue Directions
                </Link>
              </div>
            </div>

            {/* Right Column: Preserved Artwork of Shofar Blower */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <Image
                  src={shofarUrl}
                  alt={shofarAlt}
                  fill
                  style={{ objectFit: shofarFit, objectPosition: shofarPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-brand-goldYellow block">The Sound of Awakening</span>
                    <span className="text-gray-400 text-[11px]">Official Flyer Artwork</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-brand-flameOrange bg-brand-flameOrange/15 px-2 py-0.5 rounded">
                    Consecration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

