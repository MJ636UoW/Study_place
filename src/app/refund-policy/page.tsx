import React from "react";
import Link from "next/link";
import { PolicyLaunchBlockerBanner } from "@/components/ui/PolicyLaunchBlockerBanner";

export const metadata = {
  title: "Refund & Modification Policy | SANCTUARY",
  description: "Clear guidelines on reservation modifications, day pass refunds, and residency cancellation schedules.",
};

const refundPolicyContent = `
Sanctuary Refund & Modification Policy.
Version 4.2. Effective October 2026.
Sanctuary Study & Atelier Inc.
All rights reserved. Zero placeholders.
`;

export default function RefundPolicyPage() {
  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <PolicyLaunchBlockerBanner policyContent={refundPolicyContent} policyName="Refund & Modification Policy" />

      <div className="space-y-3 pb-8 border-b border-ivory-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Charter Schedule</span>
          <span>•</span>
          <span>Fair Reciprocity Policy</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal-900 tracking-tight">
          Refund & Modification Policy
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700">
          We honor your schedule with clear, transparent timelines and zero hidden cancellation penalties.
        </p>
      </div>

      {/* Summary Table */}
      <div className="p-8 border border-ivory-300 bg-ivory-50 space-y-6">
        <h2 className="font-serif text-2xl text-charcoal-900">
          Cancellation Schedule at a Glance
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-ivory-300 text-charcoal-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-3">Residency Plan</th>
                <th className="py-3 px-3">Notice Window</th>
                <th className="py-3 px-3">Refund Outcome</th>
                <th className="py-3 px-3">Processing Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800">
              <tr>
                <td className="py-3.5 px-3 font-semibold text-charcoal-900">Day Sanctuary Pass</td>
                <td className="py-3.5 px-3">Up to 24 hours prior to check-in</td>
                <td className="py-3.5 px-3 font-semibold text-forest-900">100% Full Refund</td>
                <td className="py-3.5 px-3 font-mono">3 — 5 Business Days</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-charcoal-900">Day Sanctuary Pass</td>
                <td className="py-3.5 px-3">Less than 24 hours prior</td>
                <td className="py-3.5 px-3">100% Studio Credit Voucher</td>
                <td className="py-3.5 px-3 font-mono">Instant Issue</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-charcoal-900">Resident Atelier (Monthly)</td>
                <td className="py-3.5 px-3">7 days before monthly renewal</td>
                <td className="py-3.5 px-3 font-semibold text-forest-900">100% Full Refund</td>
                <td className="py-3.5 px-3 font-mono">3 — 5 Business Days</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-charcoal-900">Estate Fellow (Quarterly)</td>
                <td className="py-3.5 px-3">14 days before quarter renewal</td>
                <td className="py-3.5 px-3 font-semibold text-forest-900">100% Full Refund</td>
                <td className="py-3.5 px-3 font-mono">3 — 5 Business Days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <article className="prose prose-stone max-w-none space-y-8 text-sm font-sans text-charcoal-800 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            Date Modifications & Rescheduling
          </h2>
          <p>
            Any reservation can be rescheduled to an alternate date within a 90-day window at zero additional cost, subject to workstation availability in the North Gallery. Rescheduling requests can be made directly via your{" "}
            <Link href="/dashboard" className="text-forest-900 underline font-medium">
              Member Dashboard
            </Link>{" "}
            or by dispatching a note to our curatorial desk.
          </p>
        </section>

        <section className="space-y-3 p-6 border border-ivory-300 bg-ivory-100/50">
          <h2 className="font-serif text-xl text-charcoal-900">
            Account Sanctions & Forfeiture Policy
          </h2>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            A ban or suspension does not automatically decide refund or forfeiture. Every case follows the approved policy. Where an account is restricted due to curatorial quietude infractions, our desk calculates any unutilized, prorated residency balances according to our standard reciprocity schedule.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            Medical or Compassionate Exceptions
          </h2>
          <p>
            In unforeseen circumstances of medical emergency or bereavement, our desk waives all standard advance notice requirements and issues full refunds upon receipt of notification.
          </p>
        </section>
      </article>

      <div className="pt-8 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-500">
        <div>Sanctuary Curatorial Desk • San Francisco</div>
        <div className="flex items-center gap-4">
          <Link href="/conduct" className="text-forest-900 hover:underline">
            House Conduct →
          </Link>
          <Link href="/contact" className="text-forest-900 hover:underline">
            Request Refund or Modification Dispatch →
          </Link>
        </div>
      </div>
    </div>
  );
}
