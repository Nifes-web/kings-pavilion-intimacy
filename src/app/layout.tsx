import type { Metadata, Viewport } from "next";
import { AuthHashListener } from "@/components/auth/AuthHashListener";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "King's Pavilion Intimacy | 12 Hours Prayer Bootcamp",
  description:
    "Intimacy: 12 Hours Prayer Bootcamp (Hour of Incubation). Saturday, 5 December 2026, 8:00 AM WAT at IPMAN Event Hall, beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State, Nigeria.",
  keywords: [
    "Intimacy",
    "Prayer Bootcamp",
    "King's Pavilion",
    "12 Hours Prayer",
    "Ile Ife",
    "Osun State",
    "Hour of Incubation",
    "Christian Prayer Event",
  ],
  authors: [{ name: "King's Pavilion" }],
  openGraph: {
    title: "King's Pavilion Intimacy | 12 Hours Prayer Bootcamp 2026",
    description:
      "A 12-Hour Consecrated Atmosphere of Intercession, Divine Encounter & Spiritual Alignment at IPMAN Event Hall, Ile Ife.",
    type: "website",
    locale: "en_NG",
    images: [
      {
        url: "/assets/intimacy-flyer.jpg",
        width: 928,
        height: 1024,
        alt: "King's Pavilion Intimacy Prayer Bootcamp Flyer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "King's Pavilion Intimacy | 12 Hours Prayer Bootcamp 2026",
    description: "Saturday, 5 December 2026 at IPMAN Event Hall, Ile Ife, Osun State.",
    images: ["/assets/intimacy-flyer.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A090D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-brand-obsidian text-white antialiased selection:bg-brand-flameOrange selection:text-white">
        {/* Skip to Main Content Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-goldYellow focus:text-black focus:font-bold focus:rounded-lg focus:shadow-xl"
        >
          Skip to main content
        </a>
        {/* Global listener to route Supabase recovery hash fragments to /reset-password */}
        <AuthHashListener />
        {children}
      </body>
    </html>
  );
}
