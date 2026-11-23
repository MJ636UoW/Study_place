import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { DEFAULT_PRICING_MATRIX, SHIFTS, TENURES } from "@/lib/pricingMatrix";

export const metadata = {
  title: "All Plans & Pricing Chart • Elite Study Zone",
  description:
    "Official workstation plans and pricing chart for Elite Study Zone in Ghatkopar West, Mumbai. Hourly, Weekly, Monthly and Weekend packages.",
};

export default function PlansPage() {
  return (
    <div className="w-full bg-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* =========================================================================
          HEADER SECTION
          ========================================================================= */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800 rounded-full font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Transparent Membership Tiers</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight font-bold">
          Workstation Plans & Pricing Chart
        </h1>
        <p className="font-sans text-base sm:text-lg text-charcoal-700 leading-relaxed">
          Choose the study rhythm that fits your goals. From single-session focus sprints to continuous monthly residency with smart digital door keypad access.
        </p>
      </div>

      {/* =========================================================================
          THE OFFICIAL 5x4 PRICING MATRIX TABLE
          Strictly matching client specifications
          ========================================================================= */}
      <div className="border border-ivory-300 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="p-4 bg-forest-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-bold text-ivory-50">
              Official Center Pricing Matrix
            </h2>
            <p className="text-xs font-mono text-forest-200">
              All prices in INR (&bull; Center open 07:00 AM — 11:00 PM)
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Registration Fee: ₹0 for One Visit &bull; +₹200 for Weekly/Monthly/Weekend</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-800 text-xs font-mono uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 font-bold">Access per day</th>
                <th className="py-4 px-3 sm:px-4 text-center font-bold">Hours</th>
                <th className="py-4 px-3 sm:px-5 text-right font-bold bg-amber-50/60">One visit (INR)</th>
                <th className="py-4 px-3 sm:px-5 text-right font-bold">7 days (INR)</th>
                <th className="py-4 px-3 sm:px-5 text-right font-bold bg-forest-50/60 text-forest-900">30 days (INR)</th>
                <th className="py-4 px-3 sm:px-5 text-right font-bold">Weekend (8 days/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-sm">
              {DEFAULT_PRICING_MATRIX.map((row, idx) => {
                const shiftDef = SHIFTS.find((s) => s.id === row.shiftId);
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={row.shiftId}
                    className={`hover:bg-forest-50/30 transition-colors ${
                      isEven ? "bg-white" : "bg-ivory-50/40"
                    }`}
                  >
                    {/* Shift Name & Tag */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-serif font-bold text-base text-charcoal-900">
                        {row.shiftName}
                      </div>
                      <div className="text-xs text-charcoal-500 font-sans mt-0.5">
                        {shiftDef?.description}
                      </div>
                    </td>

                    {/* Daily Hours */}
                    <td className="py-4 px-3 sm:px-4 text-center font-mono font-bold text-forest-800">
                      <span className="px-2.5 py-1 bg-ivory-100 rounded-md border border-ivory-200 text-xs">
                        {row.hours} hrs
                      </span>
                    </td>

                    {/* One visit (INR) */}
                    <td className="py-4 px-3 sm:px-5 text-right font-mono font-bold text-charcoal-900 bg-amber-50/40">
                      <div className="text-base text-amber-900">₹{row.one_visit}</div>
                      <Link
                        href={`/book?duration=hour&shift=${row.shiftId}`}
                        className="text-[10px] text-amber-800 underline hover:text-amber-950 font-sans block mt-0.5"
                      >
                        Book Visit →
                      </Link>
                    </td>

                    {/* 7 days (INR) */}
                    <td className="py-4 px-3 sm:px-5 text-right font-mono font-bold text-charcoal-900">
                      <div className="text-base">₹{row.week}</div>
                      <Link
                        href={`/book?duration=week&shift=${row.shiftId}`}
                        className="text-[10px] text-forest-700 underline hover:text-forest-900 font-sans block mt-0.5"
                      >
                        Book 7 Days →
                      </Link>
                    </td>

                    {/* 30 days (INR) */}
                    <td className="py-4 px-3 sm:px-5 text-right font-mono font-bold text-forest-900 bg-forest-50/60">
                      <div className="text-lg text-forest-800 font-extrabold">₹{row.month}</div>
                      <Link
                        href={`/book?duration=month&shift=${row.shiftId}`}
                        className="text-[10px] text-forest-800 font-bold underline hover:text-forest-950 font-sans block mt-0.5"
                      >
                        Book 30 Days →
                      </Link>
                    </td>

                    {/* Weekend (INR) */}
                    <td className="py-4 px-3 sm:px-5 text-right font-mono font-bold text-charcoal-900">
                      <div className="text-base">₹{row.weekend}</div>
                      <Link
                        href={`/book?duration=weekend&shift=${row.shiftId}`}
                        className="text-[10px] text-forest-700 underline hover:text-forest-900 font-sans block mt-0.5"
                      >
                        Book Weekend →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footnotes */}
        <div className="p-4 bg-ivory-50 border-t border-ivory-300 text-xs font-sans text-charcoal-700 space-y-1.5">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Registration Fees:</strong> ₹0 for One-Day / One-Visit Plan. One-time ₹200 applies to Weekly, Monthly, and Weekend plans, and is permanently waived on all subsequent renewals.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Storage Lockers:</strong> Dedicated personal locker option (#01–#24) available upon checkout (₹49 for one visit, ₹99 for weekly, ₹299 for monthly/weekend).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Access & Hours:</strong> Operating daily 07:00 AM — 11:00 PM. Instant 6-digit door keypad PIN delivered via WhatsApp & Email immediately after booking.
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FOUR DEDICATED PLAN CARDS
          ========================================================================= */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900 font-bold">
          Plan Inclusions & Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hourly Plan */}
          <div className="p-6 border border-ivory-300 rounded-xl bg-ivory-50/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="inline-block px-2 py-0.5 bg-ivory-200 text-charcoal-800 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Hourly Plan
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                Hourly / One Visit
              </h3>
              <p className="text-xs text-charcoal-600 font-sans">
                Pay-as-you-go single visit for quick revision, test series, and sprint study.
              </p>
              <div className="text-2xl font-serif font-extrabold text-charcoal-900 pt-2 border-t border-ivory-200">
                Starting ₹99 <span className="text-xs font-normal text-charcoal-500 font-mono">/ 2 hrs</span>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">✓ Custom start & end time</li>
                <li className="flex items-center gap-1.5">✓ Zero registration fee</li>
                <li className="flex items-center gap-1.5">✓ Instant door keypad pass</li>
              </ul>
            </div>
            <Link
              href="/book?duration=hour"
              className="w-full py-2.5 text-center text-xs uppercase font-mono font-bold bg-charcoal-900 text-white rounded-lg hover:bg-charcoal-800 transition-colors"
            >
              Book Hourly Pass
            </Link>
          </div>

          {/* Weekly Plan */}
          <div className="p-6 border border-ivory-300 rounded-xl bg-ivory-50/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="inline-block px-2 py-0.5 bg-forest-100 text-forest-900 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Weekly Plan
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                7 Consecutive Days
              </h3>
              <p className="text-xs text-charcoal-600 font-sans">
                7 full days of dedicated workstation access during syllabus sprints and revisions.
              </p>
              <div className="text-2xl font-serif font-extrabold text-charcoal-900 pt-2 border-t border-ivory-200">
                Starting ₹549 <span className="text-xs font-normal text-charcoal-500 font-mono">/ week</span>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">✓ 7 days guaranteed access</li>
                <li className="flex items-center gap-1.5">✓ Choose 2h, 3h, 5h, 10h, or 15h</li>
                <li className="flex items-center gap-1.5">✓ Optional personal locker</li>
              </ul>
            </div>
            <Link
              href="/book?duration=week"
              className="w-full py-2.5 text-center text-xs uppercase font-mono font-bold bg-forest-800 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              Book Weekly Plan
            </Link>
          </div>

          {/* Monthly Plan */}
          <div className="p-6 border-2 border-forest-800 rounded-xl bg-forest-50/30 flex flex-col justify-between space-y-4 shadow-sm relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-forest-800 text-white text-[10px] font-mono uppercase font-bold tracking-wider rounded-full">
              Recommended
            </div>
            <div className="space-y-3">
              <span className="inline-block px-2 py-0.5 bg-forest-200 text-forest-950 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Monthly Plan
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                30 Calendar Days
              </h3>
              <p className="text-xs text-charcoal-600 font-sans">
                Your permanent daily desk, smart keypad PIN, and optimal distraction-free routine.
              </p>
              <div className="text-2xl font-serif font-extrabold text-forest-900 pt-2 border-t border-forest-200">
                Starting ₹1,349 <span className="text-xs font-normal text-charcoal-500 font-mono">/ month</span>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">✓ 30 days continuous tenure</li>
                <li className="flex items-center gap-1.5">✓ Dedicated assigned workstation</li>
                <li className="flex items-center gap-1.5">✓ Dedicated locker available</li>
              </ul>
            </div>
            <Link
              href="/book?duration=month"
              className="w-full py-2.5 text-center text-xs uppercase font-mono font-bold bg-forest-800 text-white rounded-lg hover:bg-forest-700 transition-colors shadow-md"
            >
              Book Monthly Plan
            </Link>
          </div>

          {/* Weekend Plan */}
          <div className="p-6 border border-ivory-300 rounded-xl bg-ivory-50/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono uppercase tracking-wider font-bold rounded">
                Weekend Plan
              </span>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                8 Days of Month
              </h3>
              <p className="text-xs text-charcoal-600 font-sans">
                Every Saturday & Sunday of the month tailored for working professionals and UPSC aspirants.
              </p>
              <div className="text-2xl font-serif font-extrabold text-charcoal-900 pt-2 border-t border-ivory-200">
                Starting ₹699 <span className="text-xs font-normal text-charcoal-500 font-mono">/ 8 days</span>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">✓ 8 weekend days (Sat & Sun)</li>
                <li className="flex items-center gap-1.5">✓ Working professionals favorite</li>
                <li className="flex items-center gap-1.5">✓ Optional personal locker</li>
              </ul>
            </div>
            <Link
              href="/book?duration=weekend"
              className="w-full py-2.5 text-center text-xs uppercase font-mono font-bold bg-charcoal-900 text-white rounded-lg hover:bg-charcoal-800 transition-colors"
            >
              Book Weekend Plan
            </Link>
          </div>
        </div>
      </div>

      {/* Direct CTA */}
      <div className="p-8 bg-forest-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-2xl font-bold text-ivory-50">
            Ready to Begin Your Focus Session?
          </h3>
          <p className="text-xs font-sans text-forest-200">
            Select your preferred workstation on our interactive floor map and activate your door keypad code instantly.
          </p>
        </div>
        <Link
          href="/book"
          className="px-8 py-4 bg-emerald-500 text-charcoal-950 text-xs uppercase tracking-widest font-extrabold hover:bg-emerald-400 rounded-lg shadow-lg transition-all whitespace-nowrap flex items-center gap-2"
        >
          <span>Reserve Workstation Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
