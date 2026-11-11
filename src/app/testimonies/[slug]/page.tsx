import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PLACEHOLDER_TESTIMONIES } from "@/data/eventData";
import { ArrowLeft, Quote, ShieldCheck, Calendar, User } from "lucide-react";
import { getGlobalBranding } from "@/lib/brandingService";

export const revalidate = 0;

interface TestimonyPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return PLACEHOLDER_TESTIMONIES.map((t) => ({
    slug: t.slug,
  }));
}

export default async function TestimonyDetailPage({ params }: TestimonyPageProps) {
  const [branding] = await Promise.all([getGlobalBranding()]);
  const testimony = PLACEHOLDER_TESTIMONIES.find((t) => t.slug === params.slug);

  if (!testimony) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      <Navbar logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />

      <main id="main-content" className="flex-grow pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Link
              href="/testimonies"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-goldYellow transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Testimonies Directory</span>
            </Link>
          </div>

          <article className="rounded-3xl bg-gradient-to-b from-[#181320] to-[#0E0C14] border border-white/10 p-8 sm:p-14 space-y-8 shadow-2xl">
            {/* Header */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-flameOrange bg-brand-flameOrange/10 border border-brand-flameOrange/30 px-3 py-1 rounded-full">
                  Verified Testimony
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-brand-goldYellow" />
                  <span>Documented Altar Record</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                {testimony.title}
              </h1>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-goldYellow">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {testimony.testifierName}
                  </span>
                  <span className="text-xs text-gray-400">
                    King&apos;s Pavilion Congregation / Attendee
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-base sm:text-lg text-gray-200 leading-relaxed">
              <Quote className="w-10 h-10 text-brand-flameOrange/30" />
              <p className="font-medium text-brand-goldYellow italic text-lg sm:text-xl">
                &ldquo;{testimony.excerpt}&rdquo;
              </p>
              <div className="pt-2 text-sm sm:text-base text-gray-300 space-y-4 leading-loose font-normal">
                <p>{testimony.fullTestimony}</p>
                <p>
                  At King&apos;s Pavilion, we celebrate every manifestation of God&apos;s divine mercy and answer to prayer. During the 12 Hours Prayer Bootcamp, corporate intercession creates an atmosphere where yokes are destroyed, destinies are realigned, and believers encounter God intimately.
                </p>
              </div>
            </div>

            {/* Return CTA */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/testimonies"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-goldYellow hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to all testimonies</span>
              </Link>
              <Link
                href="/register"
                className="px-7 py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 transition-all"
              >
                Register to Attend Intimacy 2026
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />
    </div>
  );
}
