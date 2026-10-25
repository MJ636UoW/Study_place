import React from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import {
  ArrowRight,
  Check,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import {
  plansFixture,
  amenitiesFixture,
  galleryFixture,
  reviewsFixture,
  faqsFixture,
  locationFixture,
} from "@/fixtures";
import { DeskToRoomScroll } from "@/components/home/DeskToRoomScroll";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionReveal } from "@/components/ui/SectionReveal";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* =========================================================================
          HERO SECTION: "A place for your next breakthrough."
          Visible immediately with primary CTA "Find my seat"
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-ivory-200">
        {/* Subtle architectural background coordinate lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#DDD3C1 1px, transparent 1px), linear-gradient(90deg, #DDD3C1 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline, Charter & Primary CTA */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
                <span>Creative Direction • From Distraction to Focus</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-charcoal-900 tracking-tight leading-[1.08]">
                A place for your next breakthrough.
              </h1>

              <p className="font-serif italic text-lg sm:text-xl text-charcoal-700 max-w-xl leading-relaxed">
                Step inside an intentional sanctuary built strictly for deep reading, sustained concentration, and the unhurried craft of scholarship.
              </p>

              <p className="text-xs sm:text-sm text-charcoal-600 font-sans max-w-lg leading-relaxed">
                No casual conversations, no ambient music, no artificial rush. Dedicated solid oak workstations, library-grade acoustics (&lt; 38 dBA), and whole-bean single-origin roasts.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/book"
                  className="px-8 py-4 bg-forest-900 text-ivory-50 text-xs uppercase tracking-widest font-semibold hover:bg-forest-800 active:bg-forest-950 border border-forest-900 shadow-editorial min-h-[48px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 transition-all"
                >
                  <span>Find My Seat</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/plans"
                  className="px-6 py-4 bg-transparent text-charcoal-800 text-xs uppercase tracking-widest font-medium hover:bg-ivory-100 border border-charcoal-400 hover:border-charcoal-800 min-h-[48px] flex items-center justify-center transition-colors"
                >
                  View Residency Tiers
                </Link>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-6 border-t border-ivory-200 grid grid-cols-3 gap-4 text-xs font-mono text-charcoal-600">
                <div>
                  <div className="font-serif text-base sm:text-lg text-charcoal-900 font-bold">&lt; 38 dBA</div>
                  <div className="text-[10px] uppercase tracking-wider text-charcoal-500">Certified Silence</div>
                </div>
                <div>
                  <div className="font-serif text-base sm:text-lg text-charcoal-900 font-bold">100% FSC Oak</div>
                  <div className="text-[10px] uppercase tracking-wider text-charcoal-500">Solid Workstations</div>
                </div>
                <div>
                  <div className="font-serif text-base sm:text-lg text-charcoal-900 font-bold">24 / 7 Keycard</div>
                  <div className="text-[10px] uppercase tracking-wider text-charcoal-500">Resident Access</div>
                </div>
              </div>
            </div>

            {/* Right Column: Layered Study-Desk Illustration */}
            <div className="lg:col-span-6 relative">
              <div className="relative p-6 sm:p-10 border border-ivory-300 bg-ivory-100/70 shadow-editorial-md">
                {/* Architectural Corner Crop Marks */}
                <span className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-forest-900 pointer-events-none" />
                <span className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-forest-900 pointer-events-none" />
                <span className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-forest-900 pointer-events-none" />
                <span className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-forest-900 pointer-events-none" />

                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-charcoal-500 pb-3 border-b border-ivory-200">
                  <span>Plat Drawing 01-A</span>
                  <span>Scale 1:25 • Oak Desk Detail</span>
                </div>

                {/* SVG Study Desk Illustration */}
                <div className="my-4 aspect-[4/3] bg-ivory-50 border border-ivory-200 relative overflow-hidden flex items-center justify-center">
                  <svg
                    viewBox="0 0 500 360"
                    className="w-full h-full p-2 select-none"
                    aria-label="Layered architectural study desk with lamp, notebook, and ruler"
                  >
                    {/* Desk Outline */}
                    <rect x="25" y="45" width="450" height="270" fill="#E8DCB8" stroke="#1A1918" strokeWidth="2.5" />
                    <rect x="35" y="55" width="430" height="250" fill="#DFCFB0" stroke="#C8BBA5" strokeWidth="1" />

                    {/* Desk Oak Planks */}
                    <line x1="35" y1="120" x2="465" y2="120" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="30 10 40 10" />
                    <line x1="35" y1="180" x2="465" y2="180" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="40 15 20 8" />
                    <line x1="35" y1="240" x2="465" y2="240" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="50 10 30 10" />

                    {/* Warm Lamp Beam Cone */}
                    <polygon points="120,60 260,300 40,300" fill="#FFF2CE" opacity="0.75" />

                    {/* Open Journal */}
                    <g transform="translate(110, 120)">
                      <rect x="0" y="0" width="180" height="130" fill="#FAF8F5" stroke="#1A1918" strokeWidth="1.75" />
                      <line x1="90" y1="0" x2="90" y2="130" stroke="#45423E" strokeWidth="1.5" />
                      {/* Left Page Text Lines */}
                      <line x1="12" y1="20" x2="78" y2="20" stroke="#DDD3C1" strokeWidth="1.2" />
                      <line x1="12" y1="36" x2="78" y2="36" stroke="#DDD3C1" strokeWidth="1.2" />
                      <line x1="12" y1="52" x2="78" y2="52" stroke="#DDD3C1" strokeWidth="1.2" />
                      <line x1="12" y1="68" x2="78" y2="68" stroke="#DDD3C1" strokeWidth="1.2" />
                      <line x1="12" y1="84" x2="78" y2="84" stroke="#DDD3C1" strokeWidth="1.2" />
                      <line x1="12" y1="100" x2="78" y2="100" stroke="#DDD3C1" strokeWidth="1.2" />
                      {/* Right Page Diagram */}
                      <circle cx="135" cy="50" r="24" fill="none" stroke="#183728" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="135" y="54" textAnchor="middle" fill="#183728" fontSize="8" fontFamily="monospace">FOCUS</text>
                      <line x1="105" y1="90" x2="165" y2="90" stroke="#DDD3C1" strokeWidth="1" />
                      <line x1="105" y1="104" x2="155" y2="104" stroke="#DDD3C1" strokeWidth="1" />
                    </g>

                    {/* Brass Architect's Lamp */}
                    <g transform="translate(80, 45)">
                      <circle cx="15" cy="35" r="12" fill="#45423E" stroke="#1A1918" strokeWidth="1.5" />
                      <path d="M 15 35 L 30 10 L 60 18" fill="none" stroke="#C5832B" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 45 12 L 80 25 L 72 42 L 38 30 Z" fill="#183728" stroke="#0D2016" strokeWidth="1.5" />
                      <circle cx="70" cy="36" r="6" fill="#FFF8DE" />
                    </g>

                    {/* Green Pen with Gold Accent */}
                    <g transform="translate(315, 175) rotate(-30)">
                      <rect x="0" y="0" width="10" height="95" fill="#183728" stroke="#0D2016" strokeWidth="1.5" />
                      <polygon points="0,0 10,0 5,-15" fill="#C5832B" />
                    </g>

                    {/* Ceramic Cup */}
                    <g transform="translate(360, 95)">
                      <circle cx="16" cy="16" r="16" fill="#FAF8F5" stroke="#1A1918" strokeWidth="1.5" />
                      <circle cx="16" cy="16" r="12" fill="#7D4F12" />
                    </g>

                    {/* Architectural Drafting Scale */}
                    <g transform="translate(50, 275)">
                      <rect x="0" y="0" width="150" height="14" fill="#FAF8F5" stroke="#1A1918" strokeWidth="1" />
                      {[...Array(15)].map((_, i) => (
                        <line
                          key={i}
                          x1={i * 10}
                          y1="0"
                          x2={i * 10}
                          y2={i % 5 === 0 ? "8" : "4"}
                          stroke="#1A1918"
                          strokeWidth="0.75"
                        />
                      ))}
                    </g>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs text-charcoal-700 font-sans pt-2">
                  <span>Workstation No. 04 • North Gallery Pier</span>
                  <span className="text-forest-900 font-medium">Ready for Reservation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SIGNATURE SCROLL SEQUENCE:
          Desk composition gradually transitions toward top-down room illustration.
          Lamp's light becomes highlighted desk in room.
          Ends with: "Your seat. Your routine." and direct booking CTA.
          ========================================================================= */}
      <DeskToRoomScroll />

      {/* =========================================================================
          SPACE INTRODUCTION:
          Different composition: Asymmetric editorial spread, unrepeated layout
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-50">
        <SectionReveal className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Col: The Architectural Philosophy */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Architecture of Thought
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-900 leading-snug">
                The modern workplace was built for collaboration. Sanctuary was built for the solitary hours that precede it.
              </h2>

              <p className="text-sm text-charcoal-700 font-sans leading-relaxed">
                Breakthroughs require continuous, uninterrupted time. We eliminated the performative distractions of typical modern offices—the endless pinging, background chatter, and hot-desking friction.
              </p>

              <div className="p-6 bg-ivory-100 border-l-2 border-forest-900 text-xs font-sans text-charcoal-800 space-y-2">
                <p className="font-semibold text-charcoal-900 uppercase tracking-wide">
                  The Quietude Covenant
                </p>
                <p>
                  Every member and day guest signs an acoustic pledge upon arrival: silence in the Main Reading Room, headphones required for playback, phone calls strictly sequestered to decoupled telephone salons.
                </p>
              </div>
            </div>

            {/* Right Col: Two Asymmetric Facets */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Facet 1: The Material Truth */}
                <div className="p-8 border border-ivory-300 bg-ivory-100/50 space-y-3">
                  <div className="text-[10px] font-mono uppercase text-forest-800">Criterion 01</div>
                  <h3 className="font-serif text-2xl text-charcoal-900">Honest Materials</h3>
                  <p className="text-xs text-charcoal-600 font-sans leading-relaxed">
                    Surrounded by solid Appalachian white oak, heavy felt partitions, raw brass fittings, and textured linen journals. No plastic laminates or sensory overload.
                  </p>
                  <div className="text-[11px] font-mono text-charcoal-500 pt-2 border-t border-ivory-200">
                    Sourced FSC-Certified • Custom Joinery
                  </div>
                </div>

                {/* Facet 2: Circadian Environment */}
                <div className="p-8 border border-ivory-300 bg-ivory-100/50 space-y-3">
                  <div className="text-[10px] font-mono uppercase text-forest-800">Criterion 02</div>
                  <h3 className="font-serif text-2xl text-charcoal-900">Circadian Ecology</h3>
                  <p className="text-xs text-charcoal-600 font-sans leading-relaxed">
                    Continuous medical HEPA air filtration maintains indoor CO2 levels strictly under 600 ppm. Diffused northern skylights protect your eyes from midday glare.
                  </p>
                  <div className="text-[11px] font-mono text-charcoal-500 pt-2 border-t border-ivory-200">
                    Air Filter Efficiency 99.97% • 2700K Task Lights
                  </div>
                </div>
              </div>

              {/* Bottom Quote Strip */}
              <div className="p-6 border border-ivory-200 bg-ivory-50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-serif italic text-charcoal-800">
                    “An environment so quiet that your attention naturally widens, deepening your engagement with difficult problems.”
                  </div>
                  <div className="text-[10px] font-mono uppercase text-charcoal-500">
                    Curator’s Note • Vol. IV Catalog
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="px-4 py-2 border border-charcoal-300 text-xs uppercase tracking-wider font-medium text-charcoal-800 hover:bg-ivory-100 whitespace-nowrap min-h-[44px] flex items-center"
                >
                  Schedule Tour
                </Link>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          REAL-PHOTO GALLERY:
          Editorial masonry composition with genuine architectural specifications
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-100/60">
        <SectionReveal className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Physical Spaces
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900 mt-2">
                The Sanctuary Gallery
              </h2>
            </div>
            <p className="text-xs text-charcoal-600 font-sans max-w-md">
              Unfiltered, real architectural imagery capturing our reading rooms, focus alcoves, and courtyard loggias.
            </p>
          </div>

          {/* Asymmetric Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main Feature Photo (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden border border-ivory-300 bg-ivory-200">
                <Image
                  src={galleryFixture[0].imageUrl}
                  alt={galleryFixture[0].caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="p-3 bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-charcoal-900">{galleryFixture[0].area}</span> —{" "}
                  <span className="text-charcoal-600">{galleryFixture[0].caption}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 uppercase sm:text-right max-w-full sm:max-w-[45%]">
                  {galleryFixture[0].architecturalNote}
                </span>
              </div>
            </div>

            {/* Vertical Alcove Photo (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-[4/3] sm:aspect-[4/4] overflow-hidden border border-ivory-300 bg-ivory-200">
                <Image
                  src={galleryFixture[1].imageUrl}
                  alt={galleryFixture[1].caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="p-3 bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-charcoal-900">{galleryFixture[1].area}</span> —{" "}
                  <span className="text-charcoal-600">{galleryFixture[1].caption}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 uppercase sm:text-right max-w-full sm:max-w-[45%]">
                  {galleryFixture[1].architecturalNote}
                </span>
              </div>
            </div>

            {/* Secondary Square Photo (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden border border-ivory-300 bg-ivory-200">
                <Image
                  src={galleryFixture[2].imageUrl}
                  alt={galleryFixture[2].caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="p-3 bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-charcoal-900">{galleryFixture[2].area}</span> —{" "}
                  <span className="text-charcoal-600">{galleryFixture[2].caption}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 uppercase sm:text-right max-w-full sm:max-w-[45%]">
                  {galleryFixture[2].architecturalNote}
                </span>
              </div>
            </div>

            {/* Courtyard Loggia (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden border border-ivory-300 bg-ivory-200">
                <Image
                  src={galleryFixture[3].imageUrl}
                  alt={galleryFixture[3].caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="p-3 bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-charcoal-900">{galleryFixture[3].area}</span> —{" "}
                  <span className="text-charcoal-600">{galleryFixture[3].caption}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 uppercase sm:text-right max-w-full sm:max-w-[45%]">
                  {galleryFixture[3].architecturalNote}
                </span>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          VERIFIED AMENITIES:
          Detailed checklist composition with independent verification notes
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-50">
        <SectionReveal className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
              Certified Infrastructure
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900">
              Verified Amenities
            </h2>
            <p className="text-sm text-charcoal-600 font-sans">
              We test and certify every standard so your work proceeds without mechanical or environmental failure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenitiesFixture.map((amenity) => (
              <div
                key={amenity.id}
                className="p-6 border border-ivory-300 bg-ivory-100/40 hover:bg-ivory-100 transition-colors space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-ivory-200 text-charcoal-800 border border-ivory-300">
                    {amenity.category}
                  </span>
                  <StatusBadge status="verified" size="sm" />
                </div>

                <div>
                  <h3 className="font-serif text-xl text-charcoal-900 leading-snug">
                    {amenity.title}
                  </h3>
                  <p className="text-xs text-charcoal-600 font-sans mt-2 leading-relaxed">
                    {amenity.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-ivory-200 text-[11px] font-mono text-amber-800 flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-forest-800 flex-shrink-0 mt-0.5" />
                  <span>{amenity.verificationNote}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          MEMBERSHIP OPTIONS:
          Refined editorial tiers with Day Sanctuary, Resident Atelier, Estate Fellow
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-100/40">
        <SectionReveal className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Admission & Cadence
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900 mt-2">
                Residency Options
              </h2>
            </div>
            <div className="text-xs font-sans text-charcoal-600 max-w-md">
              Whether you need a single uninterrupted day of intense drafting or a permanent desk with a personal keycard and locker.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plansFixture.map((plan) => (
              <div
                key={plan.id}
                className={clsx(
                  "p-8 flex flex-col justify-between border transition-all text-left",
                  plan.highlighted
                    ? "border-forest-900 bg-ivory-50 shadow-editorial-md relative"
                    : "border-ivory-300 bg-ivory-100/60"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 bg-forest-900 text-ivory-50 text-[10px] uppercase font-mono tracking-widest">
                    Resident Choice
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-amber-800 tracking-wider">
                      {plan.code}
                    </span>
                    <span className="text-xs text-charcoal-500 font-sans">
                      {plan.accessHours}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-charcoal-900">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-charcoal-600 font-sans mt-2 leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="py-4 border-y border-ivory-200 flex items-baseline gap-2">
                    <span className="font-serif text-4xl sm:text-5xl font-bold text-charcoal-900">
                      ${plan.price}
                    </span>
                    <span className="text-xs font-mono uppercase text-charcoal-500">
                      {plan.currency} / {plan.cadence}
                    </span>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-2.5 text-xs text-charcoal-700 font-sans">
                    <div className="text-[10px] uppercase font-mono text-charcoal-500 tracking-wider">
                      Residency Inclusions
                    </div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-forest-800 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href={`/book?tier=${plan.id}`}
                    className={clsx(
                      "w-full py-3.5 min-h-[44px] flex items-center justify-center text-xs uppercase tracking-widest font-semibold border transition-all",
                      plan.highlighted
                        ? "bg-forest-900 text-ivory-50 border-forest-900 hover:bg-forest-800"
                        : "bg-transparent text-charcoal-900 border-charcoal-700 hover:bg-ivory-200"
                    )}
                  >
                    Select {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border border-ivory-200 bg-ivory-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
            <span className="text-charcoal-700">
              Need corporate fellowships, dedicated team salons, or academic grant residencies?
            </span>
            <Link
              href="/contact?topic=institutional"
              className="text-forest-900 font-medium uppercase tracking-wider hover:underline whitespace-nowrap min-h-[44px] flex items-center"
            >
              Contact Curatorial Desk →
            </Link>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          HOW BOOKING WORKS:
          Linear progression with Roman Numerals (I, II, III)
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-50">
        <SectionReveal>
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                The Protocol
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900">
                How Booking Works
              </h2>
              <p className="text-sm text-charcoal-600 font-sans">
                A friction-free reservation experience designed to honor your schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-8 border border-ivory-300 bg-ivory-100/40 relative space-y-4">
                <div className="text-2xl font-serif text-amber-800 font-bold">I.</div>
                <h3 className="font-serif text-xl text-charcoal-900">
                  Select Your Workstation
                </h3>
                <p className="text-xs text-charcoal-600 font-sans leading-relaxed">
                  Choose your exact desk from our spatial floorplan. Pick between the North Skylight Gallery, quiet Courtyard Loggia, or private Book Stack alcoves.
                </p>
                <div className="text-[10px] font-mono text-charcoal-500 pt-2 border-t border-ivory-200">
                  Live Seat Assignment
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-8 border border-ivory-300 bg-ivory-100/40 relative space-y-4">
                <div className="text-2xl font-serif text-amber-800 font-bold">II.</div>
                <h3 className="font-serif text-xl text-charcoal-900">
                  Confirm Dates & Intake
                </h3>
                <p className="text-xs text-charcoal-600 font-sans leading-relaxed">
                  Reserve for a single intensive work day or establish an ongoing monthly atelier residency. Submit any special lighting or locker requests.
                </p>
                <div className="text-[10px] font-mono text-charcoal-500 pt-2 border-t border-ivory-200">
                  Instant Confirmation Voucher
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-8 border border-forest-900/30 bg-forest-50/30 relative space-y-4">
                <div className="text-2xl font-serif text-forest-900 font-bold">III.</div>
                <h3 className="font-serif text-xl text-charcoal-900">
                  Arrive & Focus
                </h3>
                <p className="text-xs text-charcoal-600 font-sans leading-relaxed">
                  Scan your keycard at the entry loggia. Your assigned desk is prepared, fresh roast coffee is poured, and guaranteed silence is maintained.
                </p>
                <div className="text-[10px] font-mono text-forest-800 pt-2 border-t border-forest-200 font-semibold">
                  Zero Check-In Wait
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          GENUINE REVIEWS / MEMBER NOTES:
          Authentic reflections from verified resident fellows
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-100/50">
        <SectionReveal>
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                  Member Reflections
                </span>
                <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900 mt-2">
                  Voices of the Residency
                </h2>
              </div>
              <div className="text-xs font-mono text-charcoal-500 uppercase">
                Unsolicited notes from current fellows
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviewsFixture.map((rev) => (
                <div
                  key={rev.id}
                  className="p-8 border border-ivory-300 bg-ivory-50 flex flex-col justify-between space-y-6 text-left shadow-editorial"
                >
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-forest-800">
                      {rev.discipline}
                    </div>
                    <blockquote className="font-serif text-base sm:text-lg text-charcoal-900 leading-snug italic">
                      “{rev.quote}”
                    </blockquote>
                  </div>

                  <div className="pt-4 border-t border-ivory-200 space-y-1">
                    <div className="font-semibold text-charcoal-900 text-sm">
                      {rev.author}
                    </div>
                    <div className="text-xs text-charcoal-600 font-sans">
                      {rev.role}
                    </div>
                    <div className="text-[10px] font-mono text-charcoal-400">
                      {rev.membershipTenure} • {rev.stayDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          FAQS:
          Accessible Accordion Component
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-50">
        <SectionReveal>
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Inquiry & Clarity
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-charcoal-900">
                Frequently Addressed Questions
              </h2>
              <p className="text-sm text-charcoal-600 font-sans">
                Important details about our noise covenants, access hours, and booking terms.
              </p>
            </div>

            <FaqAccordion items={faqsFixture} />

            <div className="text-center pt-4">
              <p className="text-xs text-charcoal-600 font-sans">
                Have a bespoke question not answered here?{" "}
                <Link href="/contact" className="text-forest-900 font-semibold hover:underline inline-flex items-center min-h-[44px]">
                  Contact our curatorial desk directly
                </Link>
                .
              </p>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          LOCATION & CONTACT INFORMATION:
          Architectural studio details
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-ivory-200 bg-ivory-100/60">
        <SectionReveal>
          <div className="max-w-7xl mx-auto">
            <div className="p-8 sm:p-12 border border-ivory-300 bg-ivory-50 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4 text-left">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
                  Studio Headquarters
                </span>
                <h3 className="font-serif text-3xl text-charcoal-900">
                  {locationFixture.name}
                </h3>
                <p className="text-sm text-charcoal-600 font-sans leading-relaxed">
                  Located inside the historic St. Jude architectural mews, set back from street traffic with private courtyard garden access.
                </p>
                <div className="space-y-2 text-xs font-sans text-charcoal-800 pt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-forest-800 flex-shrink-0" />
                    <span>
                      {locationFixture.addressLine1}, {locationFixture.addressLine2}, {locationFixture.city}, {locationFixture.statePostal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-forest-800 flex-shrink-0" />
                    <span>{locationFixture.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-forest-800 flex-shrink-0" />
                    <span>{locationFixture.conciergePhone}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 p-6 border border-ivory-200 bg-ivory-100 space-y-4">
                <div className="text-[10px] uppercase font-mono tracking-widest text-charcoal-500">
                  Arrival & Transit Guide
                </div>
                <p className="text-xs text-charcoal-700 font-sans leading-relaxed">
                  {locationFixture.transitNote}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/contact"
                    className="px-5 py-2.5 bg-forest-900 text-ivory-50 text-xs uppercase tracking-wider font-medium hover:bg-forest-800 text-center min-h-[44px] flex items-center justify-center"
                  >
                    Request Studio Visit
                  </Link>
                  <Link
                    href="/plans"
                    className="px-5 py-2.5 border border-charcoal-400 text-charcoal-900 text-xs uppercase tracking-wider font-medium hover:bg-ivory-200 text-center min-h-[44px] flex items-center justify-center"
                  >
                    Explore Tiers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* =========================================================================
          FINAL BOOKING CTA:
          High-contrast editorial forest green banner
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-forest-950 text-ivory-50">
        <SectionReveal>
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-900 border border-forest-700 text-[10px] font-mono uppercase tracking-widest text-amber-400">
              Residency Intake Open • November 2026 Term
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-ivory-50 tracking-tight leading-tight">
              Begin your residency. Reclaim your focus.
            </h2>

            <p className="font-serif italic text-base sm:text-xl text-ivory-200 max-w-2xl mx-auto leading-relaxed">
              Your oak desk, quiet alcove, and fresh coffee are ready. Choose your seat and establish your routine today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-sans text-xs uppercase tracking-widest font-bold shadow-editorial min-h-[48px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition-all"
              >
                <span>Find My Seat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-forest-900 text-ivory-100 font-sans text-xs uppercase tracking-widest font-semibold border border-forest-600 min-h-[48px] flex items-center justify-center transition-colors"
              >
                Speak with Concierge
              </Link>
            </div>

            <div className="text-[11px] font-mono text-forest-200 pt-4">
              Direct reservations • 100% cancellation refund up to 24 hours prior
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
