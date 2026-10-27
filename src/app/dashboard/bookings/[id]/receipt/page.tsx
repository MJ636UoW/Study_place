"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { bookingsFixture } from "@/fixtures";
import { BookingEngine } from "@/lib/booking/bookingEngine";

export default function BookingReceiptPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  // 1. Fetch from fixtures or engine allocations
  const fixtureBooking = bookingsFixture.find((b) => b.id === bookingId) || bookingsFixture[0];
  const allEngineAllocations = BookingEngine.getAllAllocations();
  const engineAlloc = allEngineAllocations.find(
    (a) => a.bookingRequestId === bookingId || a.id === bookingId
  );
  const allEngineRequests = BookingEngine.getAllRequests();
  const engineReq = allEngineRequests.find((r) => r.id === bookingId);

  // Monetary calculation
  const amountPaise = engineReq?.totalPricePaise || fixtureBooking.totalAmount * 100 * 83; // approx paise
  const amountRupees = (amountPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const basePricePaise = Math.round(amountPaise / 1.18);
  const basePriceRupees = (basePricePaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const gstPaise = amountPaise - basePricePaise;
  const gstRupees = (gstPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const receiptNumber = `TAX-REC-2026-${bookingId?.substring(0, 8).toUpperCase() || "7F4B01"}`;
  const paymentRef = `pay_rzp_test_${bookingId?.substring(0, 6) || "9a8b7c"}`;
  const orderRef = `order_sanctuary_${bookingId?.substring(0, 6) || "4d5e6f"}`;
  const passCode = engineAlloc?.passCode || "PASS-2610-8A7B2C";

  return (
    <div className="w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
      {/* Non-printed navigation bar */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-charcoal-600 hover:text-charcoal-950 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Booking Ledger</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-wider font-medium hover:bg-charcoal-800 inline-flex items-center gap-2 min-h-[44px]"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>

      {/* Main Printable Tax Invoice Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 sm:p-12 border-2 border-ivory-300 bg-ivory-50 shadow-editorial space-y-10 print:border-none print:shadow-none print:p-0"
      >
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b-2 border-charcoal-900">
          <div>
            <div className="font-serif text-3xl sm:text-4xl text-charcoal-950 font-bold tracking-tight">
              SANCTUARY
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-amber-900 mt-1">
              Curatorial Workstation Residency • Tax Invoice & Payment Receipt
            </div>
            <p className="text-xs text-charcoal-600 mt-2 max-w-sm leading-relaxed">
              3rd Floor, Growel&apos;s 101 Mall Annex, Akurli Road, Kandivali East, Mumbai, Maharashtra 400101, India.
              <br />
              GSTIN: <span className="font-mono">27ABCDE1234F1Z5</span> • SAC Code: <span className="font-mono">998399</span>
            </p>
          </div>

          <div className="sm:text-right space-y-1 font-mono text-xs">
            <div className="text-[10px] uppercase tracking-wider text-charcoal-500">Receipt Document</div>
            <div className="font-bold text-charcoal-950 text-sm">{receiptNumber}</div>
            <div className="text-charcoal-700">Date: 25 Oct 2026 (IST)</div>
            <div className="text-[11px] text-charcoal-500">UTC: 2026-10-25T06:00:00Z</div>
          </div>
        </div>

        {/* State Separation Markers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-ivory-100/70 border border-ivory-300 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500">Booking State</span>
            <div className="flex items-center gap-1.5 font-bold text-forest-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Confirmed</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500">Allocation State</span>
            <div className="flex items-center gap-1.5 font-bold text-forest-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Active Residency</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500">Payment Status</span>
            <div className="flex items-center gap-1.5 font-bold text-forest-900">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Captured (TEST Mode)</span>
            </div>
          </div>
        </div>

        {/* Bill To & Workstation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-sans">
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] uppercase font-bold text-charcoal-600 tracking-wider">
              Issued To (Member)
            </div>
            <div className="font-serif text-lg text-charcoal-950 font-bold">
              {fixtureBooking.memberName}
            </div>
            <div className="text-charcoal-700 font-mono text-xs">{fixtureBooking.memberEmail}</div>
            <div className="text-charcoal-600 text-xs">Resident Scholar Account: <span className="font-mono">usr_sanctuary_02</span></div>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="text-[10px] uppercase font-bold text-charcoal-600 tracking-wider">
              Allocated Workstation
            </div>
            <div className="font-serif text-lg text-charcoal-950 font-bold font-sans">
              {fixtureBooking.seatLabel} ({fixtureBooking.roomName})
            </div>
            <div className="text-charcoal-700 text-xs">
              Tenure: {fixtureBooking.checkInDate} to {fixtureBooking.checkOutDate}
            </div>
            <div className="text-charcoal-700 text-xs">
              Access Code: <strong className="text-charcoal-950">{passCode}</strong>
            </div>
          </div>
        </div>

        {/* Financial Line Items Table */}
        <div className="border border-ivory-300">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-ivory-200/60 font-mono text-[10px] uppercase tracking-wider text-charcoal-700 border-b border-ivory-300">
              <tr>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-center">SAC Code</th>
                <th className="p-3.5 text-right">Taxable Value</th>
                <th className="p-3.5 text-right">GST (18%)</th>
                <th className="p-3.5 text-right">Total (Paise)</th>
                <th className="p-3.5 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 font-mono text-xs text-charcoal-800">
              <tr>
                <td className="p-3.5 font-sans font-medium text-charcoal-950">
                  {fixtureBooking.tierName} Workstation Tenure
                  <div className="text-[11px] text-charcoal-500 font-sans mt-0.5">
                    Dedicated desk, acoustic isolation, fiber-optic link, 24/7 keycard privileges
                  </div>
                </td>
                <td className="p-3.5 text-center">998399</td>
                <td className="p-3.5 text-right">₹{basePriceRupees}</td>
                <td className="p-3.5 text-right">₹{gstRupees}</td>
                <td className="p-3.5 text-right">{amountPaise}</td>
                <td className="p-3.5 text-right font-bold text-charcoal-950">₹{amountRupees}</td>
              </tr>
            </tbody>
            <tfoot className="bg-ivory-100 font-mono border-t border-ivory-300 text-xs">
              <tr>
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-charcoal-600 font-sans font-bold">
                  Total Paid:
                </td>
                <td className="p-3 text-right font-bold text-forest-900">{amountPaise} p</td>
                <td className="p-3 text-right font-bold text-forest-900 text-sm">₹{amountRupees}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Razorpay Gateway Audit Trail */}
        <div className="p-4 border border-ivory-300 bg-ivory-100/50 space-y-2 text-xs font-mono">
          <div className="text-[10px] uppercase font-bold text-charcoal-700 tracking-wider">
            Gateway Audit Ledger (Razorpay Standard Checkout)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-charcoal-800">
            <div>Provider Order ID: <span className="font-bold text-charcoal-950">{orderRef}</span></div>
            <div>Provider Payment ID: <span className="font-bold text-charcoal-950">{paymentRef}</span></div>
            <div>Gateway Mode: <span className="text-amber-800 font-bold">TEST MODE (No real charges)</span></div>
            <div>Signature Algorithm: <span className="text-charcoal-600">HMAC-SHA256 (Server-verified)</span></div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-ivory-300 text-[11px] text-charcoal-600 leading-relaxed font-sans">
          <p>
            * This document represents an electronic tax invoice generated upon successful provider settlement verification in TEST mode. Sanctuary memberships are fixed-term tenures governed by curatorial house rules and acoustic standards.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
