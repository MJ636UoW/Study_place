"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfigurationBanner } from "@/components/ui/ConfigurationBanner";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { signInWithPassword, signInWithOtp, signUpWithPassword, requestPasswordReset } from "@/app/auth/actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "magic_link" | "register" | "forgot_password">("password");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const config = getSupabaseConfigStatus();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);

    if (!config.isConfigured) {
      // Honest offline handling when Supabase is not configured
      setIsLoading(false);
      setStatusMessage({
        type: "info",
        text: "Offline Demo Mode: Live Supabase is unconfigured in .env.local. Redirecting to demo session in 1s...",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      return;
    }

    try {
      if (authMethod === "password") {
        const res = await signInWithPassword(null, formData);
        if (!res.success) {
          setStatusMessage({ type: "error", text: res.message });
        }
      } else if (authMethod === "magic_link") {
        const res = await signInWithOtp(null, formData);
        setStatusMessage({
          type: res.success ? "success" : "error",
          text: res.message,
        });
      } else if (authMethod === "register") {
        const res = await signUpWithPassword(null, formData);
        setStatusMessage({
          type: res.success ? "success" : "error",
          text: res.message,
        });
      } else if (authMethod === "forgot_password") {
        const res = await requestPasswordReset(null, formData);
        setStatusMessage({
          type: res.success ? "success" : "error",
          text: res.message,
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "An unexpected authentication dispatch error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-14rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-ivory-50">
      <div className="w-full max-w-md space-y-6">
        {/* Masthead */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 border border-ivory-300 bg-ivory-100 shadow-editorial mb-1">
            <Compass className="w-6 h-6 text-forest-800" strokeWidth={1.5} />
          </div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
            Sanctuary Access Ledger
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal-900 tracking-tight">
            {authMethod === "register"
              ? "Apply for Membership"
              : authMethod === "forgot_password"
              ? "Recover Access Key"
              : "Enter Sanctuary"}
          </h1>
          <p className="text-xs text-charcoal-600 font-sans max-w-sm mx-auto leading-relaxed">
            {authMethod === "register"
              ? "Register a verified scholar profile to access workstation bookings and archive privileges."
              : authMethod === "forgot_password"
              ? "Provide your registered email to receive cryptographically signed recovery instructions."
              : "Access your assigned desk reservations, keycard access codes, and locker combinations."}
          </p>
        </div>

        {/* Honest Configuration Notice Banner */}
        <ConfigurationBanner />

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-3 p-1 border border-ivory-300 bg-ivory-100 text-[11px] font-sans">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setStatusMessage(null);
            }}
            className={`py-2 text-center uppercase tracking-wider transition-colors min-h-[44px] ${
              authMethod === "password"
                ? "bg-ivory-50 text-charcoal-900 shadow-editorial font-semibold"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("magic_link");
              setStatusMessage(null);
            }}
            className={`py-2 text-center uppercase tracking-wider transition-colors min-h-[44px] ${
              authMethod === "magic_link"
                ? "bg-ivory-50 text-charcoal-900 shadow-editorial font-semibold"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Magic Pass
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("register");
              setStatusMessage(null);
            }}
            className={`py-2 text-center uppercase tracking-wider transition-colors min-h-[44px] ${
              authMethod === "register"
                ? "bg-ivory-50 text-charcoal-900 shadow-editorial font-semibold"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Authentication Card */}
        <div className="p-7 border border-ivory-300 bg-ivory-50 shadow-editorial-md space-y-5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {authMethod === "register" && (
              <Input
                name="fullName"
                label="Full Scholar Name"
                placeholder="e.g. Dr. Julian Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              name="email"
              label="Registered Email"
              type="email"
              placeholder="scholar@sanctuary-study.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {(authMethod === "password" || authMethod === "register") && (
              <Input
                name="password"
                label={authMethod === "register" ? "Create Passphrase" : "Access Key / Password"}
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3 text-xs font-mono flex items-start gap-2 border ${
                  statusMessage.type === "success"
                    ? "border-forest-300 bg-forest-50 text-forest-900"
                    : statusMessage.type === "error"
                    ? "border-red-300 bg-red-50 text-red-900"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                }`}
                role="status"
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{statusMessage.text}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {authMethod === "password"
                ? "Authorize Session"
                : authMethod === "magic_link"
                ? "Dispatch Magic Pass"
                : authMethod === "register"
                ? "Submit Scholar Registration"
                : "Send Recovery Link"}
            </Button>
          </form>

          {/* Secondary Actions */}
          <div className="pt-3 border-t border-ivory-200 flex items-center justify-between text-xs font-sans text-charcoal-600">
            {authMethod === "password" && (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("forgot_password");
                  setStatusMessage(null);
                }}
                className="hover:text-charcoal-900 underline font-mono text-[11px]"
              >
                Forgot access key?
              </button>
            )}

            {authMethod === "forgot_password" && (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setStatusMessage(null);
                }}
                className="hover:text-charcoal-900 underline font-mono text-[11px]"
              >
                Back to password login
              </button>
            )}

            <div className="ml-auto text-[11px] font-mono text-charcoal-500">
              {config.isConfigured ? "Supabase Live Auth" : "Offline Demo Mode"}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs font-sans text-charcoal-600">
          <span>Explore physical studio floorplan? </span>
          <Link href="/book" className="text-forest-900 font-medium hover:underline">
            Inspect workstations on plat →
          </Link>
        </div>
      </div>
    </div>
  );
}
