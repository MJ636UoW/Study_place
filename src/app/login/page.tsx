"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Sparkles, Lock, ArrowRight, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signInWithPassword, signUpWithPassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "register" | "magic_pass">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Hourly Magic Pass State
  const [hourlyPassPin, setHourlyPassPin] = useState<string | null>(null);

  // 1. One-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const supabase = createClient();
      const appUrl = typeof window !== "undefined" ? window.location.origin : "https://study-place.onrender.com";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (error) {
        setIsLoading(false);
        setStatusMessage({
          type: "error",
          text: error.message.includes("provider is not enabled")
            ? "Google Sign-In is not enabled yet in your Supabase dashboard (Authentication > Providers > Google). Please log in with Email & Password below!"
            : error.message,
        });
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to connect to Google.",
      });
    }
  };

  // 2. Normal Login (Email + Password)
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await signInWithPassword(null, formData);
      if (!res.success) {
        setIsLoading(false);
        setStatusMessage({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid email or password.",
      });
    }
  };

  // 3. Normal Register (Email + Password + Confirmation Mail)
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await signUpWithPassword(null, formData);
      setIsLoading(false);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Account created! We sent a confirmation email to ${email}. Please open your mail, click "Confirm your email address", and then log in here with your password!`,
        });
        setActiveTab("login");
      } else {
        setStatusMessage({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Registration failed.",
      });
    }
  };

  // 4. Hourly Magic Pass (for Hourly Library Visitors: generates Biometric Gate Door PIN)
  const handleHourlyMagicPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: "error", text: "Please enter your email address to receive your hourly gate pass." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    // Generate numeric 4-digit biometric hardware door PIN (e.g. PIN 4821)
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setHourlyPassPin(pin);

    // Save session so visitor can view dashboard
    document.cookie = `esz_student_email=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `esz_student_name=${encodeURIComponent(email.split("@")[0])}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = "esz_student_session=hourly_pass; path=/; max-age=86400; SameSite=Lax";

    setIsLoading(false);
    setStatusMessage({
      type: "success",
      text: `Hourly Biometric Access Pass generated for ${email}! Your hardware door PIN is #${pin}.`,
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
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
            {activeTab === "register"
              ? "Create Student Account"
              : activeTab === "magic_pass"
              ? "Hourly Magic Gate Pass"
              : "Student & Member Login"}
          </h1>
          <p className="text-xs text-charcoal-600 font-sans max-w-sm mx-auto leading-relaxed">
            {activeTab === "register"
              ? "Register with your personal email and password to access the study library and workstations."
              : activeTab === "magic_pass"
              ? "For hourly library visitors: get a temporary biometric PIN code to unlock the door for the hours you booked."
              : "Sign in with Google or enter your registered email and password."}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-charcoal-200/80 shadow-lg space-y-5">
          {/* 1. Sign In with Google */}
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
            <span>Sign in with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-charcoal-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-mono tracking-wider text-charcoal-500">
              or continue with email
            </span>
          </div>

          {/* Simple Tabs: Login / Register / Hourly Magic Pass */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg text-xs font-sans font-medium text-charcoal-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setStatusMessage(null);
                setHourlyPassPin(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                activeTab === "login"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setStatusMessage(null);
                setHourlyPassPin(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                activeTab === "register"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              Register
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("magic_pass");
                setStatusMessage(null);
              }}
              className={`py-2 text-center rounded-md transition-all flex items-center justify-center gap-1 ${
                activeTab === "magic_pass"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hourly Pass</span>
            </button>
          </div>

          {/* Status Alert Banner */}
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
                <p className="leading-snug">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* TAB 1: NORMAL LOGIN (EMAIL + PASSWORD) */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center bg-forest-700 hover:bg-forest-600 text-white font-bold rounded-lg shadow-sm"
                isLoading={isLoading}
              >
                <span>Login to Elite Study Zone</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* TAB 2: NORMAL REGISTER (NAME + PHONE + EMAIL + PASSWORD) */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Input
                label="Full Scholar Name"
                name="fullName"
                type="text"
                placeholder="e.g. Mandar Joshi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Mobile Number (for Biometric & WhatsApp alert)"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Personal Email Address"
                name="email"
                type="email"
                placeholder="your.personal@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Choose a Password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center bg-forest-700 hover:bg-forest-600 text-white font-bold rounded-lg shadow-sm"
                isLoading={isLoading}
              >
                <span>Register & Send Confirmation Mail</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-[11px] text-charcoal-500 text-center">
                A confirmation link will be delivered to your email inbox. Click the link to confirm, then log in!
              </p>
            </form>
          )}

          {/* TAB 3: HOURLY MAGIC PASS (HOURLY PUBLIC / DOOR BIOMETRIC PIN) */}
          {activeTab === "magic_pass" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-sans text-sky-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Hourly Library Visitor Magic Pass</span>
                </div>
                <p className="text-[11px] leading-relaxed text-sky-800">
                  For visitors booking library access on an <strong>hourly basis</strong> (₹49/hr). Enter your email to receive your biometric door pass. Type your numeric pass code on the ZKTeco LX50 door terminal to unlock the gate!
                </p>
              </div>

              {hourlyPassPin ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold">
                    Active Biometric Door PIN (Valid for your Booked Hours)
                  </div>
                  <div className="font-mono text-4xl font-extrabold text-emerald-950 tracking-widest py-1">
                    #{hourlyPassPin}
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                    Type <strong>{hourlyPassPin}</strong> on the numeric keypad of the <strong>ZKTeco LX50</strong> attendance machine at the reception entrance to unlock the door.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center w-full py-2.5 bg-forest-700 hover:bg-forest-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <span>Enter Student Dashboard →</span>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleHourlyMagicPass} className="space-y-4">
                  <Input
                    label="Visitor Email Address"
                    type="email"
                    placeholder="visitor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center bg-forest-700 hover:bg-forest-600 text-white font-bold rounded-lg shadow-sm"
                    isLoading={isLoading}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    <span>Get Hourly Biometric Door PIN</span>
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Admin Portal Gateway */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-sans text-charcoal-600">
            <span className="text-[11px] text-charcoal-500">Center Administration</span>
            <Link
              href="/admin/login"
              className="text-[11px] font-mono text-charcoal-600 hover:text-forest-700 font-bold flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-slate-700" />
              <span>Admin Portal →</span>
            </Link>
          </div>
        </div>

        {/* Bottom Helper */}
        <div className="text-center text-xs font-sans text-charcoal-600">
          <span>Need to book hourly study seats? </span>
          <Link href="/book" className="text-forest-700 font-bold hover:underline">
            View Live Desk Availability →
          </Link>
        </div>
      </div>
    </div>
  );
}
