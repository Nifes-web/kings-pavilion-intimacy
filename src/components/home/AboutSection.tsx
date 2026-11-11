import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface AboutSectionProps {
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

export function AboutSection({ data, mediaAssignment }: AboutSectionProps = {}) {
  const customTitle = data?.title;
  const customDesc = data?.content?.description;
  const customPillars = data?.content?.coreFocus;

  const aboutImgUrl = mediaAssignment?.url || data?.content?.image_url || "/assets/flyer-intercession-travail.jpg";
  const aboutAlt = mediaAssignment?.alt || data?.content?.image_alt || "Worshippers in travail and intercession from official flyer";
  const aboutFit = (mediaAssignment?.fit as any) || data?.content?.image_fit || "cover";
  const aboutPosition = mediaAssignment?.position || data?.content?.image_position || "center";

  const pillars = [
    {
      title: "The Chamber of Incubation",
      desc: "Tagged 'Hour of Incubation', this 12-hour stretch is designed to incubate spiritual vision, divine strength, and personal consecration without worldly interruption.",
    },
    {
      title: "Corporate Warfare & Deliverance",
      desc: "Standing in one accord at IPMAN Event Hall, united believers release corporate authority to dismantle generational yokes, territorial limitations, and spiritual slumber.",
    },
    {
      title: "Rekindling the Altar of Fire",
      desc: "Modeled after Leviticus 6:13, where the fire on the altar must never go out. Designed to restore believers' private prayer lives to perpetual spiritual burning.",
    },
    {
      title: "Prophetic Direction & Word Alignment",
      desc: "Receive apostolic and prophetic alignment for your destiny, family, career, and ministry assignment for the coming season.",
    },
  ];

  return (
    <section id="about" className="py-24 bg-white text-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Headline and Feature List (Reference style) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Decorative badge removed per UI guardrails */}

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              {customTitle ? (
                <span>{customTitle}</span>
              ) : (
                <>
                  Why Believers Gather for{" "}
                  <span className="bg-gradient-to-r from-brand-fireRed to-brand-flameOrange bg-clip-text text-transparent">
                    INTIMACY 2026
                  </span>
                </>
              )}
            </h2>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
              {customDesc || (
                <>
                  Convened by <strong>King&apos;s Pavilion</strong>, Intimacy is not a conventional conference—it is a continuous 12-hour sacred prayer incubation where worshippers converge from across Nigeria at <strong>IPMAN Event Hall, Ile Ife</strong> to meet God intimately.
                </>
              )}
            </p>

            {/* Feature List Cards (Reference style) */}
            <div className="space-y-3.5 pt-2">
              {pillars.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-brand-flameOrange/40 hover:bg-white hover:shadow-card-soft transition-all"
                >
                  <div className="flex flex-col gap-2">



                      <h3 className="text-base font-bold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                        {item.desc}
                      </p>

                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-black transition-colors"
              >
                <span>Reserve Your Free Entry Pass</span>
                <ArrowRight className="w-4 h-4 text-brand-goldYellow" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Artwork Feature Card (Using preserved flyer imagery) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-black">
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={aboutImgUrl}
                  alt={aboutAlt}
                  fill
                  style={{ objectFit: aboutFit, objectPosition: aboutPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                
                {/* Overlay Text */}
                <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-fireRed text-white text-[10px] font-bold uppercase tracking-wider">
                    Hour of Incubation
                  </span>
                  <h3 className="text-2xl font-black leading-tight text-white">
                    12 Hours of Corporate Intercession
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    IPMAN Event Hall, beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
