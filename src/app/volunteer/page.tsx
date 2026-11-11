import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VolunteerForm } from "@/components/forms/VolunteerForm";
import { getGlobalBranding } from "@/lib/brandingService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VolunteerPage() {
  const branding = await getGlobalBranding();

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      <Navbar logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />

      <main id="main-content" className="flex-grow pt-24 pb-20">
        <VolunteerForm />
      </main>

      <Footer logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />
    </div>
  );
}
