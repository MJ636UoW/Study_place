import type { Metadata, Viewport } from "next";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sanctuary-residences.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SANCTUARY — Study & Atelier | From Distraction to Focus",
    template: "%s | SANCTUARY",
  },
  description:
    "A physical sanctuary for serious thought, deep work, and unhurried scholarship. Library-grade acoustics, honest oak joinery, and natural light.",
  keywords: ["study space", "deep work", "library sanctuary", "writing atelier", "focus residency", "Bangalore coworking"],
  openGraph: {
    title: "SANCTUARY — Study & Atelier",
    description: "A physical sanctuary for serious thought, deep work, and unhurried scholarship.",
    url: appUrl,
    siteName: "SANCTUARY Residences",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SANCTUARY — Study & Atelier",
    description: "A physical sanctuary for serious thought, deep work, and unhurried scholarship.",
  },
  alternates: {
    canonical: appUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF8F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-ivory-50 text-charcoal-900 font-sans selection:bg-forest-100 selection:text-forest-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-forest-900 text-ivory-50 font-sans text-xs uppercase tracking-wider shadow-editorial border border-forest-800"
        >
          Skip to main content
        </a>

        <Navigation />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
