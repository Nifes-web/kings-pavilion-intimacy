"use client";

import { useState, useEffect } from "react";
import { GlobalBranding, DEFAULT_BRANDING } from "@/lib/brandingTypes";

const STORAGE_KEY = "kp_global_branding";

/**
 * Custom React hook to subscribe to the global website branding (logo, alt, fit, position).
 * Provides immediate rendering from initial SSR props or local cache,
 * synchronizes with GET /api/branding, and listens for real-time admin updates.
 */
export function useBranding(initialLogoUrl?: string, initialLogoAlt?: string): GlobalBranding {
  const [branding, setBranding] = useState<GlobalBranding>(() => {
    // 1. Initial priority: explicit props (from Server Component render)
    if (initialLogoUrl) {
      return {
        ...DEFAULT_BRANDING,
        logoUrl: initialLogoUrl,
        logoAlt: initialLogoAlt || DEFAULT_BRANDING.logoAlt,
      };
    }

    // 2. Local storage cache (zero-flicker client hydration across pages)
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.logoUrl) {
            return parsed;
          }
        }
      } catch {
        // Fall through to default
      }
    }

    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    let isMounted = true;

    async function syncBranding() {
      try {
        const res = await fetch("/api/branding", {
          cache: "no-store",
          headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.branding && isMounted) {
            setBranding(data.branding);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.branding));
            } catch {
              // Ignore local storage quota/security warnings
            }
          }
        }
      } catch (err) {
        // Fallback silently if offline or network error
      }
    }

    syncBranding();

    // Event listener for in-app real-time updates when Main Admin updates the logo
    const handleBrandingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        const detail = customEvent.detail;
        const newUrl = detail.url || detail.logoUrl;
        const newAlt = detail.alt || detail.logoAlt || DEFAULT_BRANDING.logoAlt;
        const newFit = detail.fit || detail.logoFit || DEFAULT_BRANDING.logoFit;
        const newPosition = detail.position || detail.logoPosition || DEFAULT_BRANDING.logoPosition;

        const updated: GlobalBranding = {
          logoUrl: newUrl,
          logoAlt: newAlt,
          logoFit: newFit,
          logoPosition: newPosition,
          updatedAt: new Date().toISOString(),
        };

        setBranding(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      } else {
        syncBranding();
      }
    };

    // Cross-tab synchronization via storage event
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.logoUrl) {
            setBranding(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener("kp-branding-updated", handleBrandingEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("kp-branding-updated", handleBrandingEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  return branding;
}
