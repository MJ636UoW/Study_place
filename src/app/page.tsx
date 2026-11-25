import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Table, Sparkles, Compass, Shield, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata = {
  title: "Elite Study Zone • Premium Study Hall & Workstations in Ghatkopar West",
  description:
    "Book your workstation seat at Elite Study Zone in Ghatkopar West, Mumbai. Flexible hourly, weekly, monthly and weekend plans with 24/7 smart keypad access and silent study environment.",
};

export default function HomePage() {
  const workstationPhotos = [
    {
      title: "Individual Focus Workstation",
      description: "Ergonomic chair, solid oak desk, individual task light & power sockets.",
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Main Study Sanctuary",
      description: "Air-conditioned silent study hall with library-grade acoustic isolation (< 38 dBA).",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Quiet Focus Pods",
      description: "Full-height visual privacy partitions with dedicated high-speed fiber internet drops.",
      imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Natural Light Study Bay",
      description: "Glare-free circadian lighting designed to eliminate digital fatigue during long shifts.",
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="w-full bg-white text-charcoal-900">
      {/* =========================================================================
          TOP STRIP: Center Details
          ========================================================================= */}
      <div className="bg-forest-950 text-forest-200 text-xs py-2 px-4 text-center font-mono border-b border-forest-800 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>📍 Amrut Nagar, Ghatkopar West, Mumbai &bull; Center Hours: 07:00 AM — 11:00 PM &bull; Smart Keypad Access</span>
      </div>

      {/* =========================================================================
          HEADER & INTRODUCTION SECTION
          Name with Logo + Short Introduction About Library + Two Main Options
          ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-gradient-to-b from-ivory-50/70 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Official Name with Desk Lamp & Book Logo */}
          <div className="flex items-center justify-center">
            <BrandLogo size="lg" />
          </div>

          {/* Primary Welcome Headline */}
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-charcoal-900 tracking-tight leading-[1.2]">
            Your Space for Focus, Productivity & Success.
          </h1>

          {/* Short Introduction About Library */}
          <p className="text-base sm:text-lg text-charcoal-700 font-sans max-w-2xl mx-auto leading-relaxed">
            A peaceful, fully air-conditioned, distraction-free study sanctuary designed for students, competitive exam aspirants, and professionals in <strong>Ghatkopar West, Mumbai</strong>. Featuring individual ergonomic workstations, high-speed fiber Wi-Fi, 24/7 smart digital door keypad access, and optional storage lockers.
          </p>

          {/* TWO MAIN OPTIONS: Book Workstation & View All Plans Chart */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/book"
              className="w-full sm:w-auto px-8 py-4 bg-forest-800 text-white text-sm uppercase tracking-widest font-extrabold hover:bg-forest-700 active:bg-forest-900 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 min-h-[50px] border border-forest-900"
            >
              <span>Book Workstation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/plans"
              className="w-full sm:w-auto px-8 py-4 bg-white text-charcoal-900 text-sm uppercase tracking-wider font-extrabold hover:bg-forest-50 border-2 border-forest-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 min-h-[50px]"
            >
              <Table className="w-4 h-4 text-forest-800" />
              <span>View All Plans Chart</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          WORKSTATION PHOTOS GALLERY
          Clean, simple, professional photos of actual workstations
          ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-ivory-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800 rounded-full font-bold">
              <span>Sanctuary Gallery</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-900 font-bold">
              Workstation Photos
            </h2>
            <p className="text-sm text-charcoal-600 max-w-lg mx-auto font-sans">
              Clean, ergonomic, and quiet environments thoughtfully crafted for deep intellectual work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workstationPhotos.map((photo, index) => (
              <div
                key={index}
                className="group border border-ivory-300 rounded-xl overflow-hidden bg-ivory-50/50 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory-200">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-1.5">
                  <h3 className="font-serif font-bold text-base text-charcoal-900">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-charcoal-600 leading-relaxed font-sans">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          VISION & MISSION
          Clean, simple, professional representation
          ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-ivory-50/60">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-900 font-bold">
              Vision & Mission
            </h2>
            <p className="text-sm text-charcoal-600 max-w-md mx-auto font-sans">
              Our guiding principles at Elite Study Zone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vision Card */}
            <div className="p-8 bg-white border border-ivory-300 rounded-2xl shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-lg bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                Our Vision
              </h3>
              <p className="text-sm text-charcoal-700 leading-relaxed font-sans">
                To empower every student, competitive exam aspirant, and professional by providing an exceptional, distraction-free environment that inspires discipline, consistency, and academic excellence.
              </p>
            </div>

            {/* Mission Card */}
            <div className="p-8 bg-white border border-ivory-300 rounded-2xl shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                Our Mission
              </h3>
              <p className="text-sm text-charcoal-700 leading-relaxed font-sans">
                To deliver accessible, premium study infrastructure with ergonomic workstations, flexible daily and monthly plans, seamless smart keypad security, and reliable amenities that make deep focus effortless.
              </p>
            </div>
          </div>

          {/* Direct CTA at bottom */}
          <div className="pt-6 text-center">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-forest-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-forest-700 rounded-lg shadow-md transition-all"
            >
              <span>Reserve Your Workstation Seat Today →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
