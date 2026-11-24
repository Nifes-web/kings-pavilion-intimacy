import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface WhatToExpectSectionProps {
  data?: {
    title?: string;
    subtitle?: string;
    content?: Record<string, any>;
  } | null;
}

export function WhatToExpectSection({ data }: WhatToExpectSectionProps = {}) {
  const c = data?.content || {};
  const title = data?.title || "Explore the Bootcamp Experience";
  const subtitle = data?.subtitle || "Programme Dimensions";
  const description =
    c.description ||
    "Four consecrated pillars orchestrating an unforgettable 12-hour prayer incubation at IPMAN Event Hall.";
  const ctaText = c.ctaText || "Register for the Full 12 Hours";

  const defaultActivities = [
    {
      title: "12‑Hour Continuous Intercession",
      desc: "A full day of focused prayer, from 8 AM to 8 PM, unbroken worship for the kingdom.",
    },
    {
      title: "Deep Prophetic Worship",
      desc: "Heart‑felt worship inviting God’s presence and prophetic insight.",
    },
    {
      title: "Spiritual Warfare",
      desc: "Targeted prayers breaking chains and standing firm in authority.",
    },
    {
      title: "Incubation & Impartation",
      desc: "Quiet waiting on God for personal callings and fresh anointing.",
    },
  ];

  const activities =
    Array.isArray(c.items) && c.items.length > 0 ? c.items : defaultActivities;

  return (
    <section id="what-to-expect" className="py-24 bg-gray-50 text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-fireRed block">
            {subtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-base text-gray-600 font-normal">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((item: any, idx: number) => (
            <div
              key={idx}
              className="light-feature-card rounded-2xl p-7 flex flex-col justify-between group cursor-default"
            >
              <div>
                {/* Icon placeholder could be added here if needed */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-brand-fireRed transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Saturday, 5 Dec</span>
                <span className="font-semibold text-gray-700">8AM – 8PM</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 transition-all"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
