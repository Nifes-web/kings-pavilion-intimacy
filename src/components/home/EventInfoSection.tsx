"use client";

import React, { useState } from "react";
import { EVENT_DETAILS, PLACEHOLDER_FAQS } from "@/data/eventData";
import { MapPin, Calendar, Clock, ChevronDown, HelpCircle, Shield, Sparkles } from "lucide-react";

export interface EventInfoSectionProps {
  data?: {
    title?: string;
    subtitle?: string;
    content?: Record<string, any>;
  } | null;
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
  }>;
}

export function EventInfoSection({ data, faqs: passedFaqs }: EventInfoSectionProps = {}) {
  const displayFaqs = passedFaqs && passedFaqs.length > 0 ? passedFaqs : PLACEHOLDER_FAQS;
  const [activeFaq, setActiveFaq] = useState<string | null>(
    displayFaqs[0]?.id || "faq-1"
  );

  const c = data?.content || {};
  const sectionTitle = data?.title || "Event Information & Venue";
  const sectionSubtitle = data?.subtitle || "Location & Logistics";
  const venueName = c.venueName || EVENT_DETAILS.venue.name;
  const venueAddress =
    c.address ||
    "IPMAN Event Hall, beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State, Nigeria.";
  const landmarkText = c.landmark || "Beside Harvard Hotel, Opposite NASFAT";
  const landmarks = landmarkText.split(",").map((s: string) => s.trim()).filter(Boolean);
  const landmark1 = landmarks[0] || "Beside Harvard Hotel";
  const landmark2 = landmarks[1] || "Opposite NASFAT";
  const eventDate = c.date || EVENT_DETAILS.dateFormatted;
  const eventTime = c.time || "8:00 AM – 8:00 PM WAT (Arrival by 7:30 AM recommended)";

  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <section id="event-info" className="py-24 bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-fireRed block">
            {sectionSubtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            {sectionTitle}
          </h2>
          <p className="text-base text-gray-600 font-normal">
            {c.admissionNote || `Confirmed logistics, venue landmarks, and essential attendee information for ${eventDate}.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Venue Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-8 space-y-6 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-fireRed block">
                  Official Venue
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  {venueName}
                </h3>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-200">
                  <MapPin className="w-5 h-5 text-brand-fireRed shrink-0 mt-0.5 fill-brand-fireRed" />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs uppercase tracking-wide">
                      Full Venue Address
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                      {venueAddress}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block mb-0.5">Landmark 1</span>
                    <span className="font-bold text-gray-900">{landmark1}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-400 block mb-0.5">Landmark 2</span>
                    <span className="font-bold text-gray-900">{landmark2}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-flameOrange shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">Date</span>
                    <span className="text-xs font-semibold text-brand-fireRed">{eventDate}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-goldYellow shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">Time &amp; Schedule</span>
                    <span className="text-xs text-gray-700">{eventTime}</span>
                  </div>
                </div>
              </div>

              {/* Verified Official Social Handle */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Official Church Social Handle:
                </span>
                <a
                  href="https://instagram.com/Rccg_kings_Pavilion_Ife"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-900 hover:border-brand-fireRed transition-colors"
                >
                  <span className="text-brand-flameOrange font-extrabold">f / 📸</span>
                  <span>@Rccg_kings_Pavilion_Ife</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion (Reference Style) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-fireRed" />
                <span>Frequently Asked Questions</span>
              </h3>
              <span className="text-xs font-medium text-gray-500">
                General &bull; Venue &bull; Registration
              </span>
            </div>

            <div className="space-y-3">
              {displayFaqs.map((faq) => {
                const isOpen = activeFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-fireRed"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-bold text-gray-900">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-brand-fireRed" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 border-t border-gray-100 pt-3 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
