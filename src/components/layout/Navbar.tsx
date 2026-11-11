"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, HeartHandshake, Flame } from "lucide-react";
import { useBranding } from "@/lib/useBranding";

export interface NavbarProps {
  logoUrl?: string;
  logoAlt?: string;
}

export function Navbar({ logoUrl, logoAlt }: NavbarProps = {}) {
  const branding = useBranding(logoUrl, logoAlt);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const brandLogo = branding.logoUrl;
  const brandAlt = branding.logoAlt;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "/#about" },
    { name: "Expectations", href: "/#what-to-expect" },
    { name: "Ministers", href: "/#ministers" },
    { name: "Prayer Focus", href: "/#prayer-focus" },
    { name: "Testimonies", href: "/#testimonies" },
    { name: "Venue & FAQ", href: "/#event-info" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09080E]/95 backdrop-blur-md border-b border-white/10 py-3 shadow-2xl"
          : "bg-[#09080E]/80 backdrop-blur-sm border-b border-white/5 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-goldYellow rounded-lg"
            aria-label="King's Pavilion Intimacy Home"
          >
            <div className="relative h-11 w-32 sm:h-12 sm:w-36 overflow-hidden">
              <Image
                src={brandLogo}
                alt={brandAlt}
                fill
                className="object-contain object-left group-hover:opacity-90 transition-opacity"
                priority
              />
            </div>
          </Link>

          {/* Center Navigation Links (Reference style) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-medium tracking-tight transition-all ${
                    isActive
                      ? "text-brand-goldYellow bg-white/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-goldYellow`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons (Reference style) */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/volunteer"
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-200 hover:text-white border border-white/20 hover:border-brand-goldYellow/60 hover:bg-white/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-goldYellow"
            >
              Volunteer
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow shadow-fire-glow hover:brightness-110 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-goldYellow"
            >
              <span>Register to Attend</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-fireRed to-brand-flameOrange"
            >
              Register
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#09080E]/98 border-b border-white/10 backdrop-blur-xl px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:text-brand-goldYellow hover:bg-white/5 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/volunteer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-full text-sm font-semibold text-brand-goldYellow border border-brand-goldYellow/40 hover:bg-brand-goldYellow/10"
              >
                Volunteer to Serve
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-fireRed via-brand-flameOrange to-brand-goldYellow"
              >
                Register to Attend (Free)
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
