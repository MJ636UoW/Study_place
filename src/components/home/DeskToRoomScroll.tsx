"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Compass } from "lucide-react";

export const DeskToRoomScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    let isVisible = false;

    const handleScroll = () => {
      if (!isVisible || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = rect.height - windowHeight;

      if (totalScrollable <= 0) return;

      // Calculate progress between 0 and 1 using GPU-friendly interpolation
      const current = -rect.top;
      const rawProgress = current / totalScrollable;
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setProgress(clamped);
    };

    // Pause scroll calculation when section is off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (isVisible) handleScroll();
      },
      { rootMargin: "150px 0px 150px 0px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // For reduced motion users, show static split-view
  if (prefersReducedMotion) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-y border-ivory-200 bg-ivory-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-800 font-medium">
              Spatial Transition • Architectural Floorplan
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-charcoal-900 mt-2">
              Your seat. Your routine.
            </h2>
            <p className="text-sm text-charcoal-600 font-sans mt-3">
              Every desk at Sanctuary is oriented for natural illumination, acoustic calm, and zero visual distraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Desk Close-Up */}
            <div className="p-8 border border-ivory-300 bg-ivory-50 text-center">
              <h3 className="font-serif text-xl text-charcoal-900 mb-2">I. The Solitary Desk</h3>
              <p className="text-xs text-charcoal-600 mb-4">
                Handcrafted solid oak, warm brass task lamp, and dedicated gigabit connection.
              </p>
              <div className="aspect-[4/3] bg-ivory-100 border border-ivory-200 flex items-center justify-center p-4">
                <svg viewBox="0 0 400 300" className="w-full h-full max-h-56" aria-hidden="true">
                  <rect x="30" y="80" width="340" height="180" fill="#D8C6A5" stroke="#1A1918" strokeWidth="2" />
                  <rect x="70" y="110" width="130" height="110" fill="#FAF8F5" stroke="#1A1918" strokeWidth="1.5" />
                  <line x1="85" y1="130" x2="185" y2="130" stroke="#DDD3C1" strokeWidth="1" />
                  <line x1="85" y1="150" x2="185" y2="150" stroke="#DDD3C1" strokeWidth="1" />
                  <line x1="85" y1="170" x2="185" y2="170" stroke="#DDD3C1" strokeWidth="1" />
                  <circle cx="280" cy="150" r="28" fill="#183728" />
                  <path d="M 280 150 L 320 190" stroke="#183728" strokeWidth="4" />
                </svg>
              </div>
            </div>

            {/* Room Top-Down */}
            <div className="p-8 border border-forest-900/30 bg-forest-50/40 text-center">
              <div className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-forest-100 text-forest-900 mb-2">
                Reserved: Desk 04
              </div>
              <h3 className="font-serif text-xl text-charcoal-900 mb-2">II. The Reading Room Sanctuary</h3>
              <p className="text-xs text-charcoal-600 mb-4">
                Top-down layout showing North Gallery quiet zones and courtyard loggia.
              </p>
              <div className="aspect-[4/3] bg-ivory-50 border border-ivory-200 flex items-center justify-center p-4">
                <svg viewBox="0 0 400 300" className="w-full h-full max-h-56" aria-hidden="true">
                  <rect x="20" y="20" width="360" height="260" fill="#FAF8F5" stroke="#1A1918" strokeWidth="2" />
                  <rect x="50" y="50" width="60" height="40" fill="#FAF8F5" stroke="#183728" strokeWidth="2" />
                  <rect x="140" y="50" width="60" height="40" fill="#FAF8F5" stroke="#183728" strokeWidth="2" />
                  <rect x="230" y="50" width="60" height="40" fill="#FAF8F5" stroke="#183728" strokeWidth="2" />
                  {/* Highlighted Desk 04 */}
                  <rect x="140" y="140" width="60" height="40" fill="#183728" stroke="#0D2016" strokeWidth="2" />
                  <text x="170" y="165" fill="#FAF8F5" fontSize="10" textAnchor="middle" fontFamily="sans-serif">DESK 04</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/book?seat=desk-04"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-forest-900 text-ivory-50 font-sans text-xs uppercase tracking-widest hover:bg-forest-800 transition-colors"
            >
              <span>Reserve Desk 04 Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Interpolated visual values based on scroll progress
  // Stage 1 (0 to 0.45): Desk detail -> transitioning
  // Stage 2 (0.45 to 0.85): Transitioning -> Room plan
  // Stage 3 (0.85 to 1.0): Completed highlight & Final CTA
  const deskScale = Math.max(0.2, 1 - progress * 0.75);
  const deskOpacity = Math.max(0, 1 - progress * 1.8);
  const roomScale = Math.min(1, 0.4 + progress * 0.6);
  const roomOpacity = Math.min(1, Math.max(0, (progress - 0.2) * 1.6));
  const spotlightRadius = 80 + progress * 240;
  const isFinalStage = progress >= 0.75;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[220vh] sm:h-[260vh] bg-ivory-100 border-y border-ivory-200"
      aria-label="Signature Desk to Sanctuary Room Transition"
    >
      {/* Sticky viewport frame */}
      <div className="sticky top-20 h-[calc(100vh-5rem)] w-full overflow-hidden flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-8">
        {/* Top Sequence Status Header */}
        <div className="max-w-4xl mx-auto w-full text-center z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-50 border border-ivory-200 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-charcoal-700 mb-2">
            <span
              className={clsx(
                "w-1.5 h-1.5 rounded-full transition-colors",
                isFinalStage ? "bg-amber-600" : "bg-forest-800"
              )}
            />
            <span>
              {progress < 0.35
                ? "Sequence 01 • The Individual Workstation"
                : progress < 0.75
                ? "Sequence 02 • Spatial Elevation to Gallery Plan"
                : "Sequence 03 • Assigned Sanctuary Routine"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif text-charcoal-900 tracking-tight transition-all duration-300">
            {isFinalStage ? "Your seat. Your routine." : "From distraction to focus."}
          </h2>

          <p className="text-xs sm:text-sm text-charcoal-600 font-sans mt-2 max-w-xl mx-auto leading-relaxed">
            {isFinalStage
              ? "Every residency includes your dedicated workstation in the North Gallery—acoustically secluded, illuminated, and ready upon arrival."
              : "As you transition into the sanctuary, ambient noise recedes and the room resolves into dedicated architecture."}
          </p>
        </div>

        {/* Central Graphic Transition Stage */}
        <div className="relative flex-1 w-full max-w-5xl mx-auto my-4 flex items-center justify-center overflow-hidden border border-ivory-300 bg-ivory-50 shadow-editorial">
          {/* Architectural Background Grid Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(#DDD3C1 1px, transparent 1px), linear-gradient(90deg, #DDD3C1 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />

          {/* Compass / Orientation Mark */}
          <div
            className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-charcoal-400 select-none"
            aria-hidden="true"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>North Study Gallery • Grid 04-B</span>
          </div>

          {/* LAYER 1: Detailed Study Desk Composition (Fades and scales down) */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              opacity: deskOpacity,
              transform: `scale(${deskScale}) translate3d(0, 0, 0)`,
              willChange: "transform, opacity",
              pointerEvents: deskOpacity < 0.1 ? "none" : "auto",
            }}
            aria-hidden={deskOpacity < 0.1}
          >
            <svg
              viewBox="0 0 600 450"
              className="w-full max-w-2xl h-auto drop-shadow-sm select-none"
              aria-label="Layered illustration of an oak study desk with lamp, open notebook, and drafting ruler"
            >
              {/* Desk Surface (Appalachian Oak) */}
              <rect
                x="40"
                y="100"
                width="520"
                height="280"
                fill="#E8DCB8"
                stroke="#2E2C29"
                strokeWidth="3"
              />
              <rect
                x="50"
                y="110"
                width="500"
                height="260"
                fill="#DFCFB0"
                stroke="#C8BBA5"
                strokeWidth="1"
              />

              {/* Oak Grain Lines */}
              <line x1="60" y1="160" x2="540" y2="160" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="40 15 20 8" />
              <line x1="60" y1="230" x2="540" y2="230" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="25 10 50 12" />
              <line x1="60" y1="300" x2="540" y2="300" stroke="#C8BBA5" strokeWidth="1" strokeDasharray="60 20 30 10" />

              {/* Brass Desk Lamp Light Beam (Warm Ivory Glow) */}
              <polygon
                points="160,110 320,380 40,380"
                fill="#FEF3D6"
                opacity="0.6"
              />

              {/* Open Linen Journal / Notebook */}
              <g transform="translate(140, 180)">
                {/* Journal Cover */}
                <rect x="0" y="0" width="220" height="150" fill="#FAF8F5" stroke="#1A1918" strokeWidth="2" />
                {/* Spine */}
                <line x1="110" y1="0" x2="110" y2="150" stroke="#2E2C29" strokeWidth="2" />
                {/* Left Page Rules */}
                <line x1="15" y1="25" x2="95" y2="25" stroke="#DDD3C1" strokeWidth="1.5" />
                <line x1="15" y1="45" x2="95" y2="45" stroke="#DDD3C1" strokeWidth="1.5" />
                <line x1="15" y1="65" x2="95" y2="65" stroke="#DDD3C1" strokeWidth="1.5" />
                <line x1="15" y1="85" x2="95" y2="85" stroke="#DDD3C1" strokeWidth="1.5" />
                <line x1="15" y1="105" x2="95" y2="105" stroke="#DDD3C1" strokeWidth="1.5" />
                <line x1="15" y1="125" x2="95" y2="125" stroke="#DDD3C1" strokeWidth="1.5" />
                {/* Right Page Architectural Sketch */}
                <rect x="125" y="25" width="80" height="70" fill="none" stroke="#183728" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="125" y1="25" x2="205" y2="95" stroke="#183728" strokeWidth="0.75" />
                <line x1="125" y1="95" x2="205" y2="25" stroke="#183728" strokeWidth="0.75" />
                <text x="125" y="120" fontFamily="Newsreader, serif" fontStyle="italic" fontSize="11" fill="#45423E">
                  “A quiet place to begin.”
                </text>
              </g>

              {/* Fountain Pen with Brass Clip */}
              <g transform="translate(375, 230) rotate(-25)">
                <rect x="0" y="0" width="12" height="110" fill="#183728" stroke="#11100F" strokeWidth="1.5" />
                <polygon points="0,0 12,0 6,-18" fill="#C5832B" stroke="#7D4F12" strokeWidth="1" />
                <rect x="2" y="20" width="8" height="40" fill="#C5832B" />
              </g>

              {/* Architectural Brass Desk Lamp */}
              <g transform="translate(110, 80)">
                <circle cx="20" cy="50" r="16" fill="#45423E" stroke="#1A1918" strokeWidth="2" />
                {/* Lamp Arm */}
                <path d="M 20 50 L 35 15 L 70 25" fill="none" stroke="#C5832B" strokeWidth="4" strokeLinecap="round" />
                {/* Green Metal Lamp Shade */}
                <path d="M 55 20 L 95 35 L 85 55 L 45 40 Z" fill="#183728" stroke="#0D2016" strokeWidth="2" />
                {/* Warm Bulb Glow */}
                <circle cx="85" cy="48" r="8" fill="#FFF4D0" />
              </g>

              {/* Ceramic Mug with Herbal Tea */}
              <g transform="translate(430, 140)">
                <circle cx="20" cy="20" r="18" fill="#FAF8F5" stroke="#1A1918" strokeWidth="2" />
                <circle cx="20" cy="20" r="14" fill="#6B4412" />
                <path d="M 38 12 C 45 15, 45 25, 38 28" fill="none" stroke="#1A1918" strokeWidth="2" />
              </g>

              {/* Architectural Scale Ruler */}
              <g transform="translate(70, 340)">
                <rect x="0" y="0" width="180" height="16" fill="#F4EFE6" stroke="#1A1918" strokeWidth="1" />
                {[...Array(18)].map((_, i) => (
                  <line
                    key={i}
                    x1={i * 10}
                    y1="0"
                    x2={i * 10}
                    y2={i % 5 === 0 ? "10" : "5"}
                    stroke="#1A1918"
                    strokeWidth="0.75"
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* LAYER 2: Architectural Top-Down Sanctuary Floor Plan (Elevates and scales into view) */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              opacity: roomOpacity,
              transform: `scale(${roomScale}) translate3d(0, 0, 0)`,
              willChange: "transform, opacity",
              pointerEvents: roomOpacity < 0.1 ? "none" : "auto",
            }}
            aria-hidden={roomOpacity < 0.1}
          >
            <svg
              viewBox="0 0 700 480"
              className="w-full max-w-3xl h-auto drop-shadow-md select-none"
              aria-label="Top down architectural plan of Sanctuary study room with desk highlighted"
            >
              {/* Outer Room Walls */}
              <rect
                x="30"
                y="30"
                width="640"
                height="420"
                fill="#FAF8F5"
                stroke="#1A1918"
                strokeWidth="4"
              />

              {/* Interior Zones / Acoustic Partitions */}
              {/* North Skylight Gallery (Top) */}
              <rect x="40" y="40" width="620" height="30" fill="#F4EFE6" stroke="#DDD3C1" strokeWidth="1" />
              <text x="350" y="60" textAnchor="middle" fill="#706B64" fontSize="10" fontFamily="sans-serif" letterSpacing="0.2em">
                NORTH SKYLIGHT APERTURE • DIFFUSED 2700K ILLUMINATION
              </text>

              {/* Quiet Zone Dividers */}
              <line x1="450" y1="70" x2="450" y2="440" stroke="#1A1918" strokeWidth="2" strokeDasharray="8 4" />
              <text x="550" y="95" textAnchor="middle" fill="#45423E" fontSize="11" fontFamily="Newsreader, serif">
                Reference Stacks
              </text>

              {/* Bookcase Rows on Right */}
              {[...Array(5)].map((_, i) => (
                <rect
                  key={i}
                  x="480"
                  y={120 + i * 55}
                  width="140"
                  height="25"
                  fill="#EAE3D5"
                  stroke="#2E2C29"
                  strokeWidth="1.5"
                />
              ))}

              {/* Workstations Grid (North Gallery) */}
              {/* Row 1 Desks */}
              <rect x="70" y="100" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="115" y="132" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 01</text>

              <rect x="190" y="100" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="235" y="132" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 02</text>

              <rect x="310" y="100" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="355" y="132" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 03</text>

              {/* Row 2 Desks (DESK 04 IS HIGHLIGHTED WHERE THE DESK LAMP FOCUS CONVERGES) */}
              <g id="highlighted-desk-04">
                {/* Spotlight Ambient Field from Desk Lamp */}
                <ellipse
                  cx="115"
                  cy="235"
                  rx={spotlightRadius * 0.45}
                  ry={spotlightRadius * 0.35}
                  fill="#FFF3D4"
                  opacity={0.7}
                />
                {/* Active Highlight Desk */}
                <rect
                  x="70"
                  y="205"
                  width="95"
                  height="60"
                  fill="#183728"
                  stroke="#0D2016"
                  strokeWidth="3"
                />
                <text
                  x="117"
                  y="238"
                  textAnchor="middle"
                  fill="#FAF8F5"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  DESK 04
                </text>
                <text
                  x="117"
                  y="252"
                  textAnchor="middle"
                  fill="#FDF2E2"
                  fontSize="8"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  YOUR SEAT
                </text>
                {/* Chair Indicator */}
                <circle cx="117" cy="285" r="14" fill="#C5832B" stroke="#1A1918" strokeWidth="1.5" />
              </g>

              {/* Additional Quiet Desks */}
              <rect x="190" y="205" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="235" y="238" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 05</text>

              <rect x="310" y="205" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="355" y="238" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 06</text>

              {/* Row 3 Focus Alcove Desks */}
              <rect x="70" y="315" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="115" y="348" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 07</text>

              <rect x="190" y="315" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="235" y="348" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 08</text>

              <rect x="310" y="315" width="90" height="55" fill="#FAF8F5" stroke="#45423E" strokeWidth="1.5" />
              <text x="355" y="348" textAnchor="middle" fill="#706B64" fontSize="9" fontFamily="monospace">DESK 09</text>

              {/* Courtyard Loggia Entry */}
              <path d="M 30 400 L 70 400" stroke="#183728" strokeWidth="3" />
              <text x="50" y="425" textAnchor="middle" fill="#183728" fontSize="8" fontFamily="sans-serif">
                COURTYARD LOGGIA
              </text>
            </svg>
          </div>

          {/* Availability Non-Deception Disclaimer */}
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-ivory-100/90 border border-ivory-300 text-[10px] font-sans text-charcoal-500">
            *Architectural schematic representation. Live seat allocation finalized during booking.
          </div>
        </div>

        {/* Bottom Persistent Action Bar */}
        <div className="max-w-xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-20 pt-2">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 block">
              Workstation 04 Ready
            </span>
            <span className="text-xs text-charcoal-700 font-sans">
              Oak Workstation • North Pier • 24/7 Biometric Access
            </span>
          </div>

          <Link
            href="/book?seat=desk-04"
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] flex items-center justify-center gap-2 bg-forest-900 text-ivory-50 text-xs uppercase tracking-widest font-medium hover:bg-forest-800 active:bg-forest-950 border border-forest-900 shadow-editorial transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
          >
            <span>Reserve Desk 04</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
