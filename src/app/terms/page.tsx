import React from "react";
import Link from "next/link";
import { PolicyLaunchBlockerBanner } from "@/components/ui/PolicyLaunchBlockerBanner";

export const metadata = {
  title: "Terms of Sanctuary | SANCTUARY",
  description: "Operating covenant, quietude rules, and workspace use terms.",
};

const termsContent = `
Terms of Sanctuary.
Version 4.2. Effective October 2026.
Sanctuary Study & Atelier Inc.
All rights reserved. Zero placeholders.
`;

export default function TermsPage() {
  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <PolicyLaunchBlockerBanner policyContent={termsContent} policyName="Terms of Sanctuary" />

      <div className="space-y-3 pb-8 border-b border-ivory-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Operating Covenant</span>
          <span>•</span>
          <span>Version 4.2</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal-900 tracking-tight">
          Terms of Sanctuary
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700">
          The mutual covenants governing admission, quietude, and custodial care.
        </p>
      </div>

      <article className="prose prose-stone max-w-none space-y-8 text-sm font-sans text-charcoal-800 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            1. The Silence Covenant
          </h2>
          <p>
            Entry into Sanctuary constitutes acceptance of our strict acoustic standards. The Main Reading Room and North Gallery are zero-conversation zones. Telephone conversations, group meetings, and video calls are strictly prohibited outside designated decoupled phone salons.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            2. Workstation Care & Joinery
          </h2>
          <p>
            Workstations are solid timber finished with non-toxic botanical oils. Members agree to utilize desk blotters for hot drink containers and refrain from writing directly upon unfinished wood surfaces.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            3. Keycard Transfer Prohibitions
          </h2>
          <p>
            Keycards, biometric PIN credentials, and brass cedar locker keys are issued strictly to the registered fellow and may not be lent or transferred to non-members without prior concierge registration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            4. Curatorial Revocation
          </h2>
          <p>
            To protect the collective focus of our fellows, Sanctuary reserves the right to suspend or terminate membership with pro-rated refund in the event of persistent acoustic disruption or violation of house quietude rules.
          </p>
        </section>

        <section className="space-y-3 p-6 border border-ivory-300 bg-ivory-100/50">
          <h2 className="font-serif text-xl text-charcoal-900">
            5. Renewal Invariant
          </h2>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            Renewal is neither automatic nor guaranteed. Submitting a renewal request creates a fresh reservation request subject to desk availability, curatorial intake review, and prior acoustic compliance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            6. Suspensions, Account Bans & Refund Policy
          </h2>
          <p>
            A temporary suspension or permanent account ban does not automatically decide refund or forfeiture. Every case follows the approved policy, with affected bookings and prorated balances reviewed by the curatorial desk.
          </p>
        </section>
      </article>

      <div className="pt-8 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-500">
        <div>Sanctuary Study Space • Kandivali, Mumbai</div>
        <div className="flex items-center gap-4">
          <Link href="/conduct" className="text-forest-900 hover:underline">
            House Rules & Conduct →
          </Link>
          <Link href="/refund-policy" className="text-forest-900 hover:underline">
            Refund & Cancellation Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
