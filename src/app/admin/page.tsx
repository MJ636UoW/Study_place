"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldAlert,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserX,
  Wrench,
  MessageSquare,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { ConfigurationBanner } from "@/components/ui/ConfigurationBanner";
import { AdminService, AuditEvent, EnquiryItem, ModeratedReview } from "@/lib/admin/adminService";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { bookingsFixture } from "@/fixtures";

export default function AdminPage() {
  // Operational Navigation
  const [activeQueue, setActiveQueue] = useState<
    "pending" | "holds" | "attendance" | "endings" | "exceptions" | "enquiries" | "reviews" | "audit"
  >("pending");

  // Live state from AdminService & BookingEngine
  const [financial, setFinancial] = useState(AdminService.getFinancialBreakdown());
  const [pendingRequests, setPendingRequests] = useState(AdminService.getPendingRequests());
  const [expiringHolds, setExpiringHolds] = useState(AdminService.getExpiringHolds());
  const [selectedDate, setSelectedDate] = useState("2026-10-25");
  const [reservedSeats, setReservedSeats] = useState(AdminService.getReservedSeatsForDate("2026-10-25"));
  const [upcomingEndings, setUpcomingEndings] = useState(AdminService.getUpcomingEndings(7, "2026-10-25"));
  const [exceptions, setExceptions] = useState(AdminService.getPaymentExceptions());
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(AdminService.getEnquiries());
  const [reviews, setReviews] = useState<ModeratedReview[]>(AdminService.getReviews());
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(AdminService.getAuditHistory());
  const [plans, setPlans] = useState(AdminService.getPlans());

  // Staff identity
  const staffId = "staff_curator_1";

  // Dialog states
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [isRestrictOpen, setIsRestrictOpen] = useState(false);
  const [isEnquiryReplyOpen, setIsEnquiryReplyOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [enquiryReplyText, setEnquiryReplyText] = useState("");

  // Operation Forms
  const [walkInSeat, setWalkInSeat] = useState("seat-N01");
  const [walkInGuest, setWalkInGuest] = useState("");
  const [walkInStart, setWalkInStart] = useState("2026-10-26");
  const [walkInEnd, setWalkInEnd] = useState("2026-11-02");

  const [cashReqId, setCashReqId] = useState("");
  const [cashRef, setCashRef] = useState("CASH-2026-");
  const [cashAmountPaise, setCashAmountPaise] = useState(3800000);
  const [cashNotes, setCashNotes] = useState("Collected in person at Curatorial loggia desk.");

  const [selectedPlanId, setSelectedPlanId] = useState("tier-resident");
  const [newPlanPriceUSD, setNewPlanPriceUSD] = useState(380);
  const [newPlanName, setNewPlanName] = useState("");

  const [maintSeat, setMaintSeat] = useState("seat-A02");
  const [maintStart, setMaintStart] = useState("2026-11-01");
  const [maintEnd, setMaintEnd] = useState("2026-11-07");
  const [maintReason, setMaintReason] = useState("Timber conditioning and acoustic panel realigning");

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("user-resident-1");
  const [restrictType, setRestrictType] = useState<"suspension" | "ban">("suspension");
  const [restrictDurationDays, setRestrictDurationDays] = useState(14);
  const [restrictReason, setRestrictReason] = useState("Acoustic noise threshold repeated violation");
  const [restrictRefundDecision, setRestrictRefundDecision] = useState<"initiate_refund" | "forfeit_per_terms" | "manual_review">("manual_review");
  const [restrictConfirmed, setRestrictConfirmed] = useState(false);

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const refreshAllState = () => {
    setFinancial(AdminService.getFinancialBreakdown());
    setPendingRequests(AdminService.getPendingRequests());
    setExpiringHolds(AdminService.getExpiringHolds());
    setReservedSeats(AdminService.getReservedSeatsForDate(selectedDate));
    setUpcomingEndings(AdminService.getUpcomingEndings(7, selectedDate));
    setExceptions(AdminService.getPaymentExceptions());
    setEnquiries(AdminService.getEnquiries());
    setReviews(AdminService.getReviews());
    setAuditLog(AdminService.getAuditHistory());
    setPlans(AdminService.getPlans());
  };

  useEffect(() => {
    setReservedSeats(AdminService.getReservedSeatsForDate(selectedDate));
    setUpcomingEndings(AdminService.getUpcomingEndings(7, selectedDate));
  }, [selectedDate]);

  // Handlers for Queues
  const handleApproveRequest = async (requestId: string) => {
    const res = await AdminService.approveRequest(requestId, staffId, 15);
    if (res.success) {
      showToast(`Hold Approved: Station reserved under 15-minute expiring hold (Pass: ${res.passCode}).`);
      refreshAllState();
    } else {
      showToast(`Approval Failed: ${res.message}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt("State curatorial reason for rejection:") || "Curatorial desk review decision";
    const res = await AdminService.rejectRequest(requestId, staffId, reason);
    if (res.success) {
      showToast("Request rejected and hold released safely.");
      refreshAllState();
    }
  };

  const handleAttendance = (allocId: string, status: "attending" | "completed") => {
    AdminService.recordAttendance(allocId, status, staffId);
    showToast(`Physical Attendance Updated: ${status === "attending" ? "Member Checked In" : "Session Completed"}.`);
    refreshAllState();
  };

  const handleDispatchRefund = async (refundId: string) => {
    const res = await AdminService.dispatchRefund(refundId, staffId);
    if (res.success) {
      showToast(res.message);
      refreshAllState();
    }
  };

  const handleModerateReview = (reviewId: string, status: "approved" | "hidden") => {
    AdminService.moderateReview(reviewId, status, staffId);
    showToast(`Review visibility set to: ${status}.`);
    refreshAllState();
  };

  const handleSendEnquiryReply = () => {
    if (!selectedEnquiry) return;
    AdminService.respondToEnquiry(selectedEnquiry.id, enquiryReplyText, staffId);
    showToast(`Response dispatched to ${selectedEnquiry.email}.`);
    setIsEnquiryReplyOpen(false);
    setEnquiryReplyText("");
    refreshAllState();
  };

  // Operations dialog submissions
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AdminService.createWalkIn({
      seatId: walkInSeat,
      userId: `user-walkin-${Date.now()}`,
      guestName: walkInGuest || "Walk-in Scholar",
      startDate: walkInStart,
      endDate: walkInEnd,
      staffId,
    });
    if (res.success) {
      showToast(`Walk-in residency confirmed! Pass: ${res.passCode}`);
      setIsWalkInOpen(false);
      setWalkInGuest("");
      refreshAllState();
    } else {
      showToast(`Walk-in failed: ${res.message}`);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AdminService.recordCashPayment({
      bookingRequestId: cashReqId,
      staffId,
      receiptRef: cashRef,
      amountPaise: Number(cashAmountPaise),
      notes: cashNotes,
    });
    if (res.success) {
      showToast(`Cash payment verified & pass active! Pass: ${res.passCode}`);
      setIsCashOpen(false);
      refreshAllState();
    } else {
      showToast(`Cash recording failed: ${res.message}`);
    }
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AdminService.updatePlan(
      selectedPlanId,
      { priceUSD: Number(newPlanPriceUSD), name: newPlanName || undefined },
      staffId
    );
    if (res.success) {
      showToast("Plan updated! Historical price snapshots of prior bookings remain preserved.");
      setIsPlanOpen(false);
      refreshAllState();
    }
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AdminService.addMaintenanceBlock(maintSeat, maintStart, maintEnd, maintReason, staffId);
    if (res.success) {
      showToast(res.message);
      setIsMaintOpen(false);
      refreshAllState();
    }
  };

  const handleRestrictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restrictConfirmed) {
      alert("Please confirm the destructive action checkbox after reviewing affected bookings.");
      return;
    }
    const res = AdminService.restrictAccount({
      userId: selectedUserId,
      type: restrictType,
      durationDays: restrictType === "suspension" ? Number(restrictDurationDays) : undefined,
      reason: restrictReason,
      refundDecision: restrictRefundDecision,
      staffId,
    });
    if (res.success) {
      showToast(res.message);
      setIsRestrictOpen(false);
      setRestrictConfirmed(false);
      refreshAllState();
    }
  };

  const restrictionPreview = AdminService.getAccountRestrictionPreview(selectedUserId);

  return (
    <div className="w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 font-sans">
      <ConfigurationBanner />

      {/* Status Toast Alert */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 border border-forest-400 bg-forest-900 text-ivory-50 shadow-2xl text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ivory-300 gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
            <span>Curatorial Oversight • Internal Operations</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
            Curator Ledger
          </h1>
          <p className="text-xs text-charcoal-600 font-sans">
            Real-time management of admissions, physical quietude, cash collections, and security governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/mfa"
            className="px-3 py-2 border border-amber-600/40 bg-amber-50 text-amber-900 text-xs font-mono flex items-center gap-1.5 hover:bg-amber-100 min-h-[44px]"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>MFA Security (AAL2)</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWalkInOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
          >
            Walk-in Admission
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCashOpen(true)}
            leftIcon={<Banknote className="w-3.5 h-3.5" />}
          >
            Record Cash
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlanOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Edit Plans
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaintOpen(true)}
            leftIcon={<Wrench className="w-3.5 h-3.5" />}
          >
            Maintenance
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsRestrictOpen(true)}
            leftIcon={<UserX className="w-3.5 h-3.5" />}
          >
            Ban / Suspend
          </Button>
        </div>
      </div>

      {/* Financial Breakdown Grid (Strict Accounting Separation) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <CreditCard className="w-3.5 h-3.5 text-forest-700" />
            <span>Digital Captured</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            ₹{financial.digitalRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Razorpay provider settlements</p>
        </div>

        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <Banknote className="w-3.5 h-3.5 text-amber-800" />
            <span>Cash Collections</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            ₹{financial.cashRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Desk receipt audit logs</p>
        </div>

        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-burgundy-700" />
            <span>Dispatched Refunds</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            ₹{financial.refundsRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Processed per policy</p>
        </div>

        <div className="p-5 border border-forest-300 bg-forest-50/60 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-forest-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Net Collections</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">
            ₹{financial.netRupees}
          </div>
          <p className="text-[10px] text-forest-800">Total net curatorial receipts</p>
        </div>
      </div>

      {/* Prioritized Action Queues Navigation Bar */}
      <div className="border border-ivory-300 bg-ivory-100/60 p-1.5 flex items-center gap-1 overflow-x-auto">
        {[
          { id: "pending", label: "Pending Intake", count: pendingRequests.length },
          { id: "holds", label: "Expiring Holds", count: expiringHolds.length },
          { id: "attendance", label: "Seat & Attendance", count: reservedSeats.length },
          { id: "endings", label: "Upcoming Expirations", count: upcomingEndings.length },
          { id: "exceptions", label: "Payment Exceptions", count: exceptions.totalExceptionsCount },
          { id: "enquiries", label: "Inbound Enquiries", count: enquiries.filter((e) => e.status === "new").length },
          { id: "reviews", label: "Review Moderation", count: reviews.length },
          { id: "audit", label: "Audit Ledger", count: auditLog.length },
        ].map((tab) => {
          const isActive = activeQueue === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveQueue(tab.id as typeof activeQueue)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
                isActive
                  ? "bg-forest-900 text-ivory-50 shadow-editorial font-bold"
                  : "bg-ivory-50 text-charcoal-700 hover:bg-ivory-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? "bg-amber-600 text-ivory-50" : "bg-ivory-300 text-charcoal-900"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* QUEUE 1: PENDING INTAKE REQUESTS */}
      {activeQueue === "pending" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Pending Intake Requests</h2>
              <p className="text-xs text-charcoal-600">
                Student submissions awaiting curatorial approval. Approval atomically verifies availability and establishes a 15-minute expiring hold.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No pending intake requests at this time. All submissions processed.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900">{req.requestNumber}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] uppercase">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-charcoal-900 font-semibold font-serif text-sm">
                      {req.guestNotes || "Member Applicant"} ({req.userId})
                    </div>
                    <div className="font-mono text-charcoal-600 text-[11px]">
                      Workstation: <strong>{req.seatId}</strong> • Interval: {req.startDate} → {req.endDate}
                    </div>
                    <div className="font-mono text-forest-900 font-bold">
                      Price Snapshot: ₹{(req.totalPricePaise / 100).toFixed(2)} ({req.totalPricePaise} paise)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveRequest(req.id)}
                    >
                      Approve Hold (15 Min)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-800 hover:bg-red-50 hover:text-red-950"
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 2: EXPIRING PAYMENT HOLDS */}
      {activeQueue === "holds" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Expiring Curatorial Payment Holds</h2>
              <p className="text-xs text-charcoal-600">
                Workstations reserved temporarily for payment completion. Automatically released upon expiry.
              </p>
            </div>
          </div>

          {expiringHolds.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No active payment holds in countdown.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {expiringHolds.map((hold) => {
                const minutesLeft = Math.max(1, Math.round(((hold.holdExpiresAt || 0) - Date.now()) / 60000));
                return (
                  <div key={hold.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-900 font-serif text-base">{hold.seatId}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {minutesLeft} min</span>
                        </span>
                      </div>
                      <div className="text-charcoal-700">Guest Scholar: {hold.userId}</div>
                      <div className="text-charcoal-500 text-[11px]">
                        Pass Code: {hold.passCode} • Dates: {hold.startDate} → {hold.endDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCashReqId(hold.bookingRequestId);
                          setIsCashOpen(true);
                        }}
                      >
                        Settle via Cash
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          BookingEngine.releaseExpiredHolds();
                          showToast("Hold released prematurely per curator instruction.");
                          refreshAllState();
                        }}
                      >
                        Release Seat
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 3: SEAT CALENDAR & ATTENDANCE */}
      {activeQueue === "attendance" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-4">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Seat Calendar & Daily Attendance</h2>
              <p className="text-xs text-charcoal-600">
                Distinguishes contractual workstation reservations from physical scholar check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <label htmlFor="calendar-date" className="text-charcoal-700 font-bold flex items-center gap-1">
                <Calendar className="w-4 h-4 text-forest-800" />
                <span>Date:</span>
              </label>
              <input
                id="calendar-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-ivory-300 bg-ivory-100 text-charcoal-900 font-mono text-xs"
              />
            </div>
          </div>

          {reservedSeats.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No active reservations or walk-ins recorded for {selectedDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-ivory-200/60 font-mono text-[10px] uppercase tracking-wider text-charcoal-700 border-b border-ivory-300">
                  <tr>
                    <th className="p-3">Workstation</th>
                    <th className="p-3">Guest Fellow</th>
                    <th className="p-3">Tenure Range</th>
                    <th className="p-3">Reservation State</th>
                    <th className="p-3">Physical Attendance</th>
                    <th className="p-3 text-right">Concierge Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 font-mono text-xs text-charcoal-800">
                  {reservedSeats.map((seat) => (
                    <tr key={seat.id} className="hover:bg-ivory-100/50">
                      <td className="p-3 font-bold text-charcoal-950">{seat.seatId}</td>
                      <td className="p-3 text-charcoal-700 font-sans">{seat.userId}</td>
                      <td className="p-3 text-charcoal-600 text-[11px]">{seat.startDate} → {seat.endDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-forest-100 text-forest-900 text-[10px] uppercase font-bold">
                          {seat.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                            seat.attendanceStatus === "attending"
                              ? "bg-emerald-200 text-emerald-950 font-black"
                              : seat.attendanceStatus === "completed"
                              ? "bg-charcoal-200 text-charcoal-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {seat.attendanceStatus === "attending"
                            ? "In Studio (Checked In)"
                            : seat.attendanceStatus === "completed"
                            ? "Checked Out"
                            : "Reserved (Expected)"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {seat.attendanceStatus !== "attending" && seat.attendanceStatus !== "completed" && (
                            <button
                              type="button"
                              onClick={() => handleAttendance(seat.id, "attending")}
                              className="px-2.5 py-1 bg-forest-900 text-ivory-50 text-[10px] uppercase hover:bg-forest-800 min-h-[38px]"
                            >
                              Check In
                            </button>
                          )}
                          {seat.attendanceStatus === "attending" && (
                            <button
                              type="button"
                              onClick={() => handleAttendance(seat.id, "completed")}
                              className="px-2.5 py-1 border border-charcoal-400 text-charcoal-900 text-[10px] uppercase hover:bg-ivory-200 min-h-[38px]"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUEUE 4: UPCOMING MEMBERSHIP EXPIRATIONS */}
      {activeQueue === "endings" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Upcoming Membership Expirations</h2>
              <p className="text-xs text-charcoal-600">
                Fellowships concluding within the next 7 days for turnover or renewal dispatch.
              </p>
            </div>
          </div>

          {upcomingEndings.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No memberships terminating within 7 days of {selectedDate}.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {upcomingEndings.map((ending) => (
                <div key={ending.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-base font-serif font-bold text-charcoal-900">
                      Station: {ending.seatId} ({ending.userId})
                    </div>
                    <div className="text-charcoal-600">
                      Concludes: <strong className="text-amber-900">{ending.endDate}</strong> (Pass: {ending.passCode})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showToast(`Renewal intake opened for ${ending.userId}. Contiguous next tenure created.`);
                      }}
                    >
                      Offer Renewal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 5: PAYMENT & REFUND EXCEPTIONS */}
      {activeQueue === "exceptions" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Payment & Refund Exceptions</h2>
              <p className="text-xs text-charcoal-600">
                Late captured payments routed to refunds, failed attempts, and pending disbursements.
              </p>
            </div>
          </div>

          {exceptions.pendingRefunds.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No outstanding payment or refund exceptions. All ledgers balanced.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {exceptions.pendingRefunds.map((ref) => (
                <div key={ref.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-burgundy-900">{ref.id}</span>
                      <span className="px-2 py-0.5 bg-burgundy-100 text-burgundy-900 text-[10px] uppercase font-bold">
                        {ref.status}
                      </span>
                    </div>
                    <div className="text-charcoal-900 font-bold">
                      Amount: ₹{(ref.amountPaise / 100).toFixed(2)} ({ref.amountPaise} paise)
                    </div>
                    <p className="text-charcoal-600 font-sans text-xs">{ref.reason}</p>
                    <div className="text-[11px] text-charcoal-500">Provider Payment ID: {ref.paymentAttemptId}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ref.status === "requested" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDispatchRefund(ref.id)}
                        className="bg-burgundy-800 hover:bg-burgundy-900 text-ivory-50"
                      >
                        Dispatch to Razorpay
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 6: INBOUND CONCIERGE ENQUIRIES */}
      {activeQueue === "enquiries" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Inbound Concierge Enquiries</h2>
              <p className="text-xs text-charcoal-600">
                Prospective scholar dispatches requiring curatorial response.
              </p>
            </div>
          </div>

          <div className="divide-y divide-ivory-200">
            {enquiries.map((enq) => (
              <div key={enq.id} className="py-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-charcoal-950">{enq.fullName}</span>
                    <span className="font-mono text-charcoal-500">({enq.email})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                      enq.status === "new" ? "bg-amber-200 text-amber-950" : "bg-forest-100 text-forest-900"
                    }`}
                  >
                    {enq.status}
                  </span>
                </div>
                <div className="font-serif text-sm font-semibold text-charcoal-900">{enq.topic}</div>
                <p className="text-charcoal-700 italic leading-relaxed">“{enq.message}”</p>
                {enq.curatorResponse && (
                  <div className="p-3 bg-ivory-200/60 border border-ivory-300 font-mono text-[11px] text-charcoal-800">
                    Curator Reply: {enq.curatorResponse}
                  </div>
                )}
                {enq.status === "new" && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setIsEnquiryReplyOpen(true);
                      }}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Draft Curatorial Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUEUE 7: REVIEW MODERATION */}
      {activeQueue === "reviews" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Member Testimonial Moderation</h2>
              <p className="text-xs text-charcoal-600">
                Curate public testimonials displayed across admissions and residency pages.
              </p>
            </div>
          </div>

          <div className="divide-y divide-ivory-200">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-charcoal-950">{rev.author}</span>
                    <span className="text-charcoal-500 font-sans">({rev.role})</span>
                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                        rev.status === "approved" ? "bg-forest-100 text-forest-900" : "bg-red-100 text-red-900"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <p className="text-charcoal-700 italic">“{rev.quote}”</p>
                  <div className="font-mono text-[11px] text-charcoal-500">{rev.membershipTenure}</div>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status === "approved" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-800 hover:bg-red-50"
                      onClick={() => handleModerateReview(rev.id, "hidden")}
                    >
                      Hide Review
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleModerateReview(rev.id, "approved")}
                    >
                      Approve & Publish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUEUE 8: IMMUTABLE AUDIT HISTORY */}
      {activeQueue === "audit" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900 flex items-center gap-2">
                <History className="w-5 h-5 text-forest-800" />
                <span>Immutable Curatorial Audit Ledger</span>
              </h2>
              <p className="text-xs text-charcoal-600 font-sans">
                Chronological proof log recording who changed what, when, and why. Tamper-evident record.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-ivory-200/60 text-[10px] uppercase tracking-wider text-charcoal-700 border-b border-ivory-300">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Staff Actor</th>
                  <th className="p-3">Operation Action</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">Curatorial Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 text-charcoal-800 text-[11px]">
                {auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-ivory-100/50">
                    <td className="p-3 text-charcoal-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-charcoal-950">{log.actorId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-ivory-200 text-charcoal-900 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-charcoal-700">{log.resourceType}: {log.resourceId}</td>
                    <td className="p-3 text-charcoal-600 font-sans">{log.reason || "Operational routine"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          OPERATIONAL ACTION DIALOGS
          ========================================================================= */}

      {/* 1. Walk-In Admission Dialog */}
      <Dialog
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title="Immediate Walk-in Admission"
        description="Assign a fellow directly to an open workstation without prior online application."
        maxWidth="lg"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs font-sans text-left">
          <Input
            label="Guest Fellow Full Name"
            value={walkInGuest}
            onChange={(e) => setWalkInGuest(e.target.value)}
            required
            placeholder="e.g. Julian Hayes"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="walkin-seat" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
                Workstation Seat
              </label>
              <select
                id="walkin-seat"
                value={walkInSeat}
                onChange={(e) => setWalkInSeat(e.target.value)}
                className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              >
                <option value="seat-N01">seat-N01 (North Study)</option>
                <option value="seat-A01">seat-A01 (North Gallery)</option>
                <option value="seat-A03">seat-A03 (North Gallery)</option>
                <option value="seat-S01">seat-S01 (Library Stacks)</option>
              </select>
            </div>
            <div>
              <Input
                label="Commencement Date"
                type="date"
                value={walkInStart}
                onChange={(e) => setWalkInStart(e.target.value)}
                required
              />
            </div>
          </div>
          <Input
            label="Conclusion Date"
            type="date"
            value={walkInEnd}
            onChange={(e) => setWalkInEnd(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsWalkInOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Issue Walk-in Pass</Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Cash Payment Recording Dialog */}
      <Dialog
        isOpen={isCashOpen}
        onClose={() => setIsCashOpen(false)}
        title="Record In-Person Cash Settlement"
        description="Register currency received at the Curatorial Desk and advance workstation hold to active."
        maxWidth="lg"
      >
        <form onSubmit={handleCashSubmit} className="space-y-4 text-xs font-sans text-left">
          <Input
            label="Booking Request Reference ID"
            value={cashReqId}
            onChange={(e) => setCashReqId(e.target.value)}
            required
            placeholder="e.g. req-seed-1 or request number"
          />
          <Input
            label="Physical Cash Voucher / Receipt Reference"
            value={cashRef}
            onChange={(e) => setCashRef(e.target.value)}
            required
          />
          <Input
            label="Amount in Integer Paise (e.g. 3800000 = ₹38,000)"
            type="number"
            value={cashAmountPaise}
            onChange={(e) => setCashAmountPaise(Number(e.target.value))}
            required
          />
          <Textarea
            label="Desk Curator Audit Notes"
            value={cashNotes}
            onChange={(e) => setCashNotes(e.target.value)}
            rows={2}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCashOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Record Cash & Issue Pass</Button>
          </div>
        </form>
      </Dialog>

      {/* 3. Edit Membership Plans Dialog */}
      <Dialog
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        title="Edit Membership Tier Rates"
        description="Update plan rates for future bookings. Prior booking price snapshots remain strictly preserved."
        maxWidth="lg"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4 text-xs font-sans text-left">
          <div className="p-3 bg-forest-50 border border-forest-300 text-forest-950 font-mono text-[11px]">
            Immutability Covenant: Modifying rates here will never alter price snapshots of existing submissions or confirmed memberships.
          </div>
          <div>
            <label htmlFor="plan-tier-select" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
              Select Plan Tier
            </label>
            <select
              id="plan-tier-select"
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value);
                const p = plans.find((pl) => pl.id === e.target.value);
                if (p) {
                  setNewPlanPriceUSD(p.price);
                  setNewPlanName(p.name);
                }
              }}
              className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price} USD / {p.cadence})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Tier Display Title"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="e.g. Resident Atelier (Revised Rate)"
          />
          <Input
            label="New Rate (USD)"
            type="number"
            value={newPlanPriceUSD}
            onChange={(e) => setNewPlanPriceUSD(Number(e.target.value))}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsPlanOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Plan Rates</Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Maintenance Scheduling Dialog */}
      <Dialog
        isOpen={isMaintOpen}
        onClose={() => setIsMaintOpen(false)}
        title="Schedule Workstation Maintenance Block"
        description="Block a workstation from availability for acoustic, joinery, or electrical maintenance."
        maxWidth="lg"
      >
        <form onSubmit={handleMaintSubmit} className="space-y-4 text-xs font-sans text-left">
          <div>
            <label htmlFor="maint-seat-select" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
              Select Workstation
            </label>
            <select
              id="maint-seat-select"
              value={maintSeat}
              onChange={(e) => setMaintSeat(e.target.value)}
              className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
            >
              <option value="seat-A02">seat-A02 (North Gallery)</option>
              <option value="seat-A04">seat-A04 (North Gallery)</option>
              <option value="seat-S02">seat-S02 (Library Stacks)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Block Start Date"
              type="date"
              value={maintStart}
              onChange={(e) => setMaintStart(e.target.value)}
              required
            />
            <Input
              label="Block End Date"
              type="date"
              value={maintEnd}
              onChange={(e) => setMaintEnd(e.target.value)}
              required
            />
          </div>
          <Input
            label="Architectural Maintenance Reason"
            value={maintReason}
            onChange={(e) => setMaintReason(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsMaintOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule Block</Button>
          </div>
        </form>
      </Dialog>

      {/* 5. Destructive Account Ban / Suspension Dialog with Financial Preview */}
      <Dialog
        isOpen={isRestrictOpen}
        onClose={() => setIsRestrictOpen(false)}
        title="Account Restriction & Ban Enforcement"
        description="Inspect affected bookings and financial implications before enforcing restrictions."
        maxWidth="xl"
      >
        <form onSubmit={handleRestrictSubmit} className="space-y-4 text-xs font-sans text-left">
          {/* Member Selector / Search */}
          <div>
            <label htmlFor="member-search-input" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
              Search Member Account
            </label>
            <div className="flex gap-2">
              <input
                id="member-search-input"
                type="text"
                placeholder="Search by name, email, or ref..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bookingsFixture.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedUserId(`user-${b.memberEmail.split("@")[0]}`)}
                  className={`px-2 py-1 text-[10px] font-mono border ${
                    selectedUserId.includes(b.memberEmail.split("@")[0])
                      ? "bg-charcoal-900 text-ivory-50 border-charcoal-900"
                      : "bg-ivory-100 text-charcoal-700 hover:bg-ivory-200 border-ivory-300"
                  }`}
                >
                  {b.memberName}
                </button>
              ))}
            </div>
          </div>

          {/* Affected Bookings Preview Warning Box */}
          <div className="p-4 border-2 border-burgundy-600 bg-burgundy-50 text-burgundy-950 space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-burgundy-900">
              <ShieldAlert className="w-4 h-4 text-burgundy-700" />
              <span>Affected Bookings & Access Passes Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>Target Scholar ID: <span className="font-bold">{selectedUserId}</span></div>
              <div>Active Passes To Revoke: <span className="font-bold">{restrictionPreview.activeAllocationsCount}</span></div>
              <div>Active Financial Value: <span className="font-bold">₹{restrictionPreview.totalActiveValueRupees}</span></div>
            </div>
            <p className="text-[11px] leading-relaxed">
              Enforcing this action immediately revokes active biometric keys and cancels upcoming holds server-side.
            </p>
          </div>

          {/* Policy Decision Options */}
          <div className="space-y-2">
            <label className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700">
              Approved Policy Decision on Remaining Funds
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "initiate_refund", label: "Initiate Refund", desc: "Route unserved balance to refund queue per policy terms." },
                { id: "forfeit_per_terms", label: "Forfeit per Terms", desc: "Gross quietude covenant breach without refund." },
                { id: "manual_review", label: "Manual Review", desc: "Defer to Separate Refund Management review." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRestrictRefundDecision(opt.id as typeof restrictRefundDecision)}
                  className={`p-2.5 border text-left flex flex-col justify-between ${
                    restrictRefundDecision === opt.id
                      ? "border-burgundy-900 bg-burgundy-100/60 ring-1 ring-burgundy-900"
                      : "border-ivory-300 bg-ivory-50 hover:bg-ivory-100"
                  }`}
                >
                  <span className="font-bold font-mono text-xs text-charcoal-900">{opt.label}</span>
                  <span className="text-[10px] text-charcoal-600 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Severity & Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="restriction-type-select" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
                Restriction Severity
              </label>
              <select
                id="restriction-type-select"
                value={restrictType}
                onChange={(e) => setRestrictType(e.target.value as "suspension" | "ban")}
                className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              >
                <option value="suspension">Temporary Suspension</option>
                <option value="ban">Permanent Account Ban</option>
              </select>
            </div>
            {restrictType === "suspension" && (
              <Input
                label="Duration (Days)"
                type="number"
                value={restrictDurationDays}
                onChange={(e) => setRestrictDurationDays(Number(e.target.value))}
                required
              />
            )}
          </div>

          <Textarea
            label="Curatorial Reason for Audit Record"
            value={restrictReason}
            onChange={(e) => setRestrictReason(e.target.value)}
            required
            rows={2}
          />

          {/* Destructive Action Checkbox Confirmation */}
          <div className="p-3 border border-amber-400 bg-amber-50 text-amber-950 flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-destructive"
              checked={restrictConfirmed}
              onChange={(e) => setRestrictConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="confirm-destructive" className="text-[11px] leading-tight">
              I confirm that I have reviewed the affected bookings, active passes, and financial implications. This action takes immediate effect across active member sessions.
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsRestrictOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              type="submit"
              disabled={!restrictConfirmed}
            >
              Enforce Restriction Server-Side
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 6. Inbound Enquiry Reply Dialog */}
      <Dialog
        isOpen={isEnquiryReplyOpen}
        onClose={() => setIsEnquiryReplyOpen(false)}
        title="Draft Concierge Dispatch"
        description="Send an official curatorial reply to a prospective scholar."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs font-sans text-left">
          <div className="p-3 bg-ivory-100 border border-ivory-300 font-mono text-[11px]">
            <div>To: <strong>{selectedEnquiry?.fullName} ({selectedEnquiry?.email})</strong></div>
            <div>Topic: {selectedEnquiry?.topic}</div>
            <div className="mt-1 italic">“{selectedEnquiry?.message}”</div>
          </div>
          <Textarea
            label="Curatorial Reply Message"
            rows={4}
            value={enquiryReplyText}
            onChange={(e) => setEnquiryReplyText(e.target.value)}
            placeholder="Address accommodation details, acoustic certificates, or studio policies..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEnquiryReplyOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendEnquiryReply}>Dispatch Reply</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
