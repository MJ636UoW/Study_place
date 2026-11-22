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

function getDynamicHourlySlots(hours: number): { slot: string; label: string }[] {
  const startHours = [7, 9, 11, 13, 15, 17, 18].filter((start) => start + hours <= 24);
  return startHours.map((start) => {
    const end = start + hours;
    const formatH = (h: number) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(h)}:00`;
    };
    let tag = "Focus Block";
    if (start < 9) tag = "Early Morning";
    else if (start < 12) tag = "Morning Focus";
    else if (start < 15) tag = "Mid-Day Sprint";
    else if (start < 18) tag = "Afternoon Block";
    else if (start < 21) tag = "Evening Scholar";
    else tag = "Night Owl";

    const slotStr = `${formatH(start)} — ${formatH(end)}`;
    return {
      slot: `${slotStr} (${tag})`,
      label: `${slotStr} (${tag} • ${hours} hr${hours > 1 ? "s" : ""})`,
    };
  });
}

function BookDemoContent() {
  // 1. Duration, Hours & Date selection
  const [duration, setDuration] = useState<DurationType>("hour");
  const [startHour, setStartHour] = useState<number>(8); // Default 08:00 AM
  const [hourlyCount, setHourlyCount] = useState<number>(2); // Default 2 hours
  const [startDate, setStartDate] = useState<string>(() => formatDate(new Date()));
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isReturningMember, setIsReturningMember] = useState<boolean>(false);

  // Time format helper
  const formatHourLabel = (h: number) => {
    if (h < 12) return `${h.toString().padStart(2, "0")}:00 AM`;
    if (h === 12) return "12:00 PM";
    return `${(h - 12).toString().padStart(2, "0")}:00 PM`;
  };

  const endHour = Math.min(23, startHour + hourlyCount);
  const hourlyTimeSlot = `${formatHourLabel(startHour)} — ${formatHourLabel(endHour)} (${hourlyCount} hr${hourlyCount > 1 ? "s" : ""})`;

  // One-time registration fee logic: ₹0 for hourly/day; ₹200 for first-time weekly/monthly
  const ONE_TIME_REG_FEE = 200;
  const isRegistrationFeeApplicable = (duration === "week" || duration === "month") && !isReturningMember;
  const registrationFee = isRegistrationFeeApplicable ? ONE_TIME_REG_FEE : 0;

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

  // Detect mobile viewport & pre-fill scholar profile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (typeof window !== "undefined") {
      const regPaid = localStorage.getItem("esz_student_registration_fee_paid") === "true";
      if (regPaid) setIsReturningMember(true);
    }

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d?.user) {
          if (d.user.name) setGuestName(d.user.name);
          if (d.user.email) setGuestEmail(d.user.email);
        } else {
          const cookies = document.cookie;
          const emailMatch = cookies.match(/esz_student_email=([^;]+)/);
          const nameMatch = cookies.match(/esz_student_name=([^;]+)/);
          if (nameMatch) setGuestName(decodeURIComponent(nameMatch[1]));
          if (emailMatch) setGuestEmail(decodeURIComponent(emailMatch[1]));
        }
      })
      .catch(() => {});

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

  // Current duration rule (dynamically scales for hourly selections)
  const currentDurationRule = useMemo(() => {
    const base = DURATION_RULES.find((r) => r.id === duration) || DURATION_RULES[2];
    if (duration === "hour") {
      return {
        ...base,
        basePrice: 49 * hourlyCount,
        sublabel: `${hourlyCount} Hour${hourlyCount > 1 ? "s" : ""} (${hourlyTimeSlot})`,
      };
    }
    return base;
  }, [duration, hourlyCount, hourlyTimeSlot]);

  const totalPayableAmount = currentDurationRule.basePrice + registrationFee;

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

      res.totalPrice = totalPayableAmount;
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
          HEADER: THE STEP FLOW
          ========================================================================= */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Elite Study Zone Intake</span>
          <span>•</span>
          <span>Step Sequence I — IV</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
          Reserve Your Workstation
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-charcoal-700 leading-relaxed">
          Select membership duration → choose start date → inspect available seats → select seat → confirm & pay.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {DURATION_RULES.map((rule) => {
              const isSelected = duration === rule.id;
              const displayPrice = rule.id === "hour" ? 49 * hourlyCount : rule.basePrice;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setDuration(rule.id)}
                  className={`p-3.5 border text-left transition-all min-h-[44px] flex flex-col justify-between ${
                    isSelected
                      ? "border-forest-700 bg-forest-50 ring-2 ring-forest-600 shadow-md"
                      : "border-ivory-300 bg-ivory-100/50 hover:bg-ivory-100"
                  }`}
                >
                  <div>
                    <div className="font-sans text-sm font-bold text-charcoal-900">
                      {rule.label}
                    </div>
                    <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
                      {rule.id === "hour" ? `${hourlyCount} Hours Selected` : rule.sublabel}
                    </div>
                  </div>
                  <div className="pt-2 text-xs font-mono font-bold text-forest-700">
                    ₹{displayPrice} <span className="font-normal text-[10px] text-charcoal-500">INR</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Custom Time Scroller (when duration === 'hour') */}
          {duration === "hour" && (
            <div className="p-4 sm:p-5 bg-forest-50 border border-forest-300 rounded-xl space-y-4 shadow-sm">
              {/* 1. Start Time Horizontal Scroller */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-forest-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-forest-700" />
                    <span>Choose Start Time (07:00 AM – 10:00 PM)</span>
                  </span>
                  <span className="text-[11px] font-mono text-forest-800 font-bold bg-white px-2 py-0.5 rounded border border-forest-200">
                    Starts: {formatHourLabel(startHour)}
                  </span>
                </div>

                {/* Horizontal Touch Scroller */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                  {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => {
                    const isSelected = startHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setStartHour(h);
                          if (h + hourlyCount > 23) {
                            setHourlyCount(Math.max(1, 23 - h));
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md whitespace-nowrap transition-all flex-shrink-0 ${
                          isSelected
                            ? "bg-forest-800 text-white shadow-sm ring-2 ring-forest-600 scale-105"
                            : "bg-white text-charcoal-700 border border-forest-200 hover:bg-forest-100"
                        }`}
                      >
                        {formatHourLabel(h)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Duration Selector & Scroller */}
              <div className="space-y-2 pt-3 border-t border-forest-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-forest-950">
                    Study Duration (₹49 per hour)
                  </span>
                  <span className="text-xs font-mono font-extrabold text-forest-900 bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded">
                    {hourlyCount} Hour{hourlyCount > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Quick Hour Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12]
                    .filter((h) => startHour + h <= 23)
                    .map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHourlyCount(h)}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                          hourlyCount === h
                            ? "bg-forest-700 text-white shadow-sm"
                            : "bg-white text-charcoal-800 border border-forest-200 hover:bg-forest-100"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                </div>

                {/* Custom Range Slider */}
                <div className="pt-1">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, 23 - startHour)}
                    value={hourlyCount}
                    onChange={(e) => setHourlyCount(Number(e.target.value))}
                    className="w-full accent-forest-700 cursor-pointer h-2 bg-forest-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-charcoal-500 mt-1">
                    <span>1 hour min</span>
                    <span>Max {23 - startHour} hrs (until 11:00 PM closing)</span>
                  </div>
                </div>
              </div>

              {/* 3. Live Calculated Slot & Transparent Fee Card */}
              <div className="p-3.5 bg-white border border-forest-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm font-mono">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-charcoal-500 font-bold">
                    Custom Hourly Slot:
                  </div>
                  <div className="text-sm font-bold text-forest-950">
                    {hourlyTimeSlot}
                  </div>
                  <div className="text-[11px] text-charcoal-600 mt-0.5">
                    Center open until 11:00 PM &bull; Zero registration fee
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] uppercase tracking-wider text-charcoal-500 font-bold">
                    Payable Amount:
                  </div>
                  <div className="text-xl font-extrabold text-forest-800">
                    ₹{hourlyCount * 49} <span className="text-xs font-normal text-charcoal-600">INR</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Fee Breakdown for Weekly & Monthly Packages */}
          {(duration === "week" || duration === "month") && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 font-mono text-xs shadow-sm">
              <div className="flex items-center justify-between text-emerald-950 font-bold text-sm">
                <span>{duration === "month" ? "Monthly Dedicated Desk" : "Weekly Sprint Pass"}</span>
                <span>Base Plan: ₹{currentDurationRule.basePrice}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 pt-1 border-t border-emerald-200">
                <span>One-Time Member Registration Fee:</span>
                <span>
                  {isReturningMember ? (
                    <strong className="text-emerald-700">₹0 (Waived — Returning Member Renewal)</strong>
                  ) : (
                    <strong>+₹{ONE_TIME_REG_FEE} (First-time members only)</strong>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-charcoal-900 font-bold text-sm pt-1 border-t border-emerald-300">
                <span>Total Payable:</span>
                <span className="text-base text-forest-800">₹{totalPayableAmount} INR</span>
              </div>
              <p className="text-[10px] text-charcoal-600">
                {isReturningMember
                  ? "✓ Returning member verified: No registration fee charged on renewals."
                  : "ℹ️ One-time ₹200 scholar registration fee applies to your first weekly/monthly membership and is permanently waived on all future renewals."}
              </p>
            </div>
          )}
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
              <div className="text-[10px] uppercase font-mono text-charcoal-500">
                {registrationFee > 0 ? "Total Fee (Incl. ₹200 Reg Fee)" : "Total Fee"}
              </div>
              <div className="font-serif text-2xl font-bold text-charcoal-900">
                ₹{totalPayableAmount}{" "}
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

            <div className="p-4 bg-emerald-50 border border-emerald-300 font-mono text-xs space-y-1 text-emerald-950 rounded-lg">
              <div>Hold Reference: <strong>{holdResult.holdRef}</strong></div>
              <div>Expires: <strong>{holdResult.expiresAt}</strong> (15-min reservation hold)</div>
              <div>Payable Fee: <strong>₹{holdResult.totalPrice} INR</strong></div>
            </div>

            <p className="text-[11px] font-mono text-emerald-800 font-bold">
              ✓ Workstation reserved for payment. Complete payment below to immediately activate your Door Keypad PIN.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => setIsCheckoutOpen(true)}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold bg-emerald-700 hover:bg-emerald-600 shadow-md"
              >
                Complete Payment (UPI / QR / Cards) →
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleConfirmHold} className="space-y-4 text-left">
            {/* Summary Block */}
            <div className="p-3 bg-ivory-100/70 border border-ivory-200 text-xs font-mono space-y-1">
              <div>Station: <strong>{selectedSeat?.seatNumber} ({selectedSeat?.name})</strong></div>
              <div>Zone: {selectedSeat?.zone}</div>
              <div>Period: {formatDisplayDate(startDate)} {duration === "hour" ? `(${hourlyTimeSlot})` : `→ ${formatDisplayDate(calculatedEndDate)}`}</div>
              <div>Cadence: {currentDurationRule.label} {duration === "hour" ? `(${hourlyCount} hrs × ₹49 = ₹${hourlyCount * 49} INR)` : `(₹${currentDurationRule.basePrice} INR)`}</div>
              <div className="text-forest-700 font-bold">Door Access: Instant Keypad PIN sent via WhatsApp & Email upon payment</div>
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

            <div className="p-3 border border-emerald-300 bg-emerald-50 text-[11px] font-sans text-emerald-900 rounded-lg">
              ✨ Instant checkout via PhonePe, Google Pay, dynamic UPI QR code, or Cards. Your Smart Door Keypad PIN is generated and delivered immediately via WhatsApp & Email upon payment. To exit, press the interior exit button.
            </div>
          </form>
        )}
      </Dialog>

      {/* Razorpay Standard Checkout Modal */}
      <RazorpayCheckoutModal
        bookingRequestId={holdResult?.holdRef || "REQ-PENDING"}
        seatLabel={selectedSeat ? `${selectedSeat.seatNumber} (${selectedSeat.name})` : "Desk"}
        durationLabel={currentDurationRule.label}
        amountPaise={(holdResult?.totalPrice || totalPayableAmount) * 100}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(paymentId, passCode) => {
          setIsHoldDialogOpen(false);
          setIsCheckoutOpen(false);

          // Mark one-time registration fee as paid for weekly/monthly
          if (duration === "week" || duration === "month") {
            try {
              localStorage.setItem("esz_student_registration_fee_paid", "true");
              setIsReturningMember(true);
            } catch {}
          }

          // Save confirmed booking directly to student's persistent store
          try {
            const newBooking = {
              id: holdResult?.holdRef || `BK-${Date.now()}`,
              bookingRef: holdResult?.holdRef || `ESZ-${Date.now()}`,
              seatId: selectedSeat?.id || "desk-04",
              seatLabel: selectedSeat ? `Workstation ${selectedSeat.seatNumber} (${selectedSeat.name})` : "Dedicated Workstation",
              roomName: selectedSeat?.zone || "Main Study Sanctuary",
              tierName: currentDurationRule.label,
              startDate: startDate,
              endDate: calculatedEndDate,
              requestStatus: "approved",
              paymentStatus: "paid",
              totalPricePaise: (holdResult?.totalPrice || totalPayableAmount) * 100,
              totalPriceRupees: `${holdResult?.totalPrice || totalPayableAmount}.00`,
              passCode: passCode || `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
            };

            const existing = JSON.parse(localStorage.getItem("esz_student_bookings") || "[]");
            const updated = [newBooking, ...existing];
            localStorage.setItem("esz_student_bookings", JSON.stringify(updated));

            // Notify server of allocation
            fetch("/api/member/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newBooking),
            }).catch(() => {});
          } catch (e) {
            console.error("Failed to save booking:", e);
          }

          // Auto-route to student dashboard to view seat and Door Keypad PIN
          window.location.href = "/dashboard?tab=residencies";
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
