import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { locationFixture } from "@/fixtures";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-ivory-100 border-t border-ivory-200 text-charcoal-800">
      {/* Top architectural statement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-ivory-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand Manifesto */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-forest-800" strokeWidth={1.5} />
              <span className="font-serif text-2xl tracking-tight text-charcoal-900">SANCTUARY</span>
            </div>
            <p className="font-serif text-lg text-charcoal-800 leading-snug italic max-w-md">
              “From distraction to focus. A sanctuary crafted for the unhurried pursuit of deep work, rigorous study, and lasting ideas.”
            </p>
            <p className="text-xs text-charcoal-600 font-sans leading-relaxed max-w-md">
              Designed with library-grade acoustics, honest solid timber, filtered air, and an uncompromising quietude charter.
            </p>
          </div>

          {/* Directory Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-sans">
            {/* Column 1: Residency & Booking */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Sanctuary Tiers
              </div>
              <ul className="space-y-1">
                <li>
                  <Link href="/plans" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-2 inline-flex items-center min-h-[44px]">
                    Residency Plans
                  </Link>
                </li>
                <li>
                  <Link href="/book" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-2 inline-flex items-center min-h-[44px]">
                    Reserve a Desk
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-2 inline-flex items-center min-h-[44px]">
                    Member Portal
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-2 inline-flex items-center min-h-[44px]">
                    Curator Ledger
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal & Charters */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Charters & Policies
              </div>
              <ul className="space-y-1">
                <li>
                  <Link href="/privacy" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    Terms of Sanctuary
                  </Link>
                </li>
                <li>
                  <Link href="/conduct" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    House Rules & Conduct
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    Refund & Modification
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    Member Reflections
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-charcoal-700 hover:text-charcoal-950 transition-colors py-1.5 inline-flex items-center min-h-[44px]">
                    Concierge Inquiry
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: The Desk */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
                Studio Address
              </div>
              <address className="not-italic text-charcoal-700 space-y-1 text-xs">
                <div>{locationFixture.name}</div>
                <div>{locationFixture.addressLine1}</div>
                <div>{locationFixture.addressLine2}</div>
                <div>{locationFixture.city}, {locationFixture.statePostal}</div>
                <div className="pt-2 text-forest-900 font-medium">{locationFixture.conciergePhone}</div>
              </address>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-500">
        <div>
          © {new Date().getFullYear()} Sanctuary Study & Atelier Inc. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span>Kandivali East, Mumbai</span>
          <span className="hidden sm:inline-block">•</span>
          <span>Silent Hours: 07:30 — 22:00</span>
        </div>
      </div>
    </footer>
  );
};
