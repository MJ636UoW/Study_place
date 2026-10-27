import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { plansFixture } from "@/fixtures";

export const metadata = {
  title: "Residency Plans & Cadences | SANCTUARY",
  description: "Explore our Day Sanctuary, Resident Atelier, and Estate Fellow membership tiers.",
};

export default function PlansPage() {
  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Residency Intake</span>
          <span>•</span>
          <span>Cadences & Tiers</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl text-charcoal-900 tracking-tight">
          Choose Your Rhythm of Focus.
        </h1>
        <p className="font-serif italic text-lg sm:text-xl text-charcoal-700 leading-relaxed">
          From a solitary single-day deep immersion to dedicated year-round residency with private lockers and 24/7 keycard access.
        </p>
      </div>

      {/* Main Tiers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plansFixture.map((plan) => (
          <div
            key={plan.id}
            className={`p-8 border flex flex-col justify-between ${
              plan.highlighted
                ? "border-forest-900 bg-ivory-50 shadow-editorial-md relative"
                : "border-ivory-300 bg-ivory-100/40"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-forest-900 text-ivory-50 text-[10px] uppercase font-mono tracking-widest">
                Recommended Resident Tier
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
                <h2 className="font-serif text-3xl text-charcoal-900">{plan.name}</h2>
                <p className="text-xs text-charcoal-600 font-sans mt-2 leading-relaxed">
                  {plan.tagline}
                </p>
              </div>

              <div className="py-4 border-y border-ivory-200 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold text-charcoal-900">
                  ₹{plan.price}
                </span>
                <span className="text-xs font-mono uppercase text-charcoal-500">
                  / {plan.cadence}
                </span>
              </div>

              {/* Inclusions */}
              <div className="space-y-3 text-xs text-charcoal-700 font-sans">
                <div className="text-[10px] uppercase font-mono text-charcoal-500 tracking-wider">
                  Tier Privileges
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
                className={`w-full py-3.5 min-h-[44px] flex items-center justify-center text-xs uppercase tracking-widest font-semibold border transition-all ${
                  plan.highlighted
                    ? "bg-forest-900 text-ivory-50 border-forest-900 hover:bg-forest-800"
                    : "bg-transparent text-charcoal-900 border-charcoal-700 hover:bg-ivory-200"
                }`}
              >
                Reserve {plan.name}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="p-8 border border-ivory-300 bg-ivory-50 space-y-6">
        <h3 className="font-serif text-2xl text-charcoal-900">
          Privilege Comparison Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-ivory-300 text-charcoal-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Amenity / Benefit</th>
                <th className="py-3 px-4">Day Sanctuary</th>
                <th className="py-3 px-4">Resident Atelier</th>
                <th className="py-3 px-4">Estate Fellow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800">
              <tr>
                <td className="py-3.5 px-4 font-medium">Access Window</td>
                <td className="py-3.5 px-4">07:30 — 22:00</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">24/7 Keycard</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">24/7 Keycard</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Workstation Allocation</td>
                <td className="py-3.5 px-4">Daily Reserved Desk</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">Permanent Assigned Desk</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">Priority Dual Studio Desk</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Cedar Locker & Brass Key</td>
                <td className="py-3.5 px-4 text-charcoal-400">—</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">Included</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">Included + Archival Drawer</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Meeting Salon Allocation</td>
                <td className="py-3.5 px-4">A la carte booking</td>
                <td className="py-3.5 px-4">8 Hours / Month</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">Unlimited Priority</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Guest Passes</td>
                <td className="py-3.5 px-4 text-charcoal-400">0</td>
                <td className="py-3.5 px-4">4 Passes / Month</td>
                <td className="py-3.5 px-4">12 Passes / Quarter</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Postal & Courier Delivery</td>
                <td className="py-3.5 px-4 text-charcoal-400">—</td>
                <td className="py-3.5 px-4">Included</td>
                <td className="py-3.5 px-4">Included with Dispatch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
