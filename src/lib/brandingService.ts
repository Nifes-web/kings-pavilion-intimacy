import { getAssetAssignments } from "@/lib/mediaService";
import { GlobalBranding, DEFAULT_BRANDING } from "@/lib/brandingTypes";

export { DEFAULT_BRANDING };
export type { GlobalBranding };

/**
 * Retrieve the canonical global branding configuration derived from
 * the website_logo asset assignment slot. (Server-side only)
 */
export async function getGlobalBranding(): Promise<GlobalBranding> {
  try {
    const assignments = await getAssetAssignments();
    const logoSlot = assignments?.website_logo;

    if (logoSlot && logoSlot.url && logoSlot.url.trim() !== "") {
      return {
        logoUrl: logoSlot.url,
        logoAlt: logoSlot.alt || DEFAULT_BRANDING.logoAlt,
        logoFit: logoSlot.fit || DEFAULT_BRANDING.logoFit,
        logoPosition: logoSlot.position || DEFAULT_BRANDING.logoPosition,
        updatedAt: logoSlot.updated_at || DEFAULT_BRANDING.updatedAt,
      };
    }
  } catch (err) {
    console.error("[BrandingService] Error retrieving global branding:", err);
  }

  return DEFAULT_BRANDING;
}
