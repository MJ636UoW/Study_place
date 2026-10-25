import React from "react";
import Link from "next/link";
import { PolicyLaunchBlockerBanner } from "@/components/ui/PolicyLaunchBlockerBanner";

export const metadata = {
  title: "Privacy Charter & Data Stewardship | SANCTUARY",
  description: "Our principles regarding physical privacy, electronic access, and zero data monetization.",
};

const privacyContent = `
Sanctuary Privacy Charter & Data Stewardship.
Version 4.2. Effective October 2026.
Sanctuary Study & Atelier Inc.
All rights reserved. Zero placeholders.
`;

export default function PrivacyPage() {
  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <PolicyLaunchBlockerBanner policyContent={privacyContent} policyName="Privacy Charter" />

      {/* Masthead */}
      <div className="space-y-3 pb-8 border-b border-ivory-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Charter No. 04</span>
          <span>•</span>
          <span>Effective October 2026</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal-900 tracking-tight">
          Privacy & Data Stewardship
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700">
          “Physical solitude requires uncompromising digital dignity.”
        </p>
      </div>

      {/* Main Editorial Policy Body */}
      <article className="prose prose-stone max-w-none space-y-8 text-sm font-sans text-charcoal-800 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            I. The Core Solitude Principle
          </h2>
          <p>
            Sanctuary Study & Atelier was created as a physical counterweight to intrusive, surveillance-driven technology. We do not monetize member behavior, track session dwell times for behavioral advertising, or resell reservation analytics to external brokers.
          </p>
        </section>

        <section className="space-y-3 p-6 border border-ivory-300 bg-ivory-100/50">
          <h2 className="font-serif text-xl text-charcoal-900">
            II. Information We Collect Solely for Physical Access
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-700">
            <li><strong>Biometric & Keycard Identity:</strong> Mathematical hash templates strictly for building ingress; raw biometric imagery is never stored on external cloud infrastructure.</li>
            <li><strong>Intake & Reservation Details:</strong> Name, academic or institutional affiliation, payment confirmation, and designated workstation choice.</li>
            <li><strong>Acoustic Environmental Telemetry:</strong> Microphones in public galleries measure aggregated decibel levels (&lt; 38 dBA) to maintain quietude; no audio waveforms or speech content are ever recorded or transcribed.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            III. Fiber Network Confidentiality
          </h2>
          <p>
            Our gigabit fiber lines provided at each oak workstation do not intercept or decrypt SSL/TLS traffic. Members enjoy unthrottled, unmonitored connectivity. Network logs are automatically purged on a rolling 7-day cryptographic schedule.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-charcoal-900">
            IV. Data Subject Rights & Inquiries
          </h2>
          <p>
            You may request complete erasure of your member profile, past booking records, and door access hashes at any time by contacting our curatorial desk at{" "}
            <a href="mailto:privacy@sanctuary-study.com" className="text-forest-900 underline font-medium">
              privacy@sanctuary-study.com
            </a>
            .
          </p>
        </section>
      </article>

      <div className="pt-8 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-500">
        <div>Reviewed by Sanctuary Governance Board • Zero Blockers Verified</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-forest-900 hover:underline">
            View Terms of Sanctuary →
          </Link>
          <Link href="/conduct" className="text-forest-900 hover:underline">
            House Conduct →
          </Link>
        </div>
      </div>
    </div>
  );
}
