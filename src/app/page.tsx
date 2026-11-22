import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Wifi,
  Sparkles,
  Award,
} from "lucide-react";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { faqsFixture } from "@/fixtures";

export const metadata = {
  title: "Elite Study Zone • Premium Study Hall & Workstations in Ghatkopar West",
  description:
    "Book your workstation seat at Elite Study Zone in Ghatkopar West, Mumbai. Hourly flex passes at ₹49/hr, 24/7 smart keypad door access, high-speed Wi-Fi & quiet study sanctuary.",
};

export default function HomePage() {
  return (
    <div className="w-full bg-white">
      {/* =========================================================================
          TOP BANNER: Location, Pricing & Keypad Access Highlight
          ========================================================================= */}
      <div className="bg-forest-950 text-forest-200 text-xs py-2 px-4 text-center font-mono border-b border-forest-800 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>📍 Amrut Nagar, Ghatkopar West &bull; 24/7 Smart Keypad Access &bull; Flexible Passes from ₹49/hr</span>
      </div>

      {/* =========================================================================
          HERO SECTION: Simple, Welcoming, Direct "Book Your Workstation Seat"
          ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-ivory-200 bg-gradient-to-b from-ivory-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-forest-50 border border-forest-200 text-[11px] font-mono uppercase tracking-widest text-forest-800 font-bold rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            <span>Welcome to Elite Study Zone</span>
          </div>

          {/* Clean Primary Headline */}
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-charcoal-900 tracking-tight leading-[1.18]">
            Your Space for Focus, Productivity & Success.
          </h1>

          {/* Simple, Welcoming Message */}
          <p className="text-sm sm:text-base text-charcoal-700 font-sans max-w-2xl mx-auto leading-relaxed">
            A peaceful, fully air-conditioned, distraction-free sanctuary designed for serious aspirants, students, and professionals in <strong>Ghatkopar West, Mumbai</strong>. Equipped with 24/7 smart keypad door access, superfast dual fiber Wi-Fi, and individual ergonomic workstations.
          </p>

          {/* PRIMARY CALL-TO-ACTION BUTTONS */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/login?redirect=/book"
              className="w-full sm:w-auto px-8 py-4 bg-forest-700 text-white text-xs sm:text-sm uppercase tracking-widest font-extrabold hover:bg-forest-600 active:bg-forest-800 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 min-h-[50px] border border-forest-800"
            >
              <span>Book Your Workstation Seat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://api.whatsapp.com/send?phone=919324689280&text=Hello%20Elite%20Study%20Zone,%20I%20would%20like%20to%20inquire%20about%20booking%20a%20workstation%20seat."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 bg-white text-charcoal-900 text-xs sm:text-sm uppercase tracking-wider font-bold hover:bg-forest-50 border border-charcoal-300 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[50px]"
            >
              <span>💬 WhatsApp Enquiry</span>
            </a>
          </div>

          {/* Quick Verified Highlights (Clean mobile pills) */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <div className="font-bold text-base text-forest-700 font-mono">₹49 / hr</div>
              <div className="text-[11px] text-charcoal-600 font-medium mt-0.5">Hourly Flexi Pass</div>
            </div>

            <div className="p-3.5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <div className="font-bold text-base text-charcoal-900 font-mono">24/7 Access</div>
              <div className="text-[11px] text-charcoal-600 font-medium mt-0.5">Keypad PIN & Exit Button</div>
            </div>

            <div className="p-3.5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <div className="font-bold text-base text-charcoal-900 font-mono">5G Dual Wi-Fi</div>
              <div className="text-[11px] text-charcoal-600 font-medium mt-0.5">Optical Fiber Redundancy</div>
            </div>

            <div className="p-3.5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <div className="font-bold text-base text-charcoal-900 font-mono">Silent AC Hall</div>
              <div className="text-[11px] text-charcoal-600 font-medium mt-0.5">Acoustic Focus Zone</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY PLANS & RATES (Compact, straightforward comparison)
          ========================================================================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-ivory-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-charcoal-900">
              Simple, Transparent Plans
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600 max-w-lg mx-auto">
              No hidden admission fees. Instant 6-digit door keypad access upon booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hourly Card */}
            <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-sm hover:border-forest-400 transition-all space-y-4">
              <div className="inline-block px-2.5 py-1 bg-forest-50 text-forest-800 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Hourly Flex
              </div>
              <div>
                <div className="text-3xl font-extrabold text-charcoal-900 font-sans">
                  ₹49 <span className="text-xs font-normal text-charcoal-500 font-mono">/ hour</span>
                </div>
                <div className="text-xs text-charcoal-600 mt-1">
                  Custom 1h, 3h, 6h, or 8h flexible study blocks
                </div>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-2 pt-2 border-t border-ivory-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Choose custom start time</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Instant door PIN sent to WhatsApp & Email</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Power socket & high-speed Wi-Fi</span>
                </li>
              </ul>
              <Link
                href="/login?redirect=/book"
                className="w-full py-2.5 bg-forest-50 text-forest-800 text-xs font-bold uppercase tracking-wider rounded-md border border-forest-200 hover:bg-forest-700 hover:text-white transition-all text-center block"
              >
                Book Hourly Slot
              </Link>
            </div>

            {/* Daily Card */}
            <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-sm hover:border-forest-400 transition-all space-y-4">
              <div className="inline-block px-2.5 py-1 bg-forest-50 text-forest-800 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Day Pass
              </div>
              <div>
                <div className="text-3xl font-extrabold text-charcoal-900 font-sans">
                  ₹249 <span className="text-xs font-normal text-charcoal-500 font-mono">/ full day</span>
                </div>
                <div className="text-xs text-charcoal-600 mt-1">
                  Full 16 hours (07:00 AM – 11:00 PM)
                </div>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-2 pt-2 border-t border-ivory-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Full-day access from morning to night</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>In-and-out keypad entry privileges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Drinking water, clean washrooms & AC</span>
                </li>
              </ul>
              <Link
                href="/login?redirect=/book"
                className="w-full py-2.5 bg-forest-50 text-forest-800 text-xs font-bold uppercase tracking-wider rounded-md border border-forest-200 hover:bg-forest-700 hover:text-white transition-all text-center block"
              >
                Book Day Pass
              </Link>
            </div>

            {/* Monthly Card (Highlighted) */}
            <div className="p-6 bg-forest-950 text-white border-2 border-forest-600 rounded-xl shadow-md space-y-4 relative">
              <div className="inline-block px-2.5 py-1 bg-forest-700 text-forest-100 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                ⭐ Most Popular &bull; Monthly
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-sans">
                  ₹2,499 <span className="text-xs font-normal text-forest-300 font-mono">/ month</span>
                </div>
                <div className="text-xs text-forest-300 mt-1">
                  Dedicated personal desk &bull; 24/7 unlimited access
                </div>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 pt-2 border-t border-forest-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permanent dedicated workstation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>24/7 round-the-clock keypad access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Personal locked cabinet / locker</span>
                </li>
              </ul>
              <Link
                href="/login?redirect=/book"
                className="w-full py-2.5 bg-forest-500 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-forest-400 transition-all text-center block"
              >
                Reserve Dedicated Desk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW TO ENTER & LOCATION (Zero biometric confusion)
          ========================================================================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-ivory-50/60 border-b border-ivory-200">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Access Procedure */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-forest-700 font-bold">
              Seamless 24/7 Access
            </span>
            <h2 className="font-sans font-bold text-2xl text-charcoal-900">
              Smart Keypad Door Access (Zero Biometric Hassle)
            </h2>
            <div className="space-y-3 text-xs text-charcoal-700">
              <div className="p-3.5 bg-white border border-ivory-300 rounded-lg">
                <div className="font-bold text-charcoal-900 mb-0.5">🚪 To Enter:</div>
                Type your 6-digit PIN (e.g. <strong>#XXXXXX</strong>) on the digital keypad outside. The LED turns green and the door unlocks immediately.
              </div>
              <div className="p-3.5 bg-white border border-ivory-300 rounded-lg">
                <div className="font-bold text-charcoal-900 mb-0.5">🚪 To Exit:</div>
                Simply press the green push-to-exit button inside next to the door. Quick, hygienic, and zero fingerprint scanning.
              </div>
            </div>
          </div>

          {/* Right: Location & Address */}
          <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-lg text-charcoal-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-forest-700" />
              Center Location
            </h3>
            <p className="text-xs text-charcoal-700 leading-relaxed">
              <strong>Elite Study Zone</strong><br />
              Amrut Nagar, Near Shreyas Cinema, LBS Marg,<br />
              Ghatkopar West, Mumbai, Maharashtra 400086.
            </p>
            <div className="text-xs text-charcoal-600 space-y-1 pt-2 border-t border-ivory-200 font-mono">
              <div>⏰ Open Hours: 07:00 AM – 11:00 PM (24/7 for dedicated members)</div>
              <div>📞 Helpline / WhatsApp: +91 93246 89280 / +91 99878 18182</div>
            </div>
            <div className="pt-2 flex gap-3">
              <a
                href="https://maps.google.com/?q=Amrut+Nagar+Ghatkopar+West+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-forest-50 border border-forest-300 text-forest-800 text-xs font-bold rounded-md hover:bg-forest-100 transition-colors"
              >
                Open Google Maps &rarr;
              </a>
              <Link
                href="/about"
                className="px-4 py-2 text-charcoal-700 text-xs font-bold hover:text-forest-700 transition-colors flex items-center"
              >
                Read About Us &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION: Common Student Questions
          ========================================================================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-ivory-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-sans font-bold text-2xl text-charcoal-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-charcoal-600">
              Have questions about booking, timings, or door access?
            </p>
          </div>
          <FaqAccordion items={faqsFixture.slice(0, 5)} />
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION: Direct Book Button
          ========================================================================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-forest-950 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="font-sans font-bold text-2xl sm:text-3xl text-white">
            Ready to Focus and Make Every Hour Count?
          </h2>
          <p className="text-xs sm:text-sm text-forest-200 leading-relaxed">
            Reserve your quiet workstation in Ghatkopar West today. Immediate door keypad PIN sent directly to your email and WhatsApp upon booking.
          </p>
          <div className="pt-2">
            <Link
              href="/login?redirect=/book"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-forest-500 text-white text-xs uppercase tracking-widest font-extrabold hover:bg-forest-400 rounded-lg shadow-lg transition-all"
            >
              <span>Book Your Workstation Seat Now &rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
