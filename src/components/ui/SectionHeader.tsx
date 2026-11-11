import React from "react";
import { Flame } from "lucide-react";

interface SectionHeaderProps {
  badge: string;
  title: string;
  highlightWord?: string;
  description?: string;
  centered?: boolean;
}

export function SectionHeader({
  badge,
  title,
  highlightWord,
  description,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center max-w-3xl mx-auto" : "max-w-2xl"}`}>
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-fireRed/10 border border-brand-fireRed/30 text-xs font-semibold uppercase tracking-wider text-brand-goldYellow mb-4 ${centered ? "mx-auto" : ""}`}>
        <Flame className="w-3.5 h-3.5 text-brand-flameOrange fill-brand-flameOrange" />
        <span>{badge}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
        {title}{" "}
        {highlightWord && (
          <span className="bg-gradient-to-r from-brand-flameOrange via-brand-goldYellow to-brand-goldYellow bg-clip-text text-transparent">
            {highlightWord}
          </span>
        )}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

