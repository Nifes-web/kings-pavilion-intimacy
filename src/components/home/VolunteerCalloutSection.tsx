import React from "react";
import Link from "next/link";
import Image from "next/image";
import { VOLUNTEER_DEPARTMENTS } from "@/data/eventData";
import { HeartHandshake, ArrowRight, CheckCircle2, Sparkles, Users } from "lucide-react";

export interface VolunteerCalloutSectionProps {
  mediaAssignment?: {
    url: string;
    alt?: string;
    fit?: "cover" | "contain" | "fill";
    position?: "center" | "top" | "bottom" | "left" | "right";
  };
}

export function VolunteerCalloutSection({ mediaAssignment }: VolunteerCalloutSectionProps = {}) {
  const volunteerImgUrl = mediaAssignment?.url || "/assets/flyer-fiery-warriors.jpg";
  const volunteerAlt = mediaAssignment?.alt || "Fiery intercessors and ministers serving at the altar";
  const volunteerFit = (mediaAssignment?.fit as any) || "cover";
  const volunteerPosition = mediaAssignment?.position || "center";
  return (
    <section className="py-24 bg-gray-50 text-gray-900 border-t border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-gray-200 p-8 sm:p-12 lg:p-16 shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (Reference Style) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-brand-flameOrange uppercase tracking-wider">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Ministry Call to Service</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Serve at the Altar of{" "}
                <span className="bg-gradient-to-r from-brand-fireRed to-brand-flameOrange bg-clip-text text-transparent">
                  Intimacy 2026
                </span>
              </h2>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
                Join one of the 8 approved volunteer departments to coordinate, serve, and minister at IPMAN Event Hall on Saturday, 5 December 2026.
              </p>

              {/* Department Chips (Reference style) */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Selectable Departments:
                </span>
                <div className="flex flex-wrap gap-2">
                  {VOLUNTEER_DEPARTMENTS.map((dept) => (
                    <span
                      key={dept.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-flameOrange" />
                      <span>{dept.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/volunteer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 active:scale-98 transition-all"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Apply to Volunteer Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-full text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  Register as Attendee Instead
                </Link>
              </div>
            </div>

            {/* Right Column: Information Card with Visual Banner */}
            <div className="lg:col-span-5 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative aspect-[16/9] w-full bg-black">
                <Image
                  src={volunteerImgUrl}
                  alt={volunteerAlt}
                  fill
                  style={{ objectFit: volunteerFit, objectPosition: volunteerPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-goldYellow block">
                    Ministry Readiness
                  </span>
                  <span className="text-xs font-semibold">Join the Frontline Team</span>
                </div>
              </div>
              <div className="p-7 space-y-4">
                <div className="flex items-center gap-2 text-brand-fireRed font-bold text-sm uppercase tracking-wide">
                  <Users className="w-4 h-4" />
                  <span>Volunteer Guidelines</span>
                </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-fireRed mt-2 shrink-0" />
                  <span>
                    <strong>Department Assignment:</strong> You will select exactly one department that aligns with your experience and ministry gifts.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-flameOrange mt-2 shrink-0" />
                  <span>
                    <strong>Pre-Event Briefings:</strong> Department briefings will be coordinated ahead of the December 5 bootcamp date.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-goldYellow mt-2 shrink-0" />
                  <span>
                    <strong>Independent Application:</strong> Registering as an attendee does not prevent you from serving as a volunteer.
                  </span>
                </li>
              </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
