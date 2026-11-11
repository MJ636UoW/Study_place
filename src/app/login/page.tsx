"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowRight, Sparkles, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { signInWithPassword, signInWithOtp, signUpWithPassword, requestPasswordReset } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "magic_pass" | "register" | "forgot_password">("password");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const config = getSupabaseConfigStatus();

  // One-Click Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const supabase = createClient();
      const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback`,
        },
      });
      if (error) {
        setStatusMessage({ type: "error", text: error.message });
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to connect to Google OAuth.",
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);

    if (!config.isConfigured) {
      setIsLoading(false);
      setStatusMessage({
        type: "info",
        text: "Demo Access: Redirecting to student session in 1s...",
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
      } else if (authMethod === "magic_pass") {
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
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Authentication request could not be processed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Masthead */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-forest-700 text-white font-mono font-bold text-2xl shadow-md mb-1">
            E
          </div>
          <div className="text-[11px] uppercase font-mono tracking-widest text-forest-700 font-bold">
            ELITE STUDY ZONE • GHATKOPAR WEST
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-charcoal-900 tracking-tight">
            {authMethod === "register"
              ? "Create Student Account"
              : authMethod === "magic_pass"
              ? "Hourly Magic Pass Login"
              : authMethod === "forgot_password"
              ? "Reset Your Password"
              : "Student & Member Login"}
          </h1>
          <p className="text-xs text-charcoal-600 font-sans max-w-sm mx-auto leading-relaxed">
            {authMethod === "register"
              ? "Register once to book hourly sessions, monthly workstations, and unlock biometric gate passes."
              : authMethod === "magic_pass"
              ? "Perfect for hourly & day visitors! No password needed—receive a 1-click magic access pass in your email."
              : authMethod === "forgot_password"
              ? "Enter your registered email address to receive password reset instructions."
              : "Login to reserve study hours, view your biometric access code, and download tax invoices."}
          </p>
        </div>

        {/* Clean Login Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-charcoal-200/80 shadow-lg space-y-5">
          {/* 1. Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-charcoal-300 rounded-lg text-xs font-sans font-bold text-charcoal-800 hover:bg-slate-50 hover:border-charcoal-400 active:bg-slate-100 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-charcoal-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-mono tracking-wider text-charcoal-400">
              Or email pass
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg text-xs font-sans font-medium text-charcoal-600">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setStatusMessage(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                authMethod === "password"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              Password
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod("magic_pass");
                setStatusMessage(null);
              }}
              className={`py-2 text-center rounded-md transition-all flex items-center justify-center gap-1 ${
                authMethod === "magic_pass"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Magic Pass</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod("register");
                setStatusMessage(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                authMethod === "register"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* Educational Magic Pass Explainer Banner */}
          {authMethod === "magic_pass" && (
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-sans text-sky-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-sky-900">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>What is a Magic Pass?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-800">
                Designed especially for <strong>hourly and day visitors</strong>! You don’t need to remember or create a password. Simply enter your email, and we will send a 1-click access link directly to your inbox so you can instantly view your active booking, desk allocation, and QR turnstile gate pass.
              </p>
            </div>
          )}

          {/* Feedback Messages */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-lg text-xs font-sans flex items-start gap-2.5 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 border border-rose-300 text-rose-950"
                  : "bg-blue-50 border border-blue-300 text-blue-950"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold font-mono text-[10px] uppercase">
                  {statusMessage.type === "success" ? "Access Granted" : "Notice"}
                </span>
                <p className="leading-snug">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* The Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {authMethod === "register" && (
              <>
                <Input
                  label="Student Full Name"
                  name="fullName"
                  placeholder="e.g. Rahul Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Mobile Number (for Biometric & WhatsApp alert)"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </>
            )}

            <Input
              label="Registered Email Address"
              name="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {(authMethod === "password" || authMethod === "register") && (
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder={authMethod === "register" ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center bg-forest-700 hover:bg-forest-600 text-white font-bold rounded-lg shadow-sm"
              isLoading={isLoading}
            >
              <span>
                {authMethod === "register"
                  ? "Create Account & Proceed"
                  : authMethod === "magic_pass"
                  ? "Email Me My Magic Pass →"
                  : authMethod === "forgot_password"
                  ? "Send Recovery Link"
                  : "Login to Elite Study Zone"}
              </span>
            </Button>
          </form>

          {/* Helper Links */}
          <div className="flex items-center justify-between pt-1 text-xs font-sans text-charcoal-600">
            {authMethod === "password" ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("forgot_password");
                  setStatusMessage(null);
                }}
                className="hover:text-forest-700 underline text-[11px]"
              >
                Forgot password?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setStatusMessage(null);
                }}
                className="hover:text-forest-700 underline text-[11px]"
              >
                ← Back to password login
              </button>
            )}

            <Link
              href="/admin/login"
              className="text-[11px] font-mono text-charcoal-500 hover:text-forest-700 font-semibold flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>

        {/* Bottom Helper */}
        <div className="text-center text-xs font-sans text-charcoal-600">
          <span>Need to book immediately? </span>
          <Link href="/book" className="text-forest-700 font-bold hover:underline">
            Check live desk availability →
          </Link>
        </div>
      </div>
    </div>
  );
}
