export interface GlobalBranding {
  logoUrl: string;
  logoAlt: string;
  logoFit: "cover" | "contain" | "fill";
  logoPosition: "center" | "top" | "bottom" | "left" | "right";
  updatedAt: string;
}

export const DEFAULT_BRANDING: GlobalBranding = {
  logoUrl: "/assets/kings-pavilion-logo-cropped.png",
  logoAlt: "King's Pavilion Logo",
  logoFit: "contain",
  logoPosition: "center",
  updatedAt: "2026-11-10T20:00:00Z",
};

