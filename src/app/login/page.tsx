"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  KeyRound,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Clipboard,
} from "lucide-react";
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
  const [registeredConfirmUrl, setRegisteredConfirmUrl] = useState<string | null>(null);

  // Google Modal State & Dynamic Account Memory
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [savedGoogleAccount, setSavedGoogleAccount] = useState<{ email: string; name: string } | null>(null);

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

    // Load any saved Google Account used previously on THIS browser only
    try {
      const savedEmail = localStorage.getItem("esz_recent_google_email");
      const savedName = localStorage.getItem("esz_recent_google_name");
      if (savedEmail && savedEmail.includes("@")) {
        setSavedGoogleAccount({
          email: savedEmail,
          name: savedName || savedEmail.split("@")[0],
        });
      }
    } catch (_) {}
  }, [searchParams]);

  // Google One-Tap / GIS Auto-Detection (Active only when a real client ID is configured)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    // Guard against dummy sample ID to prevent Google's "Error 401: invalid_client" popup
    if (!rawClientId || rawClientId.includes("sample") || rawClientId.includes("placeholder")) {
      return;
    }

    const setupGoogleGsi = () => {
      const g = (window as unknown as { google?: { accounts?: { id?: { initialize: Function; prompt: Function } } } })?.google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: rawClientId,
            callback: (res: { credential?: string }) => {
              if (res?.credential) {
                try {
                  const base64Url = res.credential.split(".")[1];
                  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                  const jsonPayload = decodeURIComponent(
                    atob(base64)
                      .split("")
                      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                      .join("")
                  );
                  const payload = JSON.parse(jsonPayload);
                  if (payload?.email) {
                    handleExecuteGoogleLogin(payload.email, payload.name);
                  }
                } catch (e) {
                  console.warn("Credential parse fallback:", e);
                }
              }
            },
            auto_select: false,
          });
          g.accounts.id.prompt();
        } catch (_) {}
      }
    };

    const timer = setTimeout(setupGoogleGsi, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 1. One-Click Google Sign-In
  const handleGoogleSignInClick = () => {
    // If the scholar already typed or pasted an email into the input, sign in directly!
    if (email && email.includes("@")) {
      handleExecuteGoogleLogin(email);
      return;
    }
    // Clean input without any hardcoded credentials
    setGoogleEmailInput("");
    setShowGoogleModal(true);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const trimmed = (text || "").trim();
        if (trimmed) {
          setGoogleEmailInput(trimmed);
          if (trimmed.includes("@")) {
            handleExecuteGoogleLogin(trimmed);
          }
        }
      }
    } catch (_) {
      // Clipboard access blocked by browser permission
    }
  };

  const handleForgetSavedAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem("esz_recent_google_email");
      localStorage.removeItem("esz_recent_google_name");
    } catch (_) {}
    setSavedGoogleAccount(null);
  };

  const handleExecuteGoogleLogin = async (targetEmail: string, explicitName?: string) => {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatusMessage({ type: "error", text: "Please enter a valid Google email address." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setShowGoogleModal(false);

    try {
      // Derive clean capitalized scholar name (e.g. "alex.miller" -> "Alex Miller")
      const derivedName =
        explicitName ||
        cleanEmail
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      // Save to this browser's local memory for 1-click return
      try {
        localStorage.setItem("esz_recent_google_email", cleanEmail);
        localStorage.setItem("esz_recent_google_name", derivedName);
        setSavedGoogleAccount({ email: cleanEmail, name: derivedName });
      } catch (_) {}

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: derivedName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in with Google.");
      }

      const scholarName = data.user?.name || derivedName || "Scholar";
      document.cookie = `esz_student_session=active_google; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(scholarName)}; path=/; max-age=604800; SameSite=Lax`;

      setStatusMessage({ type: "success", text: "Google Sign In verified! Redirecting to student dashboard..." });
      const next = searchParams.get("next") || "/dashboard";
      window.location.href = next;
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
      if (!res.ok) {
        setIsLoading(false);
        setStatusMessage({ type: "error", text: data.error || "Invalid email or password." });
        return;
      }

      const scholarName = data.user?.name || email.split("@")[0] || "Scholar";
      document.cookie = `esz_student_session=active; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(scholarName)}; path=/; max-age=604800; SameSite=Lax`;

      setStatusMessage({ type: "success", text: "Login verified! Entering your workstation dashboard..." });
      const next = searchParams.get("next") || "/dashboard";
      window.location.href = next;
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

      if (data.confirmUrl) {
        let cleanUrl = data.confirmUrl;
        if (cleanUrl.includes("/api/auth/verify")) {
          const q = cleanUrl.indexOf("?");
          if (q !== -1) {
            cleanUrl = `/api/auth/verify${cleanUrl.substring(q)}`;
          }
        }
        setRegisteredConfirmUrl(cleanUrl);
      }

      setStatusMessage({
        type: "success",
        text: `Account registered! A confirmation message was dispatched for ${email}. You can confirm via your email or click the instant button below.`,
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

  const handleInstantConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!registeredConfirmUrl) return;
    setIsLoading(true);

    let targetEndpoint = registeredConfirmUrl;
    if (targetEndpoint.includes("/api/auth/verify")) {
      const q = targetEndpoint.indexOf("?");
      if (q !== -1) {
        targetEndpoint = `/api/auth/verify${targetEndpoint.substring(q)}`;
      }
    }
    window.location.href = targetEndpoint;
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
      document.cookie = `esz_student_session=hourly_pass; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(fullName || email.split("@")[0] || "Hourly Scholar")}; path=/; max-age=604800; SameSite=Lax`;

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
              className={`p-3.5 rounded-lg text-xs font-sans flex flex-col gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 border border-rose-300 text-rose-950"
                  : "bg-blue-50 border border-blue-300 text-blue-950"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1">
                  <p className="leading-snug">{statusMessage.text}</p>
                </div>
              </div>
              {registeredConfirmUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleInstantConfirmClick}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-md transition-all shadow-md transform active:scale-98"
                  >
                    <span>Instant Confirm & Enter Dashboard →</span>
                  </button>
                </div>
              )}
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
                placeholder="e.g. Arjun Sharma"
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
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                className="text-charcoal-400 hover:text-charcoal-700 text-sm font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Sign in with your Google Account to automatically access your student portal and workstation passes:
            </p>

            {/* If THIS browser has previously logged in with a Google account, offer it as a quick chip */}
            {savedGoogleAccount && (
              <div className="space-y-1.5 pb-2 border-b border-charcoal-100">
                <div className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500">
                  Recent on this browser
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-charcoal-200 hover:border-forest-600 bg-slate-50 transition-all">
                  <button
                    type="button"
                    onClick={() => handleExecuteGoogleLogin(savedGoogleAccount.email, savedGoogleAccount.name)}
                    className="flex-1 flex items-center gap-2.5 text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-forest-700 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {savedGoogleAccount.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-charcoal-900 group-hover:text-forest-700 truncate">
                        {savedGoogleAccount.name}
                      </div>
                      <div className="text-[11px] text-charcoal-500 truncate">{savedGoogleAccount.email}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700 flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    title="Remove from this browser"
                    onClick={handleForgetSavedAccount}
                    className="text-charcoal-400 hover:text-rose-600 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Direct Paste / Type Google Email Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (googleEmailInput.trim()) {
                  handleExecuteGoogleLogin(googleEmailInput.trim());
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-charcoal-700">
                    Paste or enter Google email:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[10px] font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1 hover:underline"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>Paste Clipboard</span>
                  </button>
                </div>
                <input
                  type="email"
                  autoFocus
                  placeholder="your.email@gmail.com"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-sans"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3 py-2.5 text-xs bg-slate-100 hover:bg-slate-200 text-charcoal-700 font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5 text-charcoal-600" />
                  <span>Paste</span>
                </button>
                <button
                  type="submit"
                  disabled={!googleEmailInput || !googleEmailInput.includes("@")}
                  className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="text-[10px] text-center text-charcoal-500 font-sans pt-1">
              Supports any personal @gmail.com or Google Workspace address.
            </div>
          </div>
        </div>
      )}
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
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
