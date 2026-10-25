"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X, Compass, KeyRound } from "lucide-react";

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Sanctuary" },
    { href: "/plans", label: "Tiers & Plans" },
    { href: "/book", label: "Reserve Seat" },
    { href: "/reviews", label: "Reflections" },
    { href: "/contact", label: "Concierge Desk" },
    { href: "/dashboard", label: "Member Portal" },
    { href: "/admin", label: "Curator Ledger" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 transition-colors">
      {/* Top micro-bar with architectural edition note */}
      <div className="w-full bg-ivory-100/60 border-b border-ivory-200/80 px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono tracking-wider text-charcoal-500 uppercase">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 animate-pulse" aria-hidden="true" />
          <span>Central Studio & Library • Quietude Hours Observed</span>
        </span>
        <span className="hidden md:inline-block text-charcoal-400">
          Vol. IV • Architectural Solitude
        </span>
      </div>

      {/* Main navigation masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand mark */}
        <Link
          href="/"
          className="group flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2"
        >
          <span className="font-serif text-2xl sm:text-3xl tracking-tight text-charcoal-900 group-hover:text-forest-900 transition-colors flex items-center gap-2">
            <Compass className="w-6 h-6 text-forest-800" strokeWidth={1.5} />
            <span>SANCTUARY</span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-charcoal-500 -mt-0.5">
            Study & Atelier
          </span>
        </Link>

        {/* Desktop navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3.5 py-2 text-xs uppercase tracking-wider font-sans font-medium transition-colors relative min-h-[44px] flex items-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900",
                  isActive
                    ? "text-forest-900 font-semibold"
                    : "text-charcoal-700 hover:text-charcoal-950 hover:bg-ivory-100/70"
                )}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-1 left-3.5 right-3.5 h-[2px] bg-forest-900"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs uppercase tracking-wider font-medium text-charcoal-700 hover:text-charcoal-950 border border-transparent hover:border-ivory-300 min-h-[44px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/book"
            className="px-5 py-2.5 text-xs uppercase tracking-widest font-medium bg-forest-900 text-ivory-50 hover:bg-forest-800 active:bg-forest-950 border border-forest-900 shadow-editorial min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 transition-all"
          >
            Find My Seat
          </Link>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close main navigation menu" : "Open main navigation menu"}
          className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal-800 hover:text-charcoal-950 hover:bg-ivory-100 border border-ivory-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ivory-200 bg-ivory-50/98 backdrop-blur-md px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] uppercase font-mono tracking-widest text-amber-700 pb-1 border-b border-ivory-200">
            Navigation Index
          </div>
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-4 py-3 min-h-[44px] flex items-center justify-between text-sm uppercase tracking-wider font-sans border-b border-ivory-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900",
                    isActive
                      ? "text-forest-900 font-semibold bg-forest-50/60"
                      : "text-charcoal-800 hover:text-charcoal-950 hover:bg-ivory-100/80"
                  )}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-ivory-200 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="px-4 py-3 min-h-[44px] flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-medium text-charcoal-800 border border-charcoal-300 hover:bg-ivory-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
            >
              <KeyRound className="w-4 h-4 text-charcoal-500" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/book"
              className="px-4 py-3 min-h-[44px] flex items-center justify-center text-xs uppercase tracking-widest font-medium bg-forest-900 text-ivory-50 hover:bg-forest-800 border border-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
            >
              Find My Seat
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
