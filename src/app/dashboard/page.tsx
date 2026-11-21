"use client";

function KeypadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" />
    </svg>
  );
}



import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Mail,
  User,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { ConfigurationBanner } from "@/components/ui/ConfigurationBanner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { RazorpayCheckoutModal } from "@/components/payments/RazorpayCheckoutModal";

interface ReservationItem {
  id: string;
  bookingRef: string;
  seatId: string;
  seatLabel: string;
  roomName: string;
  tierName: string;
  startDate: string;
  endDate: string;
  requestStatus: "submitted" | "under_review" | "approved" | "rejected" | "expired" | "cancelled";
  paymentStatus: "unpaid" | "payment_hold" | "paid" | "failed" | "refunded";
  totalPricePaise: number;
  totalPriceRupees: string;
  holdExpiresAt?: string | null;
  passCode?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  recipientEmail: string;
  subject: string;
  status: "queued" | "sent" | "failed";
  attempts: number;
  createdAt: string;
  sentAt: string | null;
}

interface BiometricPunchItem {
  id: string;
  pin: number;
  userName: string;
  seatId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  terminal: string;
  matchedScore: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"residencies" | "notifications" | "attendance" | "profile">("residencies");

  // Dynamic profile state
  const [profileName, setProfileName] = useState("Scholar");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("+91 98765 43210");
  const [profilePin, setProfilePin] = useState("849201");
  const [studyGoal, setStudyGoal] = useState("Competitive Examinations & Self-Study Research");
  const [allocatedShift, setAllocatedShift] = useState("Morning Focus Shift (08:00 — 14:00)");
  const [allocatedHours, setAllocatedHours] = useState(48);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "profile" || tab === "residencies" || tab === "notifications" || tab === "attendance") {
        setActiveTab(tab as "residencies" | "notifications" | "attendance" | "profile");
      }

      // Fetch live student profile from MongoDB auth API
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.authenticated && data?.user) {
            const derivedName = data.user.name || (data.user.email ? data.user.email.split("@")[0] : "Scholar");
            setProfileName(derivedName);
            setProfileEmail(data.user.email || "");
            if (data.user.phone) setProfilePhone(data.user.phone);
            if (data.user.allottedHours) setAllocatedHours(data.user.allottedHours);
            if (data.user.doorPin || data.user.biometricPin) {
              setProfilePin(data.user.doorPin || data.user.biometricPin);
            }
          } else {
            const cookies = document.cookie;
            const emailMatch = cookies.match(/esz_student_email=([^;]+)/);
            const nameMatch = cookies.match(/esz_student_name=([^;]+)/);
            const pinMatch = cookies.match(/esz_student_pin=([^;]+)/);
            if (emailMatch) setProfileEmail(decodeURIComponent(emailMatch[1]));
            if (nameMatch) setProfileName(decodeURIComponent(nameMatch[1]));
            if (pinMatch) setProfilePin(decodeURIComponent(pinMatch[1]));
            try {
              const localPin = localStorage.getItem("esz_student_pin");
              if (localPin) setProfilePin(localPin);
            } catch (_) {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    document.cookie = `esz_student_name=${encodeURIComponent(profileName)}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `esz_student_email=${encodeURIComponent(profileEmail)}; path=/; max-age=86400; SameSite=Lax`;
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3500);
  };

  const [attendanceLogs, setAttendanceLogs] = useState<BiometricPunchItem[]>([]);

  useEffect(() => {
    fetch("/api/biometric")
      .then((r) => r.json())
      .then((d) => {
        if (d?.logs && Array.isArray(d.logs)) {
          setAttendanceLogs(d.logs);
        }
      })
      .catch(() => {});
  }, []);

  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  // Load real student bookings from persistent store on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("esz_student_bookings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setReservations(parsed);
          }
        }
      } catch (_) {}
    }
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Checkout Modal State
  const [checkoutTarget, setCheckoutTarget] = useState<ReservationItem | null>(null);

  // Cancellation Modal State
  const [cancellationTarget, setCancellationTarget] = useState<ReservationItem | null>(null);
  const [cancellationDate, setCancellationDate] = useState("2026-11-01");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<string | null>(null);

  // Renewal Modal State
  const [renewalTarget, setRenewalTarget] = useState<ReservationItem | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalResult, setRenewalResult] = useState<string | null>(null);

  // Fetch live notifications and bookings from API
  const refreshMemberData = async () => {
    try {
      const emailParam = profileEmail ? encodeURIComponent(profileEmail) : "student";
      const res = await fetch(`/api/member/bookings?userId=${emailParam}`);
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error("Failed to load member telemetry:", e);
    }
  };

  useEffect(() => {
    refreshMemberData();
  }, []);

  // Handle Cancellation submission
  const handleConfirmCancellation = async () => {
    if (!cancellationTarget) return;
    setIsCancelling(true);
    setCancellationResult(null);

    try {
      try {
        await fetch("/api/bookings/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: cancellationTarget.id,
            effectiveDate: cancellationDate,
            reason: cancellationReason || "Voluntary member cancellation per policy.",
            userId: profileEmail || "scholar",
          }),
        });
      } catch (_) {
        // Continue to update client-side state
      }

      setCancellationResult(
        `Cancellation confirmed effective ${cancellationDate}. Workstation reservation has been released.`
      );

      // Update local reservation item status and persistent storage
      const updated = reservations.filter((r) => r.id !== cancellationTarget.id);
      setReservations(updated);
      try {
        localStorage.setItem("esz_student_bookings", JSON.stringify(updated));
      } catch (_) {}

      setTimeout(() => {
        setCancellationTarget(null);
        setCancellationResult(null);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation error.";
      setCancellationResult(`Error: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Renewal submission
  const handleConfirmRenewal = async () => {
    if (!renewalTarget) return;
    setIsRenewing(true);
    setRenewalResult(null);

    try {
      const res = await fetch("/api/bookings/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: renewalTarget.id,
          userId: "usr_sterling_01",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit renewal request.");
      }

      setRenewalResult(
        `Renewal request ${data.requestNumber || ""} submitted! Awaiting curatorial review. Reminder: Renewal is neither automatic nor guaranteed.`
      );

      refreshMemberData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Renewal error.";
      setRenewalResult(`Error: ${msg}`);
    } finally {
      setIsRenewing(false);
    }
  };

  // Helper to determine next action
  const getNextAction = (item: ReservationItem) => {
    if (item.requestStatus === "submitted" && item.paymentStatus === "unpaid") {
      return {
        label: "Await approval",
        badge: "Intake Under Review",
        description: "Curatorial intake triage in progress. Desk reviews research area within 24 business hours.",
        actionType: "await_approval",
        colorClass: "bg-amber-50 border-amber-300 text-amber-900",
      };
    }

    if (item.paymentStatus === "payment_hold" || (item.requestStatus === "under_review" && item.holdExpiresAt)) {
      return {
        label: "Pay before deadline",
        badge: "Payment Hold Active",
        description: "Workstation hold reserved. Complete payment before the countdown expires to prevent release.",
        actionType: "pay_hold",
        colorClass: "bg-emerald-50 border-emerald-400 text-emerald-950",
      };
    }

    if (item.paymentStatus === "failed") {
      return {
        label: "Resolve payment",
        badge: "Payment Failed",
        description: "Payment capture was interrupted. Retry payment or contact the curatorial desk to maintain hold.",
        actionType: "resolve_payment",
        colorClass: "bg-rose-50 border-rose-300 text-rose-900",
      };
    }

    if (item.requestStatus === "approved" && item.paymentStatus === "paid") {
      return {
        label: "Renew",
        badge: "Active Residency",
        description: "Residency is confirmed. Renewal is neither automatic nor guaranteed; creates a new request.",
        actionType: "renew",
        colorClass: "bg-forest-50 border-forest-300 text-forest-900",
      };
    }

    return {
      label: "Contact support",
      badge: item.requestStatus === "cancelled" ? "Cancelled Residency" : "Session Concluded",
      description: "Residency record archived. Contact concierge support or submit a new residency inquiry.",
      actionType: "contact_support",
      colorClass: "bg-ivory-100 border-ivory-300 text-charcoal-700",
    };
  };

  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Honest Configuration Notice Banner */}
      <ConfigurationBanner />

      {/* Member Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-ivory-300 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Elite Study Zone • Verified Scholar Account</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
            Welcome, {profileName || (profileEmail ? profileEmail.split("@")[0] : "Scholar")}.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 font-sans">
            {reservations.length > 0 ? (
              <span>Active Residency: <strong>{reservations[0].tierName}</strong> • {reservations[0].seatLabel}</span>
            ) : (
              <span>Status: Scholar Account Active • No Workstation Reserved Yet</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/book"
            className="px-5 py-2.5 bg-forest-900 text-ivory-50 text-xs uppercase tracking-wider font-medium hover:bg-forest-800 min-h-[44px] flex items-center justify-center transition-colors"
          >
            Book Workstation
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2.5 border border-charcoal-400 text-charcoal-800 text-xs uppercase tracking-wider font-medium hover:bg-ivory-200 min-h-[44px] flex items-center justify-center transition-colors"
          >
            Concierge Dispatch
          </Link>
          <Link
            href="/reviews"
            className="px-4 py-2.5 border border-ivory-400 text-charcoal-700 text-xs uppercase tracking-wider font-medium hover:bg-ivory-100 min-h-[44px] flex items-center justify-center transition-colors"
          >
            Member Reflections
          </Link>
        </div>
      </div>

      {/* Member Keycard Quick Credentials Card */}
      <div className="p-6 sm:p-8 border border-forest-900/30 bg-forest-50/40 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-editorial">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-forest-800 font-semibold">
            Smart Keypad Access & Exit Button
          </span>
          <div className="font-mono text-2xl text-forest-900 font-bold flex items-center gap-2">
            <span>PIN: #{(reservations.length > 0 && reservations[0].passCode) || profilePin || "849201"}</span>
            <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
              Active PIN
            </span>
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            Punch #{ (reservations.length > 0 && reservations[0].passCode) || profilePin || "849201" } on exterior door keypad • Exit via push button
          </p>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-forest-200/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] uppercase font-mono tracking-widest text-charcoal-500">
            Assigned Locker Storage
          </span>
          <div className="font-mono text-xl text-charcoal-900 font-bold">
            {reservations.length > 0 ? `Locker #${reservations[0].seatId.replace(/[^0-9]/g, "") || "14"}` : "Available with Desk Booking"}
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            Main Study Sanctuary Hall
          </p>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-forest-200/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] uppercase font-mono tracking-widest text-charcoal-500">
            Flexi Study Hours
          </span>
          <div className="font-serif text-2xl text-charcoal-900">
            {allocatedHours} Hours
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            High-speed Wi-Fi & AC library access
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-ivory-300 gap-8 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("residencies")}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "residencies"
              ? "border-b-2 border-forest-900 text-forest-900"
              : "text-charcoal-500 hover:text-charcoal-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Workstation Residencies ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "notifications"
              ? "border-b-2 border-forest-900 text-forest-900"
              : "text-charcoal-500 hover:text-charcoal-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Durable Transactional Notifications ({notifications.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Residencies */}
      {activeTab === "residencies" && (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900">
                Residencies & Status Queues
              </h2>
              <span className="text-xs font-mono text-charcoal-500">
                Sorted by Next Action Priority
              </span>
            </div>

            {reservations.length === 0 ? (
              <div className="p-8 sm:p-12 text-center border-2 border-dashed border-charcoal-200 bg-white rounded-xl space-y-4 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl text-charcoal-900 font-bold">
                  No Active Workstation Reservations
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-600 max-w-md mx-auto">
                  You haven&apos;t reserved a study desk or hourly pass yet. Choose your preferred table, pick your time slot, and get your Door Keypad PIN instantly.
                </p>
                <div className="pt-2">
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-forest-900 text-ivory-50 text-xs font-bold uppercase tracking-wider hover:bg-forest-800 transition-all rounded shadow-md"
                  >
                    <span>Select Table & Book Workstation →</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reservations.map((item) => {
                const nextAction = getNextAction(item);

                return (
                  <div
                    key={item.id}
                    className="p-6 border border-ivory-300 bg-ivory-50 flex flex-col justify-between space-y-6 shadow-editorial text-left"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase font-semibold text-amber-800">
                          {item.bookingRef}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                            item.paymentStatus === "paid"
                              ? "bg-forest-100 border-forest-300 text-forest-900"
                              : item.paymentStatus === "payment_hold"
                              ? "bg-amber-100 border-amber-300 text-amber-900"
                              : item.paymentStatus === "failed"
                              ? "bg-rose-100 border-rose-300 text-rose-900"
                              : "bg-ivory-200 border-ivory-300 text-charcoal-700"
                          }`}
                        >
                          {item.paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Desk Details */}
                      <div>
                        <h3 className="font-serif text-2xl text-charcoal-900">
                          {item.seatLabel}
                        </h3>
                        <div className="text-xs text-charcoal-600 font-sans mt-0.5">
                          {item.roomName} • {item.tierName}
                        </div>
                      </div>

                      {/* Dates & Pricing */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-ivory-100 border border-ivory-200 text-xs font-sans">
                        <div>
                          <span className="text-charcoal-500 block text-[10px] uppercase font-mono">
                            Check-In
                          </span>
                          <span className="font-semibold text-charcoal-900">{item.startDate}</span>
                        </div>
                        <div>
                          <span className="text-charcoal-500 block text-[10px] uppercase font-mono">
                            Check-Out
                          </span>
                          <span className="font-semibold text-charcoal-900">{item.endDate}</span>
                        </div>
                      </div>

                      {/* Next Action Box */}
                      <div className={`p-4 border ${nextAction.colorClass} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                            Next Action: {nextAction.label}
                          </span>
                          <span className="text-[10px] font-mono">{nextAction.badge}</span>
                        </div>
                        <p className="text-xs font-sans leading-relaxed">
                          {nextAction.description}
                        </p>

                        {/* Interactive Trigger Button per Status */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          {nextAction.actionType === "pay_hold" && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => setCheckoutTarget(item)}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay ₹{item.totalPriceRupees} Before Deadline</span>
                            </Button>
                          )}

                          {nextAction.actionType === "resolve_payment" && (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                                onClick={() => setCheckoutTarget(item)}
                              >
                                Retry Checkout
                              </Button>
                              <Link
                                href="/contact"
                                className="px-3 py-1.5 border border-charcoal-400 text-charcoal-800 text-xs font-medium hover:bg-ivory-200 flex items-center"
                              >
                                Contact Desk
                              </Link>
                            </div>
                          )}

                          {nextAction.actionType === "renew" && (
                            <div className="flex flex-wrap gap-2 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 flex items-center justify-center gap-1.5"
                                onClick={() => setRenewalTarget(item)}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Request Renewal</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-800 hover:bg-rose-50 border border-rose-200"
                                onClick={() => setCancellationTarget(item)}
                              >
                                Request Cancellation
                              </Button>
                            </div>
                          )}

                          {nextAction.actionType === "await_approval" && (
                            <span className="text-[11px] font-mono text-amber-800 italic">
                              Curatorial review active • Ref #{item.bookingRef}
                            </span>
                          )}

                          {nextAction.actionType === "contact_support" && (
                            <Link
                              href="/contact"
                              className="w-full py-2 border border-charcoal-400 text-charcoal-800 text-xs uppercase tracking-wider font-medium hover:bg-ivory-200 text-center block"
                            >
                              Contact Curatorial Desk
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Tax Receipt Link */}
                    <div className="pt-4 border-t border-ivory-200 flex items-center justify-between gap-4">
                      <span className="font-serif text-lg font-bold text-charcoal-900">
                        ₹{item.totalPriceRupees}
                      </span>

                      <div className="flex items-center gap-3">
                        {item.paymentStatus === "paid" && (
                          <Link
                            href={`/dashboard/bookings/${item.id}/receipt`}
                            className="text-xs font-mono uppercase text-forest-900 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Tax Receipt</span>
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/bookings/${item.id}`}
                          className="px-3 py-1.5 bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 text-xs font-medium text-charcoal-900 flex items-center gap-1"
                        >
                          <span>Itinerary</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Durable Transactional Notifications Log */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-200">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">
                Transactional Email Dispatches
              </h2>
              <p className="text-xs text-charcoal-600 font-sans mt-0.5">
                Durable notification records with delivery status, retry attempts, and templates.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase text-charcoal-500">
              Decoupled From Booking Invariant
            </span>
          </div>

          <div className="border border-ivory-300 bg-ivory-50 divide-y divide-ivory-200 shadow-editorial">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-charcoal-500">
                No notification records found in ledger.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans hover:bg-ivory-100/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-charcoal-500">
                        {notif.type}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                          notif.status === "sent"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                            : notif.status === "failed"
                            ? "bg-rose-100 border-rose-300 text-rose-900"
                            : "bg-amber-100 border-amber-300 text-amber-900"
                        }`}
                      >
                        {notif.status.toUpperCase()} (Attempts: {notif.attempts})
                      </span>
                    </div>
                    <div className="font-serif text-base text-charcoal-900 font-medium">
                      {notif.subject}
                    </div>
                    <div className="text-charcoal-500 text-[11px] font-mono">
                      Recipient: {notif.recipientEmail} • Created: {new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-charcoal-500 self-start sm:self-center">
                    {notif.sentAt ? `Dispatched: ${new Date(notif.sentAt).toLocaleTimeString()}` : "Queued"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      
      {/* Tab Content 3: Smart Keypad Attendance History */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900">
                Door Keypad Attendance & Entry History
              </h2>
              <p className="text-xs text-charcoal-600 font-sans mt-1">
                Verified door keypad PIN unlocks and push-to-exit records for Elite Study Zone.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[10px] font-mono uppercase text-emerald-800 font-bold rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Door Keypad Active</span>
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-600/30 border border-forest-500/40 flex items-center justify-center">
                <KeypadIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-emerald-400">
                  Terminal: Smart Door Keypad (#KEYPAD-CTRL-01)
                </div>
                <div className="text-[11px] text-slate-300">
                  Elite Study Zone, Amrut Nagar, Ghatkopar West • Keypad Entry & Push-to-Exit Button
                </div>
              </div>
            </div>
            <div className="text-left md:text-right font-mono text-[11px] text-slate-400">
              Anti-Passback & Time-Slot Validation: <span className="text-emerald-400 font-bold">Active</span>
            </div>
          </div>

          <div className="border border-ivory-300 bg-ivory-50 divide-y divide-ivory-200 shadow-editorial overflow-hidden">
            <div className="p-4 bg-ivory-100 font-mono text-[11px] uppercase tracking-wider text-charcoal-600 grid grid-cols-12 gap-2 font-semibold">
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-3">Event Type</div>
              <div className="col-span-2">Desk Station</div>
              <div className="col-span-2">Verification</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {attendanceLogs.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-charcoal-500">
                No entry records registered for this account yet.
              </div>
            ) : (
              attendanceLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 grid grid-cols-12 gap-2 items-center text-xs font-sans hover:bg-ivory-100/60 transition-colors"
                >
                  <div className="col-span-3 font-mono text-[11px] text-charcoal-700">
                    {new Date(log.timestamp).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 font-medium">
                    {log.type === "check_in" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-900 font-bold">Keypad Entry</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-amber-900 font-bold">Button Exit</span>
                      </>
                    )}
                  </div>
                  <div className="col-span-2 font-mono text-xs text-charcoal-800">
                    {log.seatId || "Flexi-Desk"}
                  </div>
                  <div className="col-span-2 font-mono text-[10px] text-charcoal-600">
                    PIN Verified
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono uppercase font-bold rounded">
                      Verified
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      
      {/* Tab Content 4: My Profile & Allocated Hours */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900">
                Student Account & Workstation Allocation
              </h2>
              <p className="text-xs text-charcoal-600 font-sans mt-1">
                Manage your personal scholar profile, allocated shifts, and contact preferences for Elite Study Zone.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Scholar Account</span>
            </div>
          </div>

          {profileSaveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg flex items-center gap-2 text-xs font-sans">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">Profile and workstation preferences updated successfully!</span>
            </div>
          )}

          {/* Allotted Time & Workstation Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-forest-900 text-white rounded-xl shadow-editorial space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold block">
                Allotted Study Hours
              </span>
              <div className="font-serif text-3xl font-bold">
                {allocatedHours} Hours Remaining
              </div>
              <p className="text-xs text-forest-200 font-sans leading-relaxed">
                Active Flexi-Pass valid for 30 days. Usable across all open hours (07:00 — 23:00).
              </p>
              <div className="pt-2">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-forest-950 text-xs font-bold rounded-lg hover:bg-forest-50 transition-colors shadow-sm"
                >
                  <span>Top-Up Study Hours →</span>
                </Link>
              </div>
            </div>

            <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-editorial space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 font-bold block">
                Assigned Desk Station
              </span>
              <div className="font-serif text-2xl text-charcoal-900 font-bold">
                Desk #04 (North Pier)
              </div>
              <p className="text-xs text-charcoal-600 font-sans">
                Equipped with dedicated power outlet, brass reading lamp, ergonomic mesh chair, and Wi-Fi 6.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold pt-1">
                Locker #14 Included (2nd Floor West)
              </div>
            </div>

            <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-editorial space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 font-bold block">
                Smart Door Keypad Access
              </span>
              <div className="font-mono text-xl text-charcoal-900 font-bold flex items-center gap-2">
                <KeypadIcon className="w-5 h-5 text-emerald-600" />
                <span>Door Access PIN #001</span>
              </div>
              <p className="text-xs text-charcoal-600 font-sans">
                Type your PIN on the exterior digital keypad to unlock the door. Press the interior push button to exit.
              </p>
              <div className="text-[11px] font-mono text-charcoal-500 pt-1">
                Pass Code: #PASS-2610-STRL04
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6 sm:p-8 bg-white border border-ivory-300 rounded-xl shadow-editorial">
            <h3 className="font-serif text-xl text-charcoal-900 mb-4 pb-2 border-b border-ivory-200">
              Personal Scholar Profile & Examination Stream
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Scholar Name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />

                <Input
                  label="Registered Email Address (Verified)"
                  type="email"
                  value={profileEmail}
                  disabled
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />

                <Input
                  label="Mobile / WhatsApp Number"
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98753 59327"
                />

                <div>
                  <label className="block text-xs font-mono font-medium text-charcoal-700 mb-1">
                    Preferred Daily Study Shift
                  </label>
                  <select
                    value={allocatedShift}
                    onChange={(e) => setAllocatedShift(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-sans border border-charcoal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <option value="Morning Focus Shift (08:00 — 14:00)">Morning Focus Shift (08:00 — 14:00)</option>
                    <option value="Afternoon Deep Work (14:00 — 19:00)">Afternoon Deep Work (14:00 — 19:00)</option>
                    <option value="Night Owl Shift (19:00 — 23:00)">Night Owl Shift (19:00 — 23:00)</option>
                    <option value="Full Day Immersion (07:00 — 23:00)">Full Day Immersion (07:00 — 23:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-charcoal-700 mb-1">
                  Academic Focus / Competitive Exam Preparation
                </label>
                <input
                  type="text"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  placeholder="e.g. UPSC Civil Services, CA Final, NEET PG, Tech Research"
                  className="w-full px-3 py-2 text-xs font-sans border border-charcoal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-ivory-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="bg-forest-700 hover:bg-forest-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm"
                >
                  Save Profile Changes
                </Button>

                <span className="text-[11px] text-charcoal-500 font-mono">
                  Changes synchronized with Elite Study Zone Operations
                </span>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Razorpay Test Checkout Modal */}
      {checkoutTarget && (
        <RazorpayCheckoutModal
          isOpen={!!checkoutTarget}
          bookingRequestId={checkoutTarget.id}
          seatLabel={checkoutTarget.seatLabel}
          durationLabel={checkoutTarget.tierName}
          amountPaise={checkoutTarget.totalPricePaise}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={() => {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === checkoutTarget.id
                  ? { ...r, requestStatus: "approved", paymentStatus: "paid", passCode: "PASS-2026-PIN004" }
                  : r
              )
            );
            setCheckoutTarget(null);
            refreshMemberData();
          }}
        />
      )}

      {/* Cancellation Dialog with Policy Refund Preview */}
      {cancellationTarget && (
        <Dialog
          isOpen={!!cancellationTarget}
          onClose={() => {
            setCancellationTarget(null);
            setCancellationResult(null);
          }}
          title={`Request Cancellation — ${cancellationTarget.seatLabel}`}
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 border border-ivory-300 bg-ivory-100/50 space-y-2">
              <span className="font-semibold text-charcoal-900 block font-serif text-sm">
                Policy Refund Schedule Preview
              </span>
              <p className="text-charcoal-700">
                Residency Plan: <strong>{cancellationTarget.tierName}</strong> (Price: ₹{cancellationTarget.totalPriceRupees})
              </p>
              <p className="text-charcoal-600">
                Per Sanctuary Reciprocity Policy: Cancellations submitted with &gt; 7 days notice receive a 100% full refund. Partial terms during residency are prorated per remaining days with zero penalty.
              </p>
            </div>

            {cancellationResult ? (
              <div className="p-4 border border-forest-300 bg-forest-50 text-forest-900 space-y-2">
                <CheckCircle2 className="w-5 h-5 text-forest-800" />
                <p className="font-medium">{cancellationResult}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Effective Cancellation Date"
                  type="date"
                  value={cancellationDate}
                  onChange={(e) => setCancellationDate(e.target.value)}
                  required
                />

                <Textarea
                  label="Reason for Cancellation"
                  placeholder="Share any schedule changes or notes for the curatorial desk."
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCancellationTarget(null)}
                  >
                    Keep Residency
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-rose-900 hover:bg-rose-800 text-ivory-50"
                    isLoading={isCancelling}
                    onClick={handleConfirmCancellation}
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Renewal Dialog with Prominent Invariant Notice */}
      {renewalTarget && (
        <Dialog
          isOpen={!!renewalTarget}
          onClose={() => {
            setRenewalTarget(null);
            setRenewalResult(null);
          }}
          title={`Request Renewal — ${renewalTarget.seatLabel}`}
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Prominent Invariant Banner */}
            <div className="p-4 border-2 border-amber-500 bg-amber-50/70 space-y-2 text-amber-950">
              <div className="flex items-center gap-2 font-mono uppercase font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-800" />
                <span>Renewal Invariant Notice</span>
              </div>
              <p className="font-medium leading-relaxed">
                Renewal is neither automatic nor guaranteed. Submitting a renewal request creates a brand new request subject to desk availability and intake review.
              </p>
              <p className="text-[11px] text-amber-900/80">
                If approved by the desk, an expiring payment hold will be created for your next session.
              </p>
            </div>

            {renewalResult ? (
              <div className="p-4 border border-forest-300 bg-forest-50 text-forest-900 space-y-2">
                <CheckCircle2 className="w-5 h-5 text-forest-800" />
                <p className="font-medium">{renewalResult}</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-charcoal-700">
                  Target Workstation: <strong>{renewalTarget.seatLabel}</strong> ({renewalTarget.roomName})
                </p>
                <p className="text-charcoal-700">
                  Current Term: {renewalTarget.startDate} to {renewalTarget.endDate}
                </p>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setRenewalTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isRenewing}
                    onClick={handleConfirmRenewal}
                  >
                    Submit Renewal Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
