import React from "react";
import { ImageOff, Info } from "lucide-react";

interface AssetPlaceholderProps {
  label: string;
  description: string;
  aspectRatio?: "square" | "video" | "portrait" | "banner";
  className?: string;
}

export function AssetPlaceholder({
  label,
  description,
  aspectRatio = "square",
  className = "",
}: AssetPlaceholderProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    banner: "aspect-[21/9]",
  };

  return (
    <div
      className={`w-full ${aspectClasses[aspectRatio]} bg-brand-charcoal/90 border border-dashed border-brand-cardBorder rounded-xl flex flex-col items-center justify-center p-6 text-center group hover:border-brand-flameOrange/50 transition-colors ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-brand-cardDark border border-brand-cardBorder flex items-center justify-center mb-3 text-brand-goldYellow group-hover:scale-105 transition-transform">
        <ImageOff className="w-6 h-6 text-brand-flameOrange" />
      </div>
      <h4 className="text-sm font-semibold text-gray-200 tracking-wide uppercase mb-1">
        {label}
      </h4>
      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
        {description}
      </p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand-goldYellow/80 bg-brand-goldYellow/10 px-2 py-0.5 rounded">
        <Info className="w-3 h-3" />
        <span>Official asset pending submission</span>
      </div>
    </div>
  );
}

