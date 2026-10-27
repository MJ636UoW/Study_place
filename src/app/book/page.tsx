"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Compass,
  ListFilter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import {
  DurationType,
  DURATION_RULES,
  calculateEndDate,
  formatDisplayDate,
  formatDate,
} from "@/lib/dateUtils";
import {
  Seat,
  SeatAvailability,
  HoldResponse,
} from "@/lib/bookingAdapter";
import { realBookingAdapter as bookingAdapter } from "@/lib/booking/bookingEngine";
import { SvgRoomMap } from "@/components/book/SvgRoomMap";
import { AccessibleSeatList } from "@/components/book/AccessibleSeatList";
import { SeatInspector } from "@/components/book/SeatInspector";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RazorpayCheckoutModal } from "@/components/payments/RazorpayCheckoutModal";
import { motion } from "motion/react";

function BookDemoContent() {
  // 1. Duration & Date selection
  const [duration, setDuration] = useState<DurationType>("month");
  const [startDate, setStartDate] = useState<string>("2026-10-28");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // 2. Data State from Replaceable Adapter
  const [availabilities, setAvailabilities] = useState<SeatAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Selection & Inspector State
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 4. Request / Hold Submission State
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState<boolean>(false);
  const [isSubmittingHold, setIsSubmittingHold] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>("Arjun Kulkarni");
  const [guestEmail, setGuestEmail] = useState<string>("arjun.kulkarni@outlook.com");
  const [guestNotes, setGuestNotes] = useState<string>("");
  const [holdResult, setHoldResult] = useState<HoldResponse | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Compute exact calculated end date based on documented calendar rules
  const calculatedEndDate = useMemo(() => {
    return calculateEndDate(startDate, duration);
  }, [startDate, duration]);

  // Query Replaceable Adapter whenever dates or duration change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    bookingAdapter
      .checkAvailability({
        startDate,
        endDate: calculatedEndDate,
        duration,
      })
      .then((data) => {
        if (!cancelled) {
          setAvailabilities(data);
          setIsLoading(false);

          // If previously selected seat is now unavailable for newly chosen dates, notify
          if (selectedSeat) {
            const currentAvail = data.find((a) => a.seat.id === selectedSeat.id);
            if (currentAvail && currentAvail.status === "unavailable") {
              // Keep selected but update inspector warning
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to query sanctuary availability. Adapter error.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, calculatedEndDate, duration, selectedSeat]);

  // Handle seat selection
  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsInspectorOpen(true);
  };

  // Quick date presets
  const handleDatePreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setStartDate(formatDate(d));
  };

  // Selected seat availability details
  const selectedAvailability = useMemo(() => {
    if (!selectedSeat) return null;
    return availabilities.find((a) => a.seat.id === selectedSeat.id) || null;
  }, [selectedSeat, availabilities]);

  // Current duration rule
  const currentDurationRule = useMemo(() => {
    return DURATION_RULES.find((r) => r.id === duration) || DURATION_RULES[2];
  }, [duration]);

  // Total available count
  const availableCount = useMemo(() => {
    return availabilities.filter((a) => a.status === "available").length;
  }, [availabilities]);

  // Submit Hold Simulation
  const handleConfirmHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;

    setIsSubmittingHold(true);
    try {
      const res = await bookingAdapter.submitHold({
        seatId: selectedSeat.seatNumber,
        startDate,
        endDate: calculatedEndDate,
        duration,
        guestName,
        guestEmail,
        specialRequests: guestNotes,
      });

      res.totalPrice = currentDurationRule.basePrice;
      setHoldResult(res);
      setIsSubmittingHold(false);
    } catch {
      setIsSubmittingHold(false);
      alert("Error submitting hold request.");
    }
  };

  return (
    <div className="w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* =========================================================================
          EXPLICIT DEMO PROTOTYPE NOTICE BANNER
          ========================================================================= */}
      <div className="p-4 sm:p-5 border-2 border-amber-600 bg-amber-50 text-amber-950 shadow-editorial">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-600 text-ivory-50 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase font-mono tracking-widest font-bold text-amber-900">
                Explicit Demo Prototype • Simulated Reservation Engine
              </div>
              <p className="text-xs font-sans text-amber-900 leading-relaxed">
                Prices, dates, and seat availability are <strong>simulated demo assumptions</strong>. No payment is taken, no binding contract is created, and real bookings are not placed until confirmed by the Curatorial Desk.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-amber-200/80 border border-amber-400 font-semibold">
              Replaceable Fixture Adapter
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HEADER: THE STEP FLOW
          ========================================================================= */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Sanctuary Desk Intake</span>
          <span>•</span>
          <span>Step Sequence I — IV</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
          Reserve Your Workstation
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700 leading-relaxed">
          Select membership duration → choose start date → inspect available seats → select seat → review request.
        </p>
      </div>

      {/* =========================================================================
          STEP 1 & STEP 2: DURATION & DATES CONTROLS
          ========================================================================= */}
      <div className="p-6 sm:p-8 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-200 gap-2">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-semibold">
              Step 1 & 2 • Tenure & Timeline
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal-900">
              Membership Duration & Commencement
            </h2>
          </div>

          <div className="text-xs font-mono text-charcoal-500">
            Availability calculated across full duration
          </div>
        </div>

        {/* Step 1: Duration Selector Buttons */}
        <div className="space-y-2">
          <label className="block text-xs uppercase font-mono text-charcoal-700 tracking-wider">
            Choose Membership Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {DURATION_RULES.map((rule) => {
              const isSelected = duration === rule.id;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setDuration(rule.id)}
                  className={`p-3.5 border text-left transition-all min-h-[44px] flex flex-col justify-between ${
                    isSelected
                      ? "border-forest-900 bg-forest-50 ring-1 ring-forest-900 shadow-editorial"
                      : "border-ivory-300 bg-ivory-100/50 hover:bg-ivory-100"
                  }`}
                >
                  <div>
                    <div className="font-serif text-sm font-semibold text-charcoal-900">
                      {rule.label}
                    </div>
                    <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
                      {rule.sublabel}
                    </div>
                  </div>
                  <div className="pt-2 text-xs font-mono font-bold text-forest-900">
                    ₹{rule.basePrice} <span className="font-normal text-[10px] text-charcoal-500">INR</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date Picker & Calendar Engine Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-ivory-200 items-end">
          {/* Start Date Input */}
          <div className="md:col-span-4 space-y-2">
            <label htmlFor="start-date-input" className="block text-xs uppercase font-mono text-charcoal-700 tracking-wider">
              Commencement Date
            </label>
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-ivory-50 text-charcoal-900 border border-ivory-300 rounded-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            />
            {/* Quick date shortcuts */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-charcoal-600">
              <span>Quick:</span>
              <button
                type="button"
                onClick={() => handleDatePreset(0)}
                className="underline hover:text-forest-900 min-h-[30px] flex items-center"
              >
                Today
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleDatePreset(1)}
                className="underline hover:text-forest-900 min-h-[30px] flex items-center"
              >
                Tomorrow
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleDatePreset(7)}
                className="underline hover:text-forest-900 min-h-[30px] flex items-center"
              >
                +1 Week
              </button>
            </div>
          </div>

          {/* Documented Calendar Engine Result Box */}
          <div className="md:col-span-8 p-4 bg-ivory-100/70 border border-ivory-300 text-xs font-sans space-y-1.5">
            <div className="flex items-center justify-between text-charcoal-600 font-mono text-[11px] uppercase">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest-800" />
                <span>Calculated Membership Interval</span>
              </span>
              <span className="text-amber-800 font-semibold">{currentDurationRule.label}</span>
            </div>

            <div className="text-sm font-serif text-charcoal-900 font-bold">
              {formatDisplayDate(startDate)} → {formatDisplayDate(calculatedEndDate)}
            </div>

            <p className="text-[11px] text-charcoal-600 leading-relaxed">
              <strong>Calendar Rules:</strong> {currentDurationRule.description} (Accounting for calendar month-end clipping and leap-year boundaries).
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STEP 3 & 4: MAP & ACCESSIBLE LIST VIEW TOGGLE
          ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ivory-200">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-semibold">
              Step 3 & 4 • Spatial Selection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900">
              Inspect Available Workstations ({availableCount} of 20 Open)
            </h2>
          </div>

          {/* View Switcher Tabs */}
          <div className="inline-flex p-1 border border-ivory-300 bg-ivory-100 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 flex items-center gap-1.5 min-h-[44px] transition-colors ${
                viewMode === "map"
                  ? "bg-ivory-50 text-charcoal-900 font-bold shadow-editorial"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Architectural Map (20)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 flex items-center gap-1.5 min-h-[44px] transition-colors ${
                viewMode === "list"
                  ? "bg-ivory-50 text-charcoal-900 font-bold shadow-editorial"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Accessible List</span>
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {isLoading && (
          <LoadingState
            variant="skeleton"
            label="Querying workstation availability across selected period…"
          />
        )}

        {error && (
          <ErrorState
            title="Availability Query Disrupted"
            message={error}
            onRetry={() => setStartDate("2026-10-28")}
            retryLabel="Reset to Default Date"
          />
        )}

        {/* Workstation Workspace: Map + Side Panel Desktop Layout */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Map or List (8 or 12 cols based on selection) */}
            <div className={selectedSeat && isInspectorOpen && !isMobile ? "lg:col-span-7" : "lg:col-span-12"}>
              {viewMode === "map" ? (
                <SvgRoomMap
                  availabilities={availabilities}
                  selectedSeatId={selectedSeat?.id || null}
                  onSelectSeat={handleSelectSeat}
                />
              ) : (
                <AccessibleSeatList
                  availabilities={availabilities}
                  selectedSeatId={selectedSeat?.id || null}
                  onSelectSeat={handleSelectSeat}
                />
              )}
            </div>

            {/* Right Col: Desktop Side Panel Inspector (5 cols) */}
            {selectedSeat && isInspectorOpen && !isMobile && (
              <div className="lg:col-span-5 sticky top-28">
                <SeatInspector
                  seat={selectedSeat}
                  status={selectedAvailability?.status || "available"}
                  statusMessage={selectedAvailability?.statusMessage}
                  startDate={startDate}
                  endDate={calculatedEndDate}
                  duration={duration}
                  isOpen={isInspectorOpen}
                  onClose={() => setIsInspectorOpen(false)}
                  onRequestSeat={() => setIsHoldDialogOpen(true)}
                  isMobile={false}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Inspector */}
      {selectedSeat && isMobile && (
        <SeatInspector
          seat={selectedSeat}
          status={selectedAvailability?.status || "available"}
          statusMessage={selectedAvailability?.statusMessage}
          startDate={startDate}
          endDate={calculatedEndDate}
          duration={duration}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onRequestSeat={() => setIsHoldDialogOpen(true)}
          isMobile={true}
        />
      )}

      {/* =========================================================================
          STEP 5: PERSISTENT BOOKING SUMMARY LEDGER
          Visible without covering content or keyboard
          ========================================================================= */}
      <div className="p-6 border border-ivory-300 bg-ivory-100/90 shadow-editorial text-xs font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-semibold">
              Step 5 • Reservation Summary
            </span>
            <div className="font-serif text-lg sm:text-xl text-charcoal-900">
              {selectedSeat ? (
                <span>
                  Workstation <strong>{selectedSeat.seatNumber}</strong> ({selectedSeat.name}) — {currentDurationRule.label}
                </span>
              ) : (
                <span className="text-charcoal-500 italic">
                  Select a workstation on the floorplan or list above to proceed
                </span>
              )}
            </div>
            <div className="text-charcoal-600 font-mono text-[11px]">
              Tenure: {formatDisplayDate(startDate)} to {formatDisplayDate(calculatedEndDate)}
            </div>
          </div>

          <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-charcoal-500">Estimated Fee</div>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                ₹{currentDurationRule.basePrice}{" "}
                <span className="text-xs font-mono font-normal text-charcoal-500">INR</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedSeat || selectedAvailability?.status === "unavailable"}
              onClick={() => setIsHoldDialogOpen(true)}
            >
              Review Request →
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REVIEW REQUEST & SUBMIT HOLD MODAL DIALOG
          ========================================================================= */}
      <Dialog
        isOpen={isHoldDialogOpen}
        onClose={() => {
          setIsHoldDialogOpen(false);
          setHoldResult(null);
        }}
        title="Review Workstation Request"
        description="Demo confirmation modal. Placed on temporary curatorial hold."
        footer={
          !holdResult && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHoldDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isSubmittingHold}
                onClick={handleConfirmHold}
              >
                Confirm Hold Request
              </Button>
            </div>
          )
        }
      >
        {holdResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-center py-4"
          >
            <CheckCircle2 className="w-12 h-12 text-forest-800 mx-auto" />
            <h3 className="font-serif text-2xl text-charcoal-900">
              Workstation Held for Review
            </h3>
            <p className="text-xs text-charcoal-700 leading-relaxed max-w-md mx-auto">
              {holdResult.message}
            </p>

            <div className="p-4 bg-ivory-100 border border-ivory-300 font-mono text-xs space-y-1 text-charcoal-900">
              <div>Hold Reference: <strong>{holdResult.holdRef}</strong></div>
              <div>Expires: <strong>{holdResult.expiresAt}</strong> (15-min window)</div>
              <div>Estimated Demo Fee: <strong>₹{holdResult.totalPrice} INR</strong></div>
            </div>

            <p className="text-[10px] font-mono text-amber-800">
              *Demo assumption: No payments collected. Our curatorial intake desk has received your request.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => setIsCheckoutOpen(true)}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Pay via Razorpay (TEST)
              </Button>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 border border-forest-900 text-forest-900 text-xs uppercase tracking-wider font-medium hover:bg-forest-50 inline-block min-h-[44px] flex items-center justify-center w-full sm:w-auto"
              >
                View in Member Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleConfirmHold} className="space-y-4 text-left">
            {/* Summary Block */}
            <div className="p-3 bg-ivory-100/70 border border-ivory-200 text-xs font-mono space-y-1">
              <div>Station: <strong>{selectedSeat?.seatNumber} ({selectedSeat?.name})</strong></div>
              <div>Zone: {selectedSeat?.zone}</div>
              <div>Period: {formatDisplayDate(startDate)} → {formatDisplayDate(calculatedEndDate)}</div>
              <div>Cadence: {currentDurationRule.label} (₹{currentDurationRule.basePrice} INR)</div>
            </div>

            <Input
              label="Guest Scholar Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />

            <Input
              label="Contact Email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
            />

            <Textarea
              label="Acoustic or Lighting Accommodations"
              placeholder="e.g. Left-handed orientation, needs flat-file drawer, preferring low foot traffic alcove."
              rows={3}
              value={guestNotes}
              onChange={(e) => setGuestNotes(e.target.value)}
              optional
            />

            <div className="p-3 border border-amber-300 bg-amber-50 text-[11px] font-mono text-amber-900">
              This reservation prototype stores hold records in memory using the Replaceable Fixture Adapter. Real payment gateways will connect in a future release.
            </div>
          </form>
        )}
      </Dialog>

      {/* Razorpay Standard Checkout Modal */}
      <RazorpayCheckoutModal
        bookingRequestId={holdResult?.holdRef || "REQ-PENDING"}
        seatLabel={selectedSeat ? `${selectedSeat.seatNumber} (${selectedSeat.name})` : "Desk"}
        durationLabel={currentDurationRule.label}
        amountPaise={(holdResult?.totalPrice || currentDurationRule.basePrice) * 100 * 83}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setIsHoldDialogOpen(false);
        }}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center font-serif text-charcoal-700">Loading reservation engine…</div>}>
      <BookDemoContent />
    </Suspense>
  );
}
