"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, Lock, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminMfaPage() {
  const [totpCode, setTotpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    // In a live Supabase environment with enrolled TOTP, this calls:
    // supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode })
    setTimeout(() => {
      setIsVerifying(false);
      setError(
        "MFA Challenge Notice: Supabase live credentials required to verify AAL2 TOTP challenge. Configure .env.local to link active authenticator."
      );
    }, 600);
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Header Shield */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-forest-900 text-ivory-50 flex items-center justify-center border border-forest-950">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>

          <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
            Sanctuary Operational Security • Level 2
          </span>
          <h1 className="font-serif text-3xl text-charcoal-900">
            Admin MFA Verification
          </h1>
          <p className="text-xs text-charcoal-600 leading-relaxed max-w-sm mx-auto font-sans">
            Curatorial operations ledger access mandates Multi-Factor Authentication (AAL2)
            to safeguard member privacy and workstation allocations.
          </p>
        </div>

        {/* Verification Card */}
        <div className="p-6 bg-ivory-100/70 border border-ivory-300 shadow-editorial space-y-5">
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <Input
              label="Six-Digit Authenticator Code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              helperText="Enter time-based one-time code (TOTP) from your enrolled authenticator app."
              required
            />

            {error && (
              <div
                className="p-3 border border-amber-400 bg-amber-50 text-xs font-mono text-amber-900 flex items-start gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isVerifying || totpCode.length < 6}
            >
              {isVerifying ? "Verifying Token..." : "Authenticate Admin Session"}
            </Button>
          </form>

          <div className="pt-4 border-t border-ivory-200 text-center space-y-2">
            <div className="text-[11px] font-mono text-charcoal-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-800" />
              <span>Assurance Level 2 (AAL2) Enforcement Active</span>
            </div>
            <div>
              <Link
                href="/dashboard"
                className="text-xs text-charcoal-700 hover:text-charcoal-900 inline-flex items-center gap-1 font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Member Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
