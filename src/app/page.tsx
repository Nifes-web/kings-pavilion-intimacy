import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { MetricsStrip } from "@/components/home/MetricsStrip";
import { AboutSection } from "@/components/home/AboutSection";
import { WhatToExpectSection } from "@/components/home/WhatToExpectSection";
import { FeatureShowcaseSection } from "@/components/home/FeatureShowcaseSection";
import { MinistersSection } from "@/components/home/MinistersSection";
import { TestimoniesSection } from "@/components/home/TestimoniesSection";
import { PrayerFocusSection } from "@/components/home/PrayerFocusSection";
import { EventInfoSection } from "@/components/home/EventInfoSection";
import { VolunteerCalloutSection } from "@/components/home/VolunteerCalloutSection";
import { ClosingCtaBanner } from "@/components/home/ClosingCtaBanner";
import {
  getSiteContent,
  getPublishedMinisters,
  getPublishedFaqs,
  getAssetAssignments,
  getActiveAnnouncements,
} from "@/lib/contentService";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";

export const revalidate = 0;

export default async function HomePage() {
  const [heroContent, aboutContent, eventInfoContent, ministers, faqs, assignments, announcements] =
    await Promise.all([
      getSiteContent("hero"),
      getSiteContent("about"),
      getSiteContent("event_info"),
      getPublishedMinisters(),
      getPublishedFaqs(),
      getAssetAssignments(),
      getActiveAnnouncements(),
    ]);

  return (
    <div className="min-h-screen bg-brand-obsidian text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      {/* 0. Live Broadcast Announcement Banner (Respects Scheduling & Expiration) */}
      <AnnouncementBanner announcements={announcements} />

      <Navbar
        logoUrl={assignments?.website_logo?.url}
        logoAlt={assignments?.website_logo?.alt}
      />

      <main id="main-content" className="flex-grow">
        {/* 1. Dramatic Dark Hero with Preserved Flyer Visual Centerpiece */}
        <HeroSection
          data={heroContent}
          mediaAssignment={assignments?.hero_flyer}
        />

        {/* 2. Crisp Light Stat Counter Strip (Reference Style) */}
        <MetricsStrip />

        {/* 3. Event Introduction: Clean Light Section with Feature List & Flyer Travail Artwork */}
        <AboutSection
          data={aboutContent}
          mediaAssignment={assignments?.about_image}
        />

        {/* 5. What to Expect: Crisp 4-Card Grid & Centered CTA Button */}
        <WhatToExpectSection />

        {/* 6. Dark Feature Showcase Block: Shofar Blower Artwork & Consecration */}
        <FeatureShowcaseSection
          mediaAssignment={assignments?.shofar_image}
        />

        {/* 7. Ministers & Facilitators: Clean Light Section with Verified Profile Placeholders */}
        <MinistersSection ministers={ministers} />

        {/* 8. Verified Testimonies: Dark Spotlit Quote Slider Card (Reference Style) */}
        <TestimoniesSection />

        {/* 9. Prayer Focus: Clean Light 3-Watch Breakdown */}
        <PrayerFocusSection />

        {/* 10. Venue Information & Interactive FAQs */}
        <EventInfoSection data={eventInfoContent} faqs={faqs} />

        {/* 11. Volunteer Callout Section */}
        <VolunteerCalloutSection
          mediaAssignment={assignments?.volunteer_image}
        />

        {/* 12. Full-Width Bold Closing CTA Banner (Reference Style) */}
        <ClosingCtaBanner />
      </main>

      <Footer
        logoUrl={assignments?.website_logo?.url}
        logoAlt={assignments?.website_logo?.alt}
      />
    </div>
  );
}
