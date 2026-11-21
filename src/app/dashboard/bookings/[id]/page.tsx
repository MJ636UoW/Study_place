"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Receipt, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { RazorpayCheckoutModal } from "@/components/payments/RazorpayCheckoutModal";

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = (params?.id as string) || "BK-CURRENT";

  const [booking, setBooking] = useState<{
    id: string;
    bookingRef: string;
    seatId: string;
    seatLabel: string;
    roomName: string;
    tierName: string;
    startDate: string;
    endDate: string;
    totalPriceRupees: string;
    passCode: string;
    paymentStatus?: string;
  } | null>(null);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("esz_student_bookings");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          const match = list.find((b: any) => b.id === bookingId || b.bookingRef === bookingId);
          if (match) {
            setBooking(match);
            return;
          } else if (list[0]) {
            setBooking(list[0]);
            return;
          }
        }
      }
    } catch (_) {}

    // Fallback active booking
    setBooking({
      id: bookingId,
      bookingRef: `ESZ-${bookingId.substring(0, 8).toUpperCase()}`,
      seatId: "desk-04",
      seatLabel: "Workstation Desk 04",
      roomName: "Main Study Sanctuary",
      tierName: "Monthly Resident Pass",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      totalPriceRupees: "2,299.00",
      passCode: "849201",
      paymentStatus: "paid",
    });
  }, [bookingId]);

  const activeBooking = booking || {
    id: bookingId,
    bookingRef: `ESZ-${bookingId.substring(0, 6).toUpperCase()}`,
    seatId: "desk-04",
    seatLabel: "Workstation Desk 04",
    roomName: "Main Study Sanctuary",
    tierName: "Monthly Resident Pass",
    startDate: "2026-11-20",
    endDate: "2026-12-20",
    totalPriceRupees: "2,299.00",
    passCode: "849201",
    paymentStatus: "paid",
  };

  const handleCancelConfirm = () => {
    try {
      const stored = localStorage.getItem("esz_student_bookings");
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((b: any) => b.id !== activeBooking.id);
        localStorage.setItem("esz_student_bookings", JSON.stringify(filtered));
      }
    } catch (_) {}

    setCancelStatus("Your cancellation request has been confirmed. Workstation released.");
    setTimeout(() => {
      setIsCancelDialogOpen(false);
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-charcoal-700 hover:text-forest-900 font-bold min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Student Dashboard</span>
        </Link>
      </div>

      {/* Header Ledger */}
      <div className="p-8 border border-charcoal-300 bg-white shadow-lg rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal-200">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-800 font-bold">
              Elite Study Zone • Workstation Itinerary
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal-900 font-bold mt-1">
              {activeBooking.seatLabel}
            </h1>
            <p className="text-xs text-charcoal-600 font-sans mt-0.5">
              Ref: <span className="font-mono font-bold text-charcoal-800">{activeBooking.bookingRef}</span> • Zone: {activeBooking.roomName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-mono font-bold uppercase">
              {activeBooking.paymentStatus === "paid" ? "Confirmed (Active)" : "Payment Pending"}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 border border-charcoal-300 rounded-lg hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal-700 transition-colors"
              aria-label="Print voucher"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {cancelStatus && (
          <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-950 text-xs font-bold rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{cancelStatus}</span>
          </div>
        )}

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500 font-bold">Membership Tier</span>
            <div className="font-serif text-lg text-charcoal-900 font-bold">{activeBooking.tierName}</div>
            <p className="text-charcoal-600 text-[11px]">Full workstation & Wi-Fi privileges active</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500 font-bold">Residency Timeline</span>
            <div className="font-mono text-sm text-charcoal-900 font-bold">
              {activeBooking.startDate} → {activeBooking.endDate}
            </div>
            <p className="text-charcoal-600 text-[11px]">24/7 Digital Touch Keypad Entry</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500 font-bold">Total Contribution</span>
            <div className="font-serif text-lg font-bold text-emerald-900">
              ₹{activeBooking.totalPriceRupees} INR
            </div>
            <p className="text-charcoal-600 text-[11px]">Settled & captured electronically</p>
          </div>
        </div>

        {/* Keypad & Access Instructions */}
        <div className="p-6 border border-emerald-300 bg-emerald-50 rounded-xl space-y-3 text-xs font-sans">
          <div className="text-[10px] uppercase font-mono text-emerald-900 font-bold tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Door Access Keypad Credentials</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-emerald-900 leading-relaxed text-xs">
              Punch your unique 6-digit PIN on the entrance door touch keypad to unlock. To leave the facility, press the stainless steel push-to-exit button next to the door.
            </p>
            <div className="px-4 py-2 bg-white border border-emerald-400 font-mono font-black text-emerald-950 text-lg rounded-lg shadow-sm">
              #{activeBooking.passCode}
            </div>
          </div>
        </div>

        {/* Location & Access Directions */}
        <div className="p-5 border border-charcoal-200 bg-slate-50 rounded-xl space-y-1.5 text-xs font-sans">
          <div className="font-bold text-charcoal-900">
            Elite Study Zone (Self-Study Space & Focus Hub)
          </div>
          <p className="text-charcoal-600">
            Amrut Nagar, Ghatkopar West, Mumbai, Maharashtra 400086
          </p>
          <p className="text-charcoal-500 font-mono text-[11px]">
            Helpline: +91 98753 59327 | support@elitestudyzone.in
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-charcoal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/bookings/${activeBooking.id}/receipt`}
              className="px-4 py-2 bg-forest-950 text-white rounded-lg text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1.5 min-h-[40px] hover:bg-forest-900 transition-colors shadow-sm"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Official Tax Receipt</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-700 hover:text-red-900 hover:bg-red-50"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Request Cancellation
            </Button>
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <Dialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Confirm Workstation Cancellation"
        description="Release this workstation reservation per policy guidelines."
        footer={
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="danger" onClick={handleCancelConfirm}>
              Confirm & Release Desk
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs font-sans text-charcoal-700">
          <p>
            Are you sure you want to cancel your reservation for <strong>{activeBooking.seatLabel}</strong>?
          </p>
          <p className="text-charcoal-500 text-[11px]">
            Your allocated Door Access Keypad PIN will be deactivated and the seat will become available for other scholars.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
