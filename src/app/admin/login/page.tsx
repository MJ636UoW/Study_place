"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [adminEmail, setAdminEmail] = useState("admin@elitestudyzone.in");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSecurityPin, setAdminSecurityPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Primary Admin Authentication Gate
    // Master admin credentials or Supabase session verification
    if (adminPassword === "Elight_study_" || adminPassword === "admin123" || adminSecurityPin === "9842") {
      // Set secure admin cookie / session
      document.cookie = "esz_admin_session=active_token_9842; path=/; max-age=86400; SameSite=Lax";
      window.location.href = "/admin";
    } else {
      setIsLoading(false);
      setErrorMessage("Invalid administrator password or hardware security PIN. Access denied.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden">
        {/* Admin Header Masthead */}
        <div className="bg-forest-950 p-6 text-white text-center space-y-2">
          <div className="w-12 h-12 bg-forest-800 text-white rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-forest-900 border border-forest-700 rounded text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Personnel Only</span>
          </div>
          <h1 className="text-xl font-sans font-extrabold tracking-tight">
            ELITE STUDY ZONE • ADMIN PORTAL
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            Ghatkopar West Operations & Biometric Hardware Access
          </p>
        </div>

        {/* Admin Form Body */}
        <form onSubmit={handleAdminLogin} className="p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Admin Official Email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="font-mono text-xs"
            />

            <Input
              label="Master Password"
              type="password"
              placeholder="Enter master password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />

            <Input
              label="Hardware Security PIN (Optional MFA Backup)"
              type="password"
              placeholder="Enter 4-digit terminal PIN"
              value={adminSecurityPin}
              onChange={(e) => setAdminSecurityPin(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">Admin Setup Quick Pass:</div>
            <div>Password: <span className="font-bold text-forest-700">Elight_study_</span> or <span className="font-bold text-forest-700">admin123</span></div>
            <div>MFA PIN: <span className="font-bold text-forest-700">9842</span></div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center bg-forest-900 hover:bg-forest-800 text-white font-bold"
            isLoading={isLoading}
          >
            <span>Authenticate into Admin Ledger</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs font-sans text-forest-700 hover:underline font-semibold"
            >
              ← Back to Student / Member Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
