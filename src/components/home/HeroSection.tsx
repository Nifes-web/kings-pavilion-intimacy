import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight, HeartHandshake } from "lucide-react";

export interface HeroSectionProps {
  data?: {
    title?: string;
    subtitle?: string;
    content?: Record<string, any>;
  } | null;
  mediaAssignment?: {
    url: string;
    alt?: string;
    fit?: "cover" | "contain" | "fill";
    position?: "center" | "top" | "bottom" | "left" | "right";
  };
}

export function HeroSection({ data, mediaAssignment }: HeroSectionProps = {}) {
  const title = data?.title || "12 Hours of Prayer, Warfare & Consecration";
  const subtitle = data?.subtitle || "King's Pavilion Presents • Hour of Incubation";
  const c = data?.content || {};
  const highlight = c.headline_highlight || "INTIMACY";
  const eventTag = c.event_tag || "Bootcamp 2026";
  const description =
    c.description ||
    "A consecrated 12-hour spiritual altar convened at IPMAN Event Hall, Ile Ife, Osun State. Join united intercessors for sustained prayer, prophetic worship, and spiritual revival.";
  const dateStr = c.date || "Sat, 5 Dec 2026";
  const timeStr = c.time || "8:00 AM WAT (12 Continuous Hours)";
  const venueStr = c.venue || "IPMAN Hall, Ibadan Rd, Ile Ife";
  const admissionStr = c.admission || "Free Admission";
  const regBtnText = c.register_button_text || "Register to Attend (Free)";
  const volBtnText = c.volunteer_button_text || "Apply as Volunteer";

  const flyerImgUrl = mediaAssignment?.url || c.image_url || "/assets/intimacy-flyer.jpg";
  const flyerAlt = mediaAssignment?.alt || c.image_alt || "Official King's Pavilion Intimacy 12 Hours Prayer Bootcamp Flyer";
  const flyerFit = (mediaAssignment?.fit as any) || c.image_fit || "cover";
  const flyerPosition = mediaAssignment?.position || c.image_position || "center";

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#09080E]">
      {/* Dynamic Background Atmosphere: Fiery Radial Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/3 -translate-x-1/2 w-[750px] h-[550px] bg-gradient-to-b from-[#E81712]/20 via-[#FF5A1F]/15 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[550px] bg-gradient-to-b from-[#FF5A1F]/15 via-[#FFC400]/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute -bottom-20 left-10 w-[500px] h-[300px] bg-[#E81712]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Badges, CTAs (Reference layout) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-flameOrange animate-pulse inline-block" />
              {subtitle}
            </p>

            {/* Main Headline (Modern Bold Sans - No Serif) */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                {title}
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-intimacy-3d uppercase tracking-tight">
                  {highlight}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-flameOrange bg-brand-flameOrange/15 border border-brand-flameOrange/30 px-3 py-1 rounded-full self-center">
                  {eventTag}
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {description}
            </p>

            {/* Action Buttons (Reference style) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm sm:text-base font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 active:scale-98 transition-all group"
              >
                <span>{regBtnText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/volunteer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-semibold text-gray-200 hover:text-white border border-white/20 hover:border-brand-goldYellow/60 hover:bg-white/5 transition-all"
              >
                <HeartHandshake className="w-4 h-4 text-brand-goldYellow" />
                <span>{volBtnText}</span>
              </Link>
            </div>

            {/* Event Metrics / Trust Strip (Reference style under-hero pill) */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-flameOrange shrink-0" />
                <span className="font-semibold text-white">{dateStr}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-goldYellow shrink-0" />
                <span className="font-semibold text-white">{timeStr}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-fireRed shrink-0" />
                <span className="text-gray-300">{venueStr}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                {/* Free Admission */}
                <span className="text-emerald-400 font-medium">{admissionStr}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic (Framing the Original Flyer Art) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[928/1024] rounded-3xl overflow-hidden border border-white/15 shadow-2xl shadow-[#E81712]/20 group bg-black">
              {/* Preserved Original Flyer Imagery or Dynamic Assigned Media */}
              <Image
                src={flyerImgUrl}
                alt={flyerAlt}
                fill
                style={{ objectFit: flyerFit, objectPosition: flyerPosition }}
                className="group-hover:scale-102 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-80" />

              {/* Bottom Badge inside the card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#09080E]/95 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-goldYellow block">
                    12 Hours Prayer Bootcamp
                  </span>
                  <span className="text-xs text-gray-300">
                    Saturday, 5 December 2026
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">
                    @Rccg_kings_Pavilion_Ife
                  </span>
                  <span className="text-[10px] text-gray-400">Official Social Handle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
