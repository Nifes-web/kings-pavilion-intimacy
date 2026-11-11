import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PLACEHOLDER_TESTIMONIES } from "@/data/eventData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Quote, ArrowRight, ArrowLeft, ShieldCheck, User } from "lucide-react";
import { getPublishedTestimonies } from "@/lib/contentService";
import { getGlobalBranding } from "@/lib/brandingService";

export const revalidate = 0;

export default async function TestimoniesPage() {
  const [dbTestimonies, branding] = await Promise.all([
    getPublishedTestimonies(),
    getGlobalBranding(),
  ]);
  const displayTestimonies = dbTestimonies && dbTestimonies.length > 0 ? dbTestimonies : PLACEHOLDER_TESTIMONIES;

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      <Navbar logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />

      <main id="main-content" className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-goldYellow transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <SectionHeader
            badge="Divine Encounters"
            title="Published"
            highlightWord="Testimonies"
            description="Explore verified testimonies of breakthroughs, answered prayers, and divine interventions experienced through the altar of prayer."
          />

          {/* Testimonies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {displayTestimonies.map((item: any) => {
              const name = item.testifier_name || item.testifierName || "Attendee";
              const content = item.content || item.fullTestimony || item.excerpt || "";
              const title = item.title || `Testimony of ${name}`;
              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-gradient-to-b from-[#181320] to-[#0E0C14] border border-white/10 p-7 sm:p-8 flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-goldYellow">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-flameOrange bg-brand-flameOrange/10 border border-brand-flameOrange/30 px-3 py-1 rounded-full">
                        {item.category || "Verified Testimony"}
                      </span>
                    </div>

                    <Quote className="w-7 h-7 text-brand-fireRed/40 mb-3" />

                    <h2 className="text-xl font-bold text-white group-hover:text-brand-goldYellow transition-colors mb-3 line-clamp-2">
                      {title}
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-4">
                      &ldquo;{content}&rdquo;
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Editorial Review"}
                      </span>
                    </div>

                    <Link
                      href={`/testimonies/${item.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-goldYellow hover:underline"
                    >
                      <span>Read Full Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center text-xs text-gray-400">
            King&apos;s Pavilion strictly publishes genuine accounts. Real attendee testimonies will be verified and approved by church leadership before publication.
          </p>
        </div>
      </main>

      <Footer logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />
    </div>
  );
}
