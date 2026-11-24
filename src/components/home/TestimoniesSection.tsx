"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLACEHOLDER_TESTIMONIES } from "@/data/eventData";
import { Quote, ArrowRight, ChevronLeft, ChevronRight, User } from "lucide-react";

export interface TestimoniesSectionProps {
  testimonies?: Array<{
    id: string;
    slug?: string;
    testifier_name?: string;
    testifierName?: string;
    content?: string;
    fullTestimony?: string;
    excerpt?: string;
  }>;
}

export function TestimoniesSection({ testimonies }: TestimoniesSectionProps = {}) {
  const items =
    testimonies && testimonies.length > 0 ? testimonies : PLACEHOLDER_TESTIMONIES;
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const current = items[currentIndex] || items[0];
  const currentText =
    (current as any).content || (current as any).fullTestimony || (current as any).excerpt || "";
  const currentAuthor =
    (current as any).testifier_name || (current as any).testifierName || "Attendee";

  return (
    <section id="testimonies" className="py-24 bg-[#09080E] text-white overflow-hidden relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-goldYellow block">
            The Power of Corporate Intercession
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Verified Testimonies
          </h2>
          <p className="text-sm sm:text-base text-gray-400 font-normal">
            Experiences of God&apos;s grace and answered prayer documented through the altar of intercession.
          </p>
        </div>

        {/* Spotlight Testimonial Card (Reference Style) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1C1318] to-[#120E16] border border-white/10 p-8 sm:p-12 shadow-2xl relative">
          <Quote className="w-12 h-12 text-brand-flameOrange/25 mb-6" />

          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium text-white leading-relaxed mb-8">
            &ldquo;{currentText}&rdquo;
          </blockquote>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-brand-goldYellow font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-bold text-white block">
                  {currentAuthor}
                </span>
                <span className="text-xs text-brand-goldYellow font-medium">
                  Documented Testimonial Record &bull; Verification Policy Active
                </span>
              </div>
            </div>

            {/* Slider Controls (Reference Style) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                aria-label="Previous testimony"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                aria-label="Next testimony"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Link */}
        <div className="mt-8 text-center">
          <Link
            href="/testimonies"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-goldYellow hover:underline"
          >
            <span>Explore all published testimony records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
