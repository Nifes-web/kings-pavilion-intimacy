import React from "react";
import { PLACEHOLDER_PRAYER_FOCUS } from "@/data/eventData";
import { BookOpen, Clock, Flame, ShieldAlert } from "lucide-react";

export function PrayerFocusSection() {
  return (
    <section id="prayer-focus" className="py-24 bg-gray-50 text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-fireRed block">
            Themes of Intercession
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Official Prayer Focus
          </h2>
          <p className="text-base text-gray-600 font-normal">
            Strategic corporate prayer focuses guiding the 12-hour prayer incubation watches.
          </p>
        </div>

        {/* 3 Prayer Watch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLACEHOLDER_PRAYER_FOCUS.map((focus) => (
            <div
              key={focus.id}
              className="light-feature-card rounded-2xl p-8 flex flex-col justify-between group cursor-default"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-brand-fireRed text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{focus.session}</span>
                  </span>
                  {focus.scriptureReference && (
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand-flameOrange" />
                      <span>{focus.scriptureReference}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-fireRed transition-colors">
                  {focus.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {focus.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-brand-flameOrange font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Unbroken Altar</span>
                </span>
                <span>Draft Placeholder</span>
              </div>
            </div>
          ))}
        </div>

        {/* Confidentiality Reminder */}
        <div className="mt-10 p-4 rounded-2xl bg-white border border-gray-200 text-xs text-gray-600 max-w-2xl mx-auto text-center">
          <strong className="text-gray-900">Confidentiality Note:</strong> Corporate themes are public. Personal prayer points submitted during individual registration remain strictly confidential.
        </div>
      </div>
    </section>
  );
}
