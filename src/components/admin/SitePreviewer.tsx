"use client";

import React, { useState } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Sparkles,
} from "lucide-react";

type DeviceMode = "desktop" | "tablet" | "mobile";
type Orientation = "portrait" | "landscape";

export function SitePreviewer() {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [selectedRoute, setSelectedRoute] = useState<string>("/");
  const [scale, setScale] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState<number>(1);

  const routes = [
    { label: "Homepage", path: "/" },
    { label: "Ministers & Speakers", path: "/ministers" },
    { label: "Testimonies Altar", path: "/testimonies" },
    { label: "Attendee Registration", path: "/register" },
    { label: "Volunteer Application", path: "/volunteer" },
  ];

  // Device dimension definitions
  const getDeviceDimensions = () => {
    if (device === "desktop") {
      return { width: "100%", height: "820px" };
    }
    if (device === "tablet") {
      return orientation === "portrait"
        ? { width: "768px", height: "1024px" }
        : { width: "1024px", height: "768px" };
    }
    // mobile
    return orientation === "portrait"
      ? { width: "375px", height: "812px" }
      : { width: "812px", height: "375px" };
  };

  const dims = getDeviceDimensions();

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="p-4 rounded-2xl bg-[#120E1A] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Device Selector */}
        <div className="flex items-center gap-2 bg-[#09080E] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => {
              setDevice("desktop");
              setScale(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              device === "desktop"
                ? "bg-brand-flameOrange text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => {
              setDevice("tablet");
              setScale(0.85);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              device === "tablet"
                ? "bg-brand-flameOrange text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet (iPad)</span>
          </button>
          <button
            onClick={() => {
              setDevice("mobile");
              setScale(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              device === "mobile"
                ? "bg-brand-flameOrange text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (iPhone)</span>
          </button>
        </div>

        {/* Center: Route Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 lg:pb-0">
          <Globe className="w-4 h-4 text-brand-goldYellow shrink-0 hidden sm:block" />
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="bg-[#09080E] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-goldYellow font-medium"
          >
            {routes.map((r) => (
              <option key={r.path} value={r.path}>
                {r.label} ({r.path})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Orientation, Zoom & Reload */}
        <div className="flex items-center gap-2">
          {device !== "desktop" && (
            <button
              onClick={() =>
                setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"))
              }
              className="p-2 rounded-xl bg-[#09080E] border border-white/10 text-gray-300 hover:text-white hover:border-brand-goldYellow text-xs flex items-center gap-1 transition-all"
              title="Rotate Screen"
            >
              <RotateCw className="w-3.5 h-3.5 text-brand-goldYellow" />
              <span className="hidden sm:inline capitalize">{orientation}</span>
            </button>
          )}

          <div className="flex items-center bg-[#09080E] border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-1 hover:text-white text-gray-400"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-gray-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.2, s + 0.1))}
              className="p-1 hover:text-white text-gray-400"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-2 rounded-xl bg-[#09080E] border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all"
            title="Reload Frame"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-goldYellow" />
          </button>

          <a
            href={selectedRoute}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-brand-goldYellow text-black font-bold hover:brightness-110 transition-all flex items-center gap-1 text-xs"
            title="Open in Native Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center items-center py-6 px-2 min-h-[700px] bg-[#07060A] rounded-3xl border border-white/5 overflow-hidden">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease-out",
          }}
          className={`relative transition-all duration-300 ${
            device === "mobile"
              ? "p-4 bg-[#1E1B29] rounded-[48px] border-4 border-gray-800 shadow-2xl"
              : device === "tablet"
              ? "p-5 bg-[#1E1B29] rounded-[36px] border-4 border-gray-800 shadow-2xl"
              : "w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          }`}
        >
          {/* Simulated Mobile / Tablet Top Notch / Camera */}
          {device === "mobile" && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-950 border border-white/10 mr-4" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50" />
            </div>
          )}

          {device === "tablet" && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-950 rounded-full z-20 border border-white/10" />
          )}

          {/* Iframe */}
          <div
            style={{ width: dims.width, height: dims.height }}
            className="bg-[#09080E] rounded-2xl overflow-hidden relative"
          >
            <iframe
              key={`${selectedRoute}-${iframeKey}`}
              src={selectedRoute}
              title={`Live Preview of ${selectedRoute}`}
              className="w-full h-full border-0"
            />
          </div>

          {/* Simulated Mobile Home Bar Indicator */}
          {device === "mobile" && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}

