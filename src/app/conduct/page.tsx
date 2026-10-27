import React from "react";
import Link from "next/link";
import { PolicyLaunchBlockerBanner } from "@/components/ui/PolicyLaunchBlockerBanner";

export const metadata = {
  title: "House Rules & Code of Quietude | SANCTUARY",
  description: "Acoustic disciplines, workstation etiquette, and community covenants governing daily residency at Sanctuary.",
};

const conductContent = `
Sanctuary House Rules and Code of Quietude.
Version 4.2. Effective October 2026.
Sanctuary Study & Atelier Inc.
All rights reserved. Zero placeholders.
`;

export default function ConductPage() {
  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <PolicyLaunchBlockerBanner policyContent={conductContent} policyName="Code of Quietude" />

      {/* Masthead */}
      <div className="space-y-3 pb-8 border-b border-ivory-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Charter Schedule 01</span>
          <span>•</span>
          <span>Acoustic & House Standards</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal-900 tracking-tight">
          House Rules & Quietude Covenant
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700">
          “Quietude is not the mere absence of sound, but the deliberate protection of cognitive freedom.”
        </p>
      </div>

      {/* Main Articles */}
      <article className="prose prose-stone max-w-none space-y-8 text-sm font-sans text-charcoal-800 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            I. Acoustic Disciplines & Zone Demarcation
          </h2>
          <p>
            Sanctuary enforces strict acoustic thresholds calibrated to preserve library-grade mental absorption:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-charcoal-700">
            <li>
              <strong>Main Reading Room & North Gallery (Silent Zones):</strong> Ambient sound must remain below 38 dBA. Audible phone conversations, video conferences, whispered consultations, and audible typing on clicky mechanical switches are prohibited.
            </li>
            <li>
              <strong>Decoupled Phone Salons:</strong> All telephone, video, and collaborative voice discussions must occur inside sound-dampened phone salons. Sessions in salons are limited to 45 consecutive minutes to ensure fair fellowship access.
            </li>
            <li>
              <strong>Courtyard Loggia & Kitchen Mews:</strong> Quiet conversation at moderate library volume is welcomed in designated loggia areas.
            </li>
          </ul>
        </section>

        <section className="space-y-3 p-6 border border-ivory-300 bg-ivory-100/50">
          <h2 className="font-serif text-xl text-charcoal-900">
            II. Workstation Stewardship & Joinery Care
          </h2>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            Workstations are crafted from handcrafted solid timber with organic botanical oil finishes. Members are custodians of this furniture:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-700">
            <li>Always utilize provided leather desk blotters beneath hot beverage vessels.</li>
            <li>No adhesive tapes, sticky notes with solvent adhesives, or chemical sprays may touch bare timber surfaces.</li>
            <li>Desks must be cleared of personal effects at the conclusion of each day session, unless assigned an ongoing permanent Resident Atelier or Estate Fellow key.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            III. Keycard & Access Security
          </h2>
          <p>
            Keycards, biometric PIN hashes, and brass cedar locker keys are issued strictly for the named member. Lending credentials to non-members compromises security and results in immediate access suspension.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            IV. Membership Renewals, Suspensions & Bans
          </h2>
          <div className="p-4 border-l-4 border-amber-700 bg-amber-50/50 space-y-2 text-xs text-charcoal-800">
            <p className="font-semibold text-charcoal-900">
              Renewal Policy Notice:
            </p>
            <p>
              Renewal is neither automatic nor guaranteed. Submitting a renewal creates a fresh request subject to desk availability, curatorial intake review, and prior adherence to house covenants.
            </p>
            <p className="font-semibold text-charcoal-900 pt-2">
              Sanctions & Forfeiture Policy:
            </p>
            <p>
              A temporary suspension or permanent account ban does not automatically decide refund or forfeiture. Every case follows the approved policy, with affected bookings and prorated balances reviewed by the curatorial desk.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            V. Guest Pass Regulations
          </h2>
          <p>
            Resident Atelier and Estate Fellows are granted monthly guest pass allotments. Guests must be pre-registered with the concierge at least 2 hours prior to arrival and agree in writing to the Silence Covenant before building ingress.
          </p>
        </section>
      </article>

      <div className="pt-8 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-500">
        <div>Sanctuary Governance Board • Certified Zero Unfinished Blockers</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-forest-900 hover:underline">
            Terms of Sanctuary →
          </Link>
          <Link href="/refund-policy" className="text-forest-900 hover:underline">
            Refund Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
