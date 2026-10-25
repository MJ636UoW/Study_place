"use client";

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"residencies" | "notifications">("residencies");

  // Reservations list
  const [reservations, setReservations] = useState<ReservationItem[]>([
    {
      id: "BK-8021",
      bookingRef: "SNC-2026-8021",
      seatId: "desk-04",
      seatLabel: "Permanent Desk 04",
      roomName: "North Study Gallery",
      tierName: "Resident Atelier (Month)",
      startDate: "2026-10-20",
      endDate: "2026-11-20",
      requestStatus: "approved",
      paymentStatus: "paid",
      totalPricePaise: 3800000,
      totalPriceRupees: "38,000.00",
      passCode: "PASS-2610-STRL04",
    },
    {
      id: "REQ-HOLD-01",
      bookingRef: "REQ-2026-HOLD-01",
      seatId: "desk-06",
      seatLabel: "Desk 06 (East Window Pier)",
      roomName: "North Study Gallery",
      tierName: "Day Sanctuary Pass",
      startDate: "2026-11-05",
      endDate: "2026-11-05",
      requestStatus: "under_review",
      paymentStatus: "payment_hold",
      totalPricePaise: 375000,
      totalPriceRupees: "3,750.00",
      holdExpiresAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    },
    {
      id: "REQ-PENDING-02",
      bookingRef: "REQ-2026-PEND-02",
      seatId: "desk-08",
      seatLabel: "Desk 08 (Courtyard Overlook)",
      roomName: "North Study Gallery",
      tierName: "Resident Atelier (Month)",
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      requestStatus: "submitted",
      paymentStatus: "unpaid",
      totalPricePaise: 3800000,
      totalPriceRupees: "38,000.00",
    },
    {
      id: "REQ-FAIL-03",
      bookingRef: "REQ-2026-FAIL-03",
      seatId: "desk-02",
      seatLabel: "Desk 02 (Library Stacks)",
      roomName: "North Study Gallery",
      tierName: "Day Sanctuary Pass",
      startDate: "2026-10-28",
      endDate: "2026-10-28",
      requestStatus: "under_review",
      paymentStatus: "failed",
      totalPricePaise: 375000,
      totalPriceRupees: "3,750.00",
    },
    {
      id: "BK-8015",
      bookingRef: "SNC-2026-8015",
      seatId: "desk-09",
      seatLabel: "Desk 09 (East Pier)",
      roomName: "North Study Gallery",
      startDate: "2026-09-15",
      endDate: "2026-10-15",
      tierName: "Resident Atelier (Month)",
      requestStatus: "cancelled",
      paymentStatus: "refunded",
      totalPricePaise: 3800000,
      totalPriceRupees: "38,000.00",
    },
  ]);

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
      const res = await fetch("/api/member/bookings?userId=usr_sterling_01");
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
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: cancellationTarget.id,
          effectiveDate: cancellationDate,
          reason: cancellationReason || "Voluntary member cancellation per policy.",
          userId: "usr_sterling_01",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process cancellation.");
      }

      setCancellationResult(
        `Cancellation confirmed effective ${cancellationDate}. Prorated refund credited: ₹${data.proratedRefundRupees || "0.00"}.`
      );

      // Update local reservation item status
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancellationTarget.id
            ? { ...r, requestStatus: "cancelled", paymentStatus: "refunded" }
            : r
        )
      );

      refreshMemberData();
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
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
            <span>Member Sanctuary • Fellow Identification No. FL-4190</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
            Welcome back, Fellow Sterling.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 font-sans">
            Active Residency: Resident Atelier • North Gallery (Permanent Desk 04)
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
            Biometric & Keycard Access
          </span>
          <div className="font-serif text-2xl text-charcoal-900">
            Entrance Key: #PASS-2610-STRL04
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            Active 24 Hours / 7 Days • Central Studio North Gallery Entrance
          </p>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-forest-200/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] uppercase font-mono tracking-widest text-charcoal-500">
            Assigned Cedar Storage
          </span>
          <div className="font-mono text-xl text-charcoal-900 font-bold">
            Locker #14 (Brass Key)
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            Second Floor West Mezzanine
          </p>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-forest-200/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] uppercase font-mono tracking-widest text-charcoal-500">
            Guest Pass Credit
          </span>
          <div className="font-serif text-2xl text-charcoal-900">
            3 Remaining
          </div>
          <p className="text-xs text-charcoal-600 font-sans">
            Renewed on the 1st of each calendar month
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
                  ? { ...r, requestStatus: "approved", paymentStatus: "paid" }
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
