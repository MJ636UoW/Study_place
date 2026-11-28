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
  MessageCircle,
  Calendar,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";

const AVAILABLE_START_TIMES = [
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
];

const HOURLY_PASS_OPTIONS = [
  { hours: 2, label: "2 Hours", tag: "Quick Focus", price: 99 },
  { hours: 3, label: "3 Hours", tag: "Deep Focus", price: 139 },
  { hours: 5, label: "5 Hours", tag: "Study Shift", price: 199 },
  { hours: 10, label: "10 Hours", tag: "Two Shifts", price: 299 },
  { hours: 15, label: "Full Day", tag: "15 Hours", price: 349 },
];

function computeSlotEndTime(startTime12h: string, hours: number): string {
  const parts = startTime12h.split(" ");
  if (parts.length !== 2) return startTime12h;
  let [h, m] = parts[0].split(":").map(Number);
  const modifier = parts[1];
  if (modifier === "PM" && h < 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;

  const totalMinutes = h * 60 + (m || 0) + hours * 60;
  let endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  const endModifier = endH >= 12 ? "PM" : "AM";
  if (endH > 12) endH -= 12;
  if (endH === 0) endH = 12;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")} ${endModifier}`;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "register" | "magic_pass" | "code_login">("login");
  const [selectedHours, setSelectedHours] = useState(2);
  const [hourlyStartTime, setHourlyStartTime] = useState("10:00 AM");
  const [hourlyDate, setHourlyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hourlyPassSlot, setHourlyPassSlot] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [registeredConfirmUrl, setRegisteredConfirmUrl] = useState<string | null>(null);
  const [registeredWhatsAppLink, setRegisteredWhatsAppLink] = useState<string | null>(null);
  const [registeredDoorPin, setRegisteredDoorPin] = useState<string | null>(null);

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

  // Google One-Tap / GIS Auto-Detection (Official Client ID configured for elitestudyzone.in)
  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "518523508794-g04r34nn7h35ij0cng8ru555jff5rb9s.apps.googleusercontent.com";

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).handleGoogleCredentialResponse = (res: { credential?: string }) => {
      if (res?.credential) {
        handleVerifyGoogleCredential(res.credential);
      }
    };

    const rawClientId = GOOGLE_CLIENT_ID;
    if (!rawClientId || rawClientId.includes("sample") || rawClientId.includes("placeholder")) {
      return;
    }

    const setupGoogleGsi = () => {
      const g = (window as unknown as { google?: { accounts?: { id?: { initialize: Function; prompt: Function; renderButton: Function } } } })?.google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: rawClientId,
            callback: (res: { credential?: string }) => {
              if (res?.credential) {
                handleVerifyGoogleCredential(res.credential);
              }
            },
            auto_select: false,
          });

          // Render official Google button into dedicated container if present
          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = "";
            g.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
        } catch (e) {
          console.warn("Google GSI setup error:", e);
        }
      }
    };

    const timer = setTimeout(setupGoogleGsi, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleVerifyGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in with Google.");
      }

      const scholarName = data.user?.name || "Scholar";
      setStatusMessage({ type: "success", text: `Welcome, ${scholarName}! Entering dashboard...` });
      const next = searchParams.get("redirect") || searchParams.get("next") || "/book";
      window.location.href = next;
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to verify Google account.",
      });
    }
  };

  const handleGoogleSignInClick = () => {
    const rawClientId = GOOGLE_CLIENT_ID;
    const g = (window as unknown as { google?: { accounts?: { id?: { prompt: Function } } } })?.google;
    if (g?.accounts?.id) {
      g.accounts.id.prompt();
    } else {
      setStatusMessage({
        type: "info",
        text: "Connecting to Google Sign-In... Please select your account from the Google prompt, or sign in below.",
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
        body: JSON.stringify({ identifier: email, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        setStatusMessage({ type: "error", text: data.error || "Invalid email, mobile number, or password." });
        return;
      }

      const activeEmail = data.user?.email || email;
      const scholarName = data.user?.name || activeEmail.split("@")[0] || "Scholar";
      document.cookie = `esz_student_session=active; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(activeEmail)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(scholarName)}; path=/; max-age=604800; SameSite=Lax`;

      setStatusMessage({ type: "success", text: "Login verified! Entering your workstation dashboard..." });
      const next = searchParams.get("redirect") || searchParams.get("next") || "/book";
      window.location.href = next;
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to sign in.",
      });
    }
  };

  // 3. Normal Register (Email + Password + Account Creation)
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

      // Establish client cookies
      const activeEmail = data.user?.email || email;
      const scholarName = data.user?.name || fullName || "Scholar";
      document.cookie = `esz_student_session=active; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(activeEmail)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(scholarName)}; path=/; max-age=604800; SameSite=Lax`;

      // Clear any PIN state
      setRegisteredDoorPin(null);
      setRegisteredWhatsAppLink(null);

      // Revert back to login tab as requested
      setActiveTab("login");

      setStatusMessage({
        type: "success",
        text: `Account created successfully! Welcome to Elite Study Zone, ${scholarName}. You are now logged in. Redirecting to select your workstation plan...`,
      });

      const next = searchParams.get("redirect") || searchParams.get("next") || "/book";
      setTimeout(() => {
        window.location.href = next;
      }, 1200);
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

  // 4. Hourly Magic Pass (for Hourly Library Visitors: generates Smart Door Keypad PIN in MongoDB)
  const handleHourlyMagicPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: "error", text: "Please enter your email address to receive your hourly gate pass." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const slotWindow = `${hourlyStartTime} – ${computeSlotEndTime(hourlyStartTime, selectedHours)}`;

    try {
      const res = await fetch("/api/auth/magic-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          hours: selectedHours,
          name: fullName || "Hourly Scholar",
          phone,
          slot: `${slotWindow} (${hourlyDate})`,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to generate pass." });
        return;
      }

      setHourlyPassPin(data.pin);
      setHourlyPassSlot(slotWindow);
      document.cookie = `esz_student_session=hourly_pass; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `esz_student_name=${encodeURIComponent(fullName || email.split("@")[0] || "Hourly Scholar")}; path=/; max-age=604800; SameSite=Lax`;

      setStatusMessage({
        type: "success",
        text: `Access pass generated for slot ${slotWindow}! Door PIN #${data.pin} dispatched to Email ${phone ? "and WhatsApp" : ""}.`,
      });
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate pass.",
      });
    }
  };

  // 5. Direct Access Code / Door PIN Login
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your Access Code or Door PIN." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/code-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCodeInput.trim() }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Invalid or expired Access Code." });
        return;
      }

      setStatusMessage({ type: "success", text: `Pass Verified! Entering your workstation dashboard...` });
      const next = searchParams.get("redirect") || searchParams.get("next") || "/book";
      window.location.href = next;
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Code login failed.",
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
        {/* Masthead with Enhanced Official Desk Lamp & Book Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandLogo size="lg" linkToHome />
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-charcoal-900 tracking-tight">
            {activeTab === "register"
              ? "Create Student Account"
              : activeTab === "magic_pass"
              ? "Hourly & Shift Workstation Pass"
              : activeTab === "code_login"
              ? "Enter with Pass Code / PIN"
              : "Student & Member Login"}
          </h1>
          <p className="text-xs text-charcoal-600 font-sans max-w-sm mx-auto leading-relaxed">
            {activeTab === "register"
              ? "Create your student account to book workstation seats and access study passes."
              : activeTab === "code_login"
              ? "Have an active pass code from WhatsApp or Email? Enter your PIN below."
              : "Sign in with Google, registered email, or access pass code."}
          </p>

          {searchParams.get("redirect")?.includes("/book") && (
            <div className="p-3 bg-forest-50 border border-forest-300 rounded-lg text-forest-900 text-xs font-semibold max-w-sm mx-auto shadow-sm">
              🎯 Sign in or register below to choose your plan and reserve your workstation desk.
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-charcoal-200/80 shadow-lg space-y-5">
          {/* 1. Sign In with Google Button */}
          <div
            id="g_id_onload"
            data-client_id="518523508794-g04r34nn7h35ij0cng8ru555jff5rb9s.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-callback="handleGoogleCredentialResponse"
            data-auto_prompt="false"
          ></div>
          <div id="google-signin-btn-container" className="w-full flex justify-center">
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
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-charcoal-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-mono tracking-wider text-charcoal-500">
              or continue with email
            </span>
          </div>

          {/* Clean Responsive 3 Tabs */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg text-xs font-sans font-medium text-charcoal-600 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setStatusMessage(null);
                setHourlyPassPin(null);
              }}
              className={`py-2 px-2 text-center rounded-md transition-all ${
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
              className={`py-2 px-2 text-center rounded-md transition-all ${
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
                setActiveTab("code_login");
                setStatusMessage(null);
                setHourlyPassPin(null);
              }}
              className={`py-2 px-2 text-center rounded-md transition-all flex items-center justify-center gap-1 ${
                activeTab === "code_login"
                  ? "bg-white text-forest-900 font-bold shadow-sm"
                  : "hover:text-charcoal-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enter with PIN</span>
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

              {statusMessage.type === "success" && (
                <div className="pt-1">
                  <Link
                    href={searchParams.get("redirect") || searchParams.get("next") || "/book"}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                  >
                    <span>Proceed to Book a Workstation →</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: LOGIN (EMAIL OR MOBILE NUMBER + PASSWORD) */}
          {activeTab === "login" && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Registered Email or Mobile Number *"
                  name="email"
                  type="text"
                  placeholder="your.email@example.com or 10-digit mobile"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password *"
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

              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("code_login");
                    setStatusMessage(null);
                  }}
                  className="text-xs text-forest-700 hover:text-forest-800 font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-forest-700" />
                  <span>Have an Access Code or Door PIN? Enter with Code →</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER (NAME + WHATSAPP + EMAIL + PASSWORD) */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Input
                label="Full Scholar Name *"
                name="fullName"
                type="text"
                placeholder="e.g. Arjun Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Mobile Number *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase tracking-wider">Dual Delivery</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-sans"
                />
                <p className="text-[10px] text-charcoal-500 mt-1">
                  Your official Door Keypad PIN and access pass will be issued once your workstation booking is verified by admin.
                </p>
              </div>

              <Input
                label="Personal Email Address *"
                name="email"
                type="email"
                placeholder="your.personal@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Choose a Password *"
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
                <span>Create Account & Continue to Workstations</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* TAB 3: DIRECT CODE / DOOR PIN LOGIN */}
          {activeTab === "code_login" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>Direct Pass Code & Keypad PIN Login</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Enter your 6-digit Hourly Door PIN or reservation pass code (from WhatsApp or Email) to sign in directly without a password.
                </p>
              </div>

              <form onSubmit={handleCodeLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Access Code or Door PIN *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 748291 or PASS-2610-E73F10"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-3 text-sm font-mono tracking-wider border-2 border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 uppercase bg-slate-50 text-charcoal-900"
                  />
                  <p className="text-[10px] text-charcoal-500 mt-1">
                    Accepts 6-digit numeric door PINs or reservation pass codes.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center bg-forest-700 hover:bg-forest-600 text-white font-bold rounded-lg shadow-sm"
                  isLoading={isLoading}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <span>Verify Code & Enter Dashboard</span>
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("magic_pass");
                    setStatusMessage(null);
                  }}
                  className="text-xs text-forest-700 hover:text-forest-800 font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Don't have a code? Book an hourly pass (₹49/hr) →</span>
                </button>
              </div>
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
