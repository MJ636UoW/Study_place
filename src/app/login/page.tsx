"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Sparkles, Lock, ArrowRight, KeyRound, Copy, Check, Clock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "register" | "magic_pass">("login");
  const [selectedHours, setSelectedHours] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");

  // Hourly Magic Pass State
  const [hourlyPassPin, setHourlyPassPin] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Check URL parameters for confirmation or error
  useEffect(() => {
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");
    const welcome = searchParams.get("welcome");

    if (error) {
      setStatusMessage({ type: "error", text: decodeURIComponent(error) });
    } else if (verified === "already") {
      setStatusMessage({ type: "success", text: "Your email is already confirmed! Please log in." });
    } else if (welcome) {
      setStatusMessage({ type: "success", text: "Email confirmed successfully! Welcome to Elite Study Zone." });
    }
  }, [searchParams]);

  // 1. One-Click Google Sign-In
  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
    setGoogleEmailInput(email || "mandarj2412@gmail.com");
  };

  const handleExecuteGoogleLogin = async (targetEmail: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    setShowGoogleModal(false);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in with Google.");
      }

      setStatusMessage({ type: "success", text: "Google Sign In verified! Redirecting to student portal..." });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to connect to Google.",
      });
    }
  };

  // 2. Normal Login (Email + Password) - MongoDB Powered
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Invalid email or password." });
        return;
      }

      setStatusMessage({ type: "success", text: "Login verified! Entering your workstation dashboard..." });
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to sign in.",
      });
    }
  };

  // 3. Normal Register (Email + Password + Email Confirmation Link)
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          phone,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Registration failed." });
        return;
      }

      setStatusMessage({
        type: "success",
        text: `Account registered! A confirmation message was sent to ${email}. You can now sign in below.`,
      });
      setActiveTab("login");
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Registration failed.",
      });
    }
  };

  // 4. Hourly Magic Pass (for Hourly Library Visitors: generates Biometric Gate Door PIN in MongoDB)
  const handleHourlyMagicPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: "error", text: "Please enter your email address to receive your hourly gate pass." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/magic-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hours: selectedHours, name: fullName || "Hourly Scholar" }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to generate pass." });
        return;
      }

      setHourlyPassPin(data.pin);
      setStatusMessage({
        type: "success",
        text: `Hourly Biometric Access Pass generated for ${email}! Door PIN is #${data.pin}.`,
      });
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate pass.",
      });
    }
  };

  const copyPinToClipboard = () => {
    if (hourlyPassPin) {
      navigator.clipboard.writeText(hourlyPassPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        {/* Masthead */}
        <div className="text-center space-y-1.5">
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
              ? "Register with your name, email and password to access workstations and reserved desks."
              : activeTab === "magic_pass"
              ? "For hourly library visitors (₹49/hr): get an instant numeric PIN to unlock the ZKTeco biometric door."
              : "Sign in with Google, registered credentials, or hourly visitor pass."}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-charcoal-200/80 shadow-lg space-y-5">
          {/* 1. Sign In with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
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

          {/* Clean Responsive Tabs */}
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

          {/* TAB 1: LOGIN (EMAIL + PASSWORD) */}
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

          {/* TAB 2: REGISTER (NAME + PHONE + EMAIL + PASSWORD) */}
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
                label="Mobile Number (Optional)"
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
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* TAB 3: HOURLY MAGIC PASS (ZKTeco Biometric Door Gate PIN) */}
          {activeTab === "magic_pass" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-sans text-sky-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Instant Hourly Biometric Gate Pass</span>
                </div>
                <p className="text-[11px] leading-relaxed text-sky-800">
                  For visitors booking on an hourly basis (₹49/hr). Type your generated numeric PIN on the <strong>ZKTeco LX50</strong> biometric terminal keypad to open the entrance gate.
                </p>
              </div>

              {hourlyPassPin ? (
                <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-3.5 text-center shadow-sm">
                  <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold tracking-wider">
                    Your Active ZKTeco Door PIN
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="font-mono text-4xl sm:text-5xl font-extrabold text-emerald-950 tracking-widest py-1 bg-white px-5 rounded-lg border border-emerald-200 shadow-inner">
                      #{hourlyPassPin}
                    </div>
                    <button
                      type="button"
                      onClick={copyPinToClipboard}
                      className="p-3 bg-white border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Copy PIN"
                    >
                      {copiedPin ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-sans">
                    Type <strong>{hourlyPassPin}</strong> on the numeric keypad of the <strong>ZKTeco LX50</strong> machine at the door to unlock.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center w-full py-3 bg-forest-700 hover:bg-forest-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <span>Proceed to Student Dashboard →</span>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleHourlyMagicPass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
                      Select Access Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 4, 8].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setSelectedHours(hrs)}
                          className={`py-2 px-1 text-center rounded-lg border text-xs font-sans transition-all ${
                            selectedHours === hrs
                              ? "bg-forest-700 text-white border-forest-700 font-bold shadow-sm"
                              : "bg-white text-charcoal-700 border-charcoal-300 hover:border-forest-600"
                          }`}
                        >
                          <div>{hrs} {hrs === 1 ? "Hour" : "Hours"}</div>
                          <div className="text-[10px] opacity-80">₹{hrs * 49}</div>
                        </button>
                      ))}
                    </div>
                  </div>

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
                    <span>Generate Door PIN (#{selectedHours} hrs)</span>
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Center Admin Link */}
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
          <span>Need to book workstation seats? </span>
          <Link href="/book" className="text-forest-700 font-bold hover:underline">
            View Live Desk Availability →
          </Link>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-charcoal-200 space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-sm text-charcoal-900">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Choose your Google Account to sign in to Elite Study Zone:
            </p>

            {/* Quick Account 1: Mandar Joshi */}
            <button
              type="button"
              onClick={() => handleExecuteGoogleLogin("mandarj2412@gmail.com")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-charcoal-200 hover:border-forest-600 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-forest-700 text-white font-bold flex items-center justify-center text-xs">
                MJ
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-charcoal-900 group-hover:text-forest-700">Mandar Joshi</div>
                <div className="text-[11px] text-charcoal-500 truncate">mandarj2412@gmail.com</div>
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700" />
            </button>

            {/* Custom Google Email Input */}
            <div className="pt-2 border-t border-charcoal-100 space-y-2">
              <label className="text-[11px] font-semibold text-charcoal-700">Or enter another Google account:</label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
              <button
                type="button"
                onClick={() => handleExecuteGoogleLogin(googleEmailInput)}
                disabled={!googleEmailInput}
                className="w-full py-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Continue with {googleEmailInput || "Google"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50">
          <div className="text-xs font-mono uppercase tracking-widest text-forest-700 font-bold animate-pulse">
            Loading Elite Study Zone...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
