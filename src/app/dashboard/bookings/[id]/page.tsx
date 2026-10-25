"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Printer, Receipt, CreditCard } from "lucide-react";
import { bookingsFixture, locationFixture } from "@/fixtures";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { RazorpayCheckoutModal } from "@/components/payments/RazorpayCheckoutModal";

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const booking =
    bookingsFixture.find((b) => b.id === bookingId) || bookingsFixture[0];

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<string | null>(null);

  const handleCancelConfirm = () => {
    setCancelStatus("Your cancellation request has been accepted. Refund will credit in 3-5 days per policy.");
    setTimeout(() => {
      setIsCancelDialogOpen(false);
    }, 1500);
  };

  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-charcoal-600 hover:text-charcoal-950 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Member Dashboard</span>
        </Link>
      </div>

      {/* Header Ledger */}
      <div className="p-8 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
              Sanctuary Itinerary Ledger
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal-900 mt-1">
              {booking.seatLabel}
            </h1>
            <p className="text-xs text-charcoal-600 font-sans mt-0.5">
              Ref: <span className="font-mono">{booking.bookingRef}</span> • Guest: {booking.memberName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} size="md" />
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 border border-ivory-300 hover:bg-ivory-100 min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal-700"
              aria-label="Print voucher"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {cancelStatus && (
          <div className="p-4 border border-amber-300 bg-amber-50 text-amber-900 text-xs font-sans">
            {cancelStatus}
          </div>
        )}

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
          <div className="p-4 bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500">Residency Tier</span>
            <div className="font-serif text-lg text-charcoal-900">{booking.tierName}</div>
            <p className="text-charcoal-600">Full membership privileges applied</p>
          </div>

          <div className="p-4 bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500">Residency Timeline</span>
            <div className="font-mono text-sm text-charcoal-900 font-bold">
              {booking.checkInDate} → {booking.checkOutDate}
            </div>
            <p className="text-charcoal-600">Arrival window: {booking.arrivalWindow}</p>
          </div>

          <div className="p-4 bg-ivory-100/60 border border-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-charcoal-500">Total Contribution</span>
            <div className="font-serif text-lg font-bold text-charcoal-900">
              ${booking.totalAmount} {booking.currency}
            </div>
            <p className="text-charcoal-600">Paid in full via invoice</p>
          </div>
        </div>

        {/* Bespoke Concierge Notes */}
        <div className="p-6 border border-ivory-200 bg-ivory-100/40 space-y-3 text-xs font-sans">
          <div className="text-[10px] uppercase font-mono text-amber-800 font-semibold tracking-wider">
            Concierge Arrival Instructions
          </div>
          <p className="text-charcoal-800 leading-relaxed">
            {booking.conciergeNotes || "Your workstation is positioned for morning natural illumination. Locker brass key provided at the front loggia desk."}
          </p>
          {booking.specialRequests && (
            <p className="text-charcoal-600 italic">
              Special accommodations noted: “{booking.specialRequests}”
            </p>
          )}
        </div>

        {/* Location & Access Directions */}
        <div className="p-6 border border-ivory-200 bg-ivory-50 space-y-2 text-xs font-sans">
          <div className="font-semibold text-charcoal-900">
            {locationFixture.name}
          </div>
          <p className="text-charcoal-600">
            {locationFixture.addressLine1}, {locationFixture.addressLine2}, {locationFixture.city}
          </p>
          <p className="text-charcoal-500 font-mono text-[11px]">
            Biometric Scanner: Active 24/7 with assigned PIN #8021
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCheckoutOpen(true)}
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Pay via Razorpay (TEST)
            </Button>
            <Link
              href={`/dashboard/bookings/${booking.id}/receipt`}
              className="px-3 py-1.5 border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 text-charcoal-900 text-xs uppercase tracking-wider font-medium inline-flex items-center gap-1.5 min-h-[38px]"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-800" />
              <span>Tax Receipt</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModifyDialogOpen(true)}
            >
              Modify Dates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-800 hover:text-red-950 hover:bg-red-50"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel Reservation
            </Button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download Physical Voucher
          </Button>
        </div>
      </div>

      {/* Razorpay Standard Checkout Modal */}
      <RazorpayCheckoutModal
        bookingRequestId={booking.id}
        seatLabel={booking.seatLabel}
        durationLabel={booking.tierName}
        amountPaise={booking.totalAmount * 100 * 83}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setIsCheckoutOpen(false);
        }}
      />

      {/* Cancellation Dialog */}
      <Dialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Confirm Reservation Cancellation"
        description="Review policy terms regarding your refund eligibility."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Reservation
            </Button>
            <Button variant="danger" size="sm" onClick={handleCancelConfirm}>
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans text-charcoal-800">
          <p>
            You are requesting to cancel reservation <strong>{booking.bookingRef}</strong> ({booking.seatLabel}).
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            Per our Refund Policy, cancellations submitted at least 24 hours prior to commencement receive a 100% refund credited back to the original funding source.
          </div>
        </div>
      </Dialog>

      {/* Modify Dialog */}
      <Dialog
        isOpen={isModifyDialogOpen}
        onClose={() => setIsModifyDialogOpen(false)}
        title="Modify Residency Timeline"
        description="Select an alternate commencement date for this reservation."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsModifyDialogOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModifyDialogOpen(false)}>
              Submit Modification
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans text-charcoal-800">
          <p>
            Contact our desk or pick a new commencement date below:
          </p>
          <input
            type="date"
            defaultValue={booking.checkInDate}
            className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-sm font-sans"
          />
          <p className="text-charcoal-500 text-[11px]">
            Date modifications are subject to desk availability in the North Gallery.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
