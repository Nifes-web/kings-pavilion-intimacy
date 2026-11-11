import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getGlobalBranding } from "@/lib/brandingService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const branding = await getGlobalBranding();

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-brand-flameOrange selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-flameOrange/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-brand-goldYellow/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-block group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-goldYellow rounded-xl p-1 mb-1 transition-transform hover:scale-105"
            aria-label="Return to King's Pavilion Homepage"
          >
            <div className="relative h-12 w-40 sm:h-14 sm:w-48 mx-auto overflow-hidden">
              <Image
                src={branding.logoUrl}
                alt={branding.logoAlt}
                fill
                priority
                className="object-contain object-center group-hover:opacity-90 transition-opacity"
              />
            </div>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Administrative Access
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Sign in with your authorized administrator or check-in operator email
            </p>
          </div>
        </div>

        {/* Suspense boundary wrapping useSearchParams */}
        <Suspense
          fallback={
            <div className="rounded-3xl bg-[#16121D] border border-white/10 p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-goldYellow mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Back to public site */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            &larr; Return to public event website
          </Link>
        </div>
      </div>
    </div>
  );
}
