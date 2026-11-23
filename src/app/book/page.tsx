"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  ListFilter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  Calendar,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  DurationType,
  DURATION_RULES,
  calculateEndDate,
  formatDisplayDate,
  formatDate,
} from "@/lib/dateUtils";
import {
  ShiftId,
  PlanTenure,
  SHIFTS,
  TENURES,
  DEFAULT_PRICING_MATRIX,
  getPlanPrice,
  LOCKER_RATES,
  LOCKERS_FIXTURE_24,
  LockerItem,
} from "@/lib/pricingMatrix";
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

function BookContent() {
  const searchParams = useSearchParams();

  // 1. Duration & Shift selection (Strictly 4 plans & 5 shifts)
  const initialDuration = (searchParams.get("duration") as PlanTenure) || "hour";
  const initialShift = (searchParams.get("shift") as ShiftId) || "deep_focus";

  const [tenure, setTenure] = useState<PlanTenure>(
    initialDuration === "week" || initialDuration === "month" || initialDuration === "weekend"
      ? initialDuration
      : "one_visit"
  );
  const [selectedShiftId, setSelectedShiftId] = useState<ShiftId>(
    SHIFTS.some((s) => s.id === initialShift) ? initialShift : "deep_focus"
  );

  // Time Selection (Center open 07:00 AM to 11:00 PM)
  const [startHour, setStartHour] = useState<number>(8); // Default 08:00 AM
  const [startDate, setStartDate] = useState<string>(() => formatDate(new Date()));
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isReturningMember, setIsReturningMember] = useState<boolean>(false);

  // Locker Selection State
  const [withLocker, setWithLocker] = useState<boolean>(false);
  const [selectedLockerId, setSelectedLockerId] = useState<string>("locker-02");

  // Selected shift definition
  const currentShift = useMemo(() => {
    return SHIFTS.find((s) => s.id === selectedShiftId) || SHIFTS[1];
  }, [selectedShiftId]);

  // Daily hours derived from shift
  const dailyHours = currentShift.hours;

  // Format hour label
  const formatHourLabel = (h: number) => {
    if (h < 12) return `${h.toString().padStart(2, "0")}:00 AM`;
    if (h === 12) return "12:00 PM";
    return `${(h - 12).toString().padStart(2, "0")}:00 PM`;
  };

  const endHour = Math.min(23, startHour + dailyHours);
  const timeSlotLabel = `${formatHourLabel(startHour)} — ${formatHourLabel(endHour)} (${dailyHours} hrs daily)`;

  // Pricing calculations
  const basePlanPrice = useMemo(() => {
    return getPlanPrice(selectedShiftId, tenure);
  }, [selectedShiftId, tenure]);

  // One-time registration fee: ₹0 for one_visit; ₹200 for week, month, weekend (waived for renewals)
  const ONE_TIME_REG_FEE = 200;
  const isRegistrationApplicable = tenure !== "one_visit" && !isReturningMember;
  const registrationFee = isRegistrationApplicable ? ONE_TIME_REG_FEE : 0;

  // Locker fee
  const lockerFee = withLocker ? LOCKER_RATES[tenure] : 0;

  // Total amount payable
  const totalPayableAmount = basePlanPrice + registrationFee + lockerFee;

  // Map PlanTenure to dateUtils DurationType
  const durationTypeForEngine: DurationType = useMemo(() => {
    if (tenure === "one_visit") return "hour";
    if (tenure === "week") return "week";
    if (tenure === "month") return "month";
    if (tenure === "weekend") return "weekend";
    return "hour";
  }, [tenure]);

  // Calculated End Date
  const calculatedEndDate = useMemo(() => {
    return calculateEndDate(startDate, durationTypeForEngine);
  }, [startDate, durationTypeForEngine]);

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

  // Query Replaceable Adapter whenever dates or time change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    bookingAdapter
      .checkAvailability({
        startDate,
        endDate: calculatedEndDate,
        duration: durationTypeForEngine,
      })
      .then((data) => {
        if (!cancelled) {
          setAvailabilities(data);
          setIsLoading(false);
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
  }, [startDate, calculatedEndDate, durationTypeForEngine, startHour, dailyHours]);

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

  // Total available count
  const availableCount = useMemo(() => {
    return availabilities.filter((a) => a.status === "available").length;
  }, [availabilities]);

  // Selected locker item
  const selectedLocker = useMemo(() => {
    return LOCKERS_FIXTURE_24.find((l) => l.id === selectedLockerId) || LOCKERS_FIXTURE_24[1];
  }, [selectedLockerId]);

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
        duration: durationTypeForEngine,
        guestName,
        guestEmail,
        specialRequests: `${guestNotes} | Time: ${timeSlotLabel} | Locker: ${withLocker ? selectedLocker.label : "None"}`,
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
    <div className="w-full py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* =========================================================================
          HEADER: THE STEP FLOW
          ========================================================================= */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800 rounded-full font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Elite Study Zone &bull; Workstation Intake</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight font-bold">
          Reserve Your Workstation Seat
        </h1>
        <p className="font-sans text-sm sm:text-base text-charcoal-700 leading-relaxed">
          Select plan → choose daily hours & preferred time → select start date → pick workstation & optional locker.
        </p>
      </div>

      {/* =========================================================================
          STEP 1: MEMBERSHIP DURATION (Strictly 4 Plans)
          Hourly Plan, Weekly Plan, Monthly Plan, Weekend Plan
          ========================================================================= */}
      <div className="p-6 sm:p-8 border border-ivory-300 bg-white rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-200 gap-2">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-bold">
              Step 1 &bull; Plan Duration
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal-900 font-bold">
              Choose Membership Duration
            </h2>
          </div>
          <div className="text-xs font-mono text-charcoal-500">
            Center hours: 07:00 AM — 11:00 PM Daily
          </div>
        </div>

        {/* 4 Plan Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TENURES.map((t) => {
            const isSelected = tenure === t.id;
            const price = getPlanPrice(selectedShiftId, t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTenure(t.id)}
                className={`p-4 border-2 rounded-xl text-left transition-all min-h-[90px] flex flex-col justify-between ${
                  isSelected
                    ? "border-forest-800 bg-forest-50/70 ring-2 ring-forest-700 shadow-md"
                    : "border-ivory-200 bg-ivory-50/50 hover:border-ivory-400 hover:bg-ivory-100/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-charcoal-900">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-forest-700" />
                    )}
                  </div>
                  <div className="text-xs text-charcoal-600 font-sans mt-0.5">
                    {t.sublabel}
                  </div>
                </div>
                <div className="pt-2 text-sm font-mono font-bold text-forest-800">
                  ₹{price} <span className="text-[11px] font-normal text-charcoal-500">({currentShift.name})</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            STEP 2: ACCESS PER DAY / HOURS SELECTION
            Strictly 2 hrs, 3 hrs, 5 hrs, 10 hrs, 15 hrs (Full Day)
            ========================================================================= */}
        <div className="pt-4 border-t border-ivory-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-mono text-charcoal-800 tracking-wider font-bold">
              Step 2 &bull; Select Access Hours Per Day ({dailyHours} hrs)
            </label>
            <span className="text-xs font-mono text-forest-800 font-bold bg-forest-50 px-2.5 py-0.5 rounded border border-forest-200">
              {currentShift.name}: {currentShift.hours} Hours Access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SHIFTS.map((shift) => {
              const isSelected = selectedShiftId === shift.id;
              const shiftPrice = getPlanPrice(shift.id, tenure);
              return (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => {
                    setSelectedShiftId(shift.id);
                    if (startHour + shift.hours > 23) {
                      setStartHour(Math.max(7, 23 - shift.hours));
                    }
                  }}
                  className={`p-3.5 border rounded-xl text-left transition-all ${
                    isSelected
                      ? "border-forest-800 bg-forest-800 text-white shadow-md ring-2 ring-forest-600"
                      : "border-ivory-300 bg-white hover:bg-ivory-50 text-charcoal-900"
                  }`}
                >
                  <div className="font-serif font-bold text-sm">
                    {shift.name}
                  </div>
                  <div className={`text-xs font-mono font-bold mt-1 ${isSelected ? "text-amber-200" : "text-forest-700"}`}>
                    {shift.hours} hrs/day
                  </div>
                  <div className={`text-xs font-mono mt-1 ${isSelected ? "text-white" : "text-charcoal-700"}`}>
                    ₹{shiftPrice}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            STEP 3: PREFERRED START TIME & END TIME SELECTION
            Custom scroller & dropdown to select exact arrival slot
            ========================================================================= */}
        <div className="pt-4 border-t border-ivory-200 p-4 sm:p-5 bg-ivory-50/70 border border-ivory-200 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase font-bold text-charcoal-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-forest-800" />
              <span>Preferred Start & End Time Slot (07:00 AM — 11:00 PM)</span>
            </span>
            <span className="text-xs font-mono text-forest-900 font-bold bg-white px-3 py-1 rounded-md border border-ivory-300 shadow-sm">
              Selected Slot: {timeSlotLabel}
            </span>
          </div>

          {/* Start Hour Horizontal Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-charcoal-600">
              Select Start Time:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                const isSelected = startHour === h;
                const canFit = h + dailyHours <= 23;
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={!canFit}
                    onClick={() => setStartHour(h)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected
                        ? "bg-forest-800 text-white shadow-md ring-2 ring-forest-600 scale-105"
                        : canFit
                        ? "bg-white text-charcoal-800 border border-ivory-300 hover:bg-forest-50"
                        : "bg-ivory-200 text-charcoal-400 border border-ivory-200 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    {formatHourLabel(h)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Summary */}
          <div className="p-3 bg-white border border-ivory-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div>
              <span className="text-charcoal-500">Calculated Daily Interval: </span>
              <strong className="text-forest-900">{timeSlotLabel}</strong>
            </div>
            <div className="text-charcoal-600">
              Real-time seat availability updates for this window
            </div>
          </div>
        </div>

        {/* =========================================================================
            START DATE & CALENDAR RULES
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-ivory-200 items-end">
          <div className="md:col-span-4 space-y-2">
            <label htmlFor="start-date-input" className="block text-xs uppercase font-mono text-charcoal-700 tracking-wider font-bold">
              Commencement Date
            </label>
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-white text-charcoal-900 border border-ivory-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-sm"
            />
            <div className="flex items-center gap-2 text-[10px] font-mono text-charcoal-600">
              <span>Quick:</span>
              <button
                type="button"
                onClick={() => handleDatePreset(0)}
                className="underline hover:text-forest-900"
              >
                Today
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => handleDatePreset(1)}
                className="underline hover:text-forest-900"
              >
                Tomorrow
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => handleDatePreset(7)}
                className="underline hover:text-forest-900"
              >
                +1 Week
              </button>
            </div>
          </div>

          <div className="md:col-span-8 p-4 bg-ivory-100/80 border border-ivory-300 rounded-xl text-xs font-sans space-y-1">
            <div className="flex items-center justify-between text-charcoal-700 font-mono text-[11px] uppercase">
              <span className="flex items-center gap-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-forest-800" />
                <span>Calculated Membership Tenure</span>
              </span>
              <span className="text-forest-800 font-bold">{tenure.toUpperCase()} PLAN</span>
            </div>
            <div className="text-sm font-serif text-charcoal-900 font-bold">
              {formatDisplayDate(startDate)} → {formatDisplayDate(calculatedEndDate)}
            </div>
            <p className="text-[11px] text-charcoal-600">
              {tenure === "one_visit" && "Valid for single focus session on chosen day."}
              {tenure === "week" && "7 consecutive days of dedicated desk access."}
              {tenure === "month" && "30 continuous calendar days with smart keypad PIN."}
              {tenure === "weekend" && "8 weekend days (all Saturdays & Sundays across 4 weeks)."}
            </p>
          </div>
        </div>

        {/* =========================================================================
            REGISTRATION FEE BANNER
            ₹0 for One Visit; +₹200 for Weekly, Monthly, Weekend (waived on renewal)
            ========================================================================= */}
        {tenure !== "one_visit" && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-emerald-950 font-bold">
              <span>One-Time Member Registration Fee:</span>
              <span>
                {isReturningMember ? (
                  <strong className="text-emerald-700">₹0 (Waived — Returning Member Renewal)</strong>
                ) : (
                  <strong className="text-emerald-900">+₹{ONE_TIME_REG_FEE} INR (First-time members only)</strong>
                )}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              {isReturningMember
                ? "✓ Renewal verified: You are an existing member, registration fee is permanently ₹0."
                : "ℹ️ Registration fee applies once to Weekly, Monthly, and Weekend plans and is permanently waived on all future renewals."}
            </p>
          </div>
        )}

        {/* =========================================================================
            LOCKER BOOKING AND PRICING (With Locker / Without Locker)
            Display all lockers #01 to #24 with availability status
            ========================================================================= */}
        <div className="pt-4 border-t border-ivory-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-bold">
                Optional Add-on &bull; Storage Locker
              </span>
              <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-forest-800" />
                <span>Dedicated Personal Storage Locker</span>
              </h3>
            </div>
            <div className="text-xs font-mono text-charcoal-600">
              Rate for {tenure.replace("_", " ")}: <strong>+₹{LOCKER_RATES[tenure]} INR</strong>
            </div>
          </div>

          {/* With / Without Locker Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWithLocker(false)}
              className={`p-3.5 border rounded-xl text-left transition-all flex items-center justify-between ${
                !withLocker
                  ? "border-forest-800 bg-forest-50 ring-2 ring-forest-700 font-bold"
                  : "border-ivory-300 bg-white hover:bg-ivory-50"
              }`}
            >
              <div>
                <div className="font-serif text-sm text-charcoal-900">Without Locker</div>
                <div className="text-[11px] text-charcoal-500 font-sans mt-0.5">Seat booking only</div>
              </div>
              <span className="font-mono text-xs text-charcoal-700 font-bold">₹0</span>
            </button>

            <button
              type="button"
              onClick={() => setWithLocker(true)}
              className={`p-3.5 border rounded-xl text-left transition-all flex items-center justify-between ${
                withLocker
                  ? "border-forest-800 bg-forest-50 ring-2 ring-forest-700 font-bold"
                  : "border-ivory-300 bg-white hover:bg-ivory-50"
              }`}
            >
              <div>
                <div className="font-serif text-sm text-charcoal-900">With Dedicated Locker</div>
                <div className="text-[11px] text-charcoal-500 font-sans mt-0.5">Private steel locker with key</div>
              </div>
              <span className="font-mono text-xs text-forest-800 font-bold">+₹{LOCKER_RATES[tenure]} INR</span>
            </button>
          </div>

          {/* Locker Matrix & Selection when With Locker is active */}
          {withLocker && (
            <div className="p-4 sm:p-5 bg-ivory-100/70 border border-ivory-300 rounded-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-charcoal-900">
                  Select Locker Number (#01 — #24):
                </span>
                <span className="text-forest-800 font-bold">
                  Selected: {selectedLocker.label} ({selectedLocker.size})
                </span>
              </div>

              {/* Locker Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {LOCKERS_FIXTURE_24.map((locker) => {
                  const isOccupied = locker.status === "occupied";
                  const isSelected = selectedLockerId === locker.id;
                  return (
                    <button
                      key={locker.id}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setSelectedLockerId(locker.id)}
                      className={`p-2 border rounded-lg text-center transition-all ${
                        isOccupied
                          ? "bg-ivory-200 text-charcoal-400 border-ivory-300 cursor-not-allowed opacity-50"
                          : isSelected
                          ? "bg-forest-800 text-white border-forest-900 font-bold shadow-sm ring-2 ring-forest-600 scale-105"
                          : "bg-white text-charcoal-800 border-ivory-300 hover:border-forest-600 hover:bg-forest-50"
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{locker.number}</div>
                      <div className="text-[9px] font-sans mt-0.5">
                        {isOccupied ? "Occupied" : isSelected ? "Selected" : "Open"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Locker Booking Details Display */}
              <div className="p-3 bg-white border border-ivory-300 rounded-lg text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600">Assigned Locker:</span>
                  <strong className="text-forest-900">{selectedLocker.label} &bull; Status: Available</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600">Locker Validity:</span>
                  <span>{formatDisplayDate(startDate)} to {formatDisplayDate(calculatedEndDate)}</span>
                </div>
                <div className="flex items-center justify-between text-forest-800 font-bold pt-1 border-t border-ivory-200">
                  <span>Locker Add-on Fee:</span>
                  <span>₹{LOCKER_RATES[tenure]} INR (Added to Total)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          STEP 4: WORKSTATION SELECTION & PHOTOS
          Map & Accessible List View Toggle
          ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ivory-200">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-bold">
              Step 4 &bull; Spatial Workstation Selection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900 font-bold">
              Inspect & Select Workstation ({availableCount} of 20 Open)
            </h2>
            <p className="text-xs text-charcoal-600 font-sans mt-0.5">
              Every workstation includes photo, ergonomic chair, power outlets, and high-speed Wi-Fi.
            </p>
          </div>

          {/* View Switcher Tabs */}
          <div className="inline-flex p-1 border border-ivory-300 bg-ivory-100 text-xs font-mono rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3.5 py-1.5 flex items-center gap-1.5 min-h-[40px] rounded-md transition-colors ${
                viewMode === "map"
                  ? "bg-white text-charcoal-900 font-bold shadow-sm"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              <Compass className="w-4 h-4 text-forest-800" />
              <span>Floor Map (20)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3.5 py-1.5 flex items-center gap-1.5 min-h-[40px] rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-charcoal-900 font-bold shadow-sm"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              <ListFilter className="w-4 h-4 text-forest-800" />
              <span>Photo List</span>
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {isLoading && (
          <LoadingState
            variant="skeleton"
            label="Checking workstation availability across selected period…"
          />
        )}

        {error && (
          <ErrorState
            title="Availability Query Disrupted"
            message={error}
            onRetry={() => setStartDate(formatDate(new Date()))}
            retryLabel="Reset to Today"
          />
        )}

        {/* Workstation Workspace: Map + Side Panel Desktop Layout */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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

            {/* Desktop Side Panel Inspector */}
            {selectedSeat && isInspectorOpen && !isMobile && (
              <div className="lg:col-span-5 sticky top-28">
                <SeatInspector
                  seat={selectedSeat}
                  status={selectedAvailability?.status || "available"}
                  statusMessage={selectedAvailability?.statusMessage}
                  startDate={startDate}
                  endDate={calculatedEndDate}
                  duration={durationTypeForEngine}
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
          duration={durationTypeForEngine}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onRequestSeat={() => setIsHoldDialogOpen(true)}
          isMobile={true}
        />
      )}

      {/* =========================================================================
          STEP 5: RESERVATION SUMMARY & TOTAL PAYMENT BREAKDOWN
          ========================================================================= */}
      <div className="p-6 border border-ivory-300 bg-white rounded-2xl shadow-sm text-xs font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 font-bold">
              Step 5 &bull; Reservation Summary & Total
            </span>
            <div className="font-serif text-lg sm:text-xl text-charcoal-900 font-bold">
              {selectedSeat ? (
                <span>
                  Workstation <strong>{selectedSeat.seatNumber}</strong> ({selectedSeat.name}) &bull; {currentShift.name} ({dailyHours}h/day)
                </span>
              ) : (
                <span className="text-charcoal-500 italic">
                  Select a workstation on the map or list above to proceed
                </span>
              )}
            </div>
            <div className="text-charcoal-600 font-mono text-[11px] flex items-center gap-2 flex-wrap">
              <span>Tenure: {formatDisplayDate(startDate)} to {formatDisplayDate(calculatedEndDate)}</span>
              <span>&bull;</span>
              <span>Time: {timeSlotLabel}</span>
              {withLocker && (
                <>
                  <span>&bull;</span>
                  <span className="text-forest-800 font-bold">Locker: {selectedLocker.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right font-mono">
              <div className="text-[10px] uppercase text-charcoal-500">
                Plan: ₹{basePlanPrice} {registrationFee > 0 && `+ Reg: ₹${registrationFee}`} {withLocker && `+ Locker: ₹${lockerFee}`}
              </div>
              <div className="font-serif text-2xl font-bold text-forest-900">
                ₹{totalPayableAmount}{" "}
                <span className="text-xs font-mono font-normal text-charcoal-500">INR</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedSeat || selectedAvailability?.status === "unavailable"}
              onClick={() => setIsHoldDialogOpen(true)}
              className="bg-forest-800 hover:bg-forest-700 font-bold"
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
        title="Review Workstation Reservation"
        description="Verify reservation details before securing your workstation and keypad PIN."
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
                className="bg-forest-800 hover:bg-forest-700"
              >
                Confirm Hold & Proceed
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
            <h3 className="font-serif text-2xl text-charcoal-900 font-bold">
              Workstation Held for Confirmation
            </h3>
            <p className="text-xs text-charcoal-700 leading-relaxed max-w-md mx-auto font-sans">
              {holdResult.message}
            </p>

            <div className="p-4 bg-emerald-50 border border-emerald-300 font-mono text-xs space-y-1.5 text-emerald-950 rounded-xl text-left">
              <div>Hold Ref: <strong>{holdResult.holdRef}</strong></div>
              <div>Station: <strong>{selectedSeat?.seatNumber} ({selectedSeat?.name})</strong></div>
              <div>Duration: <strong>{tenure.toUpperCase()} ({currentShift.name})</strong></div>
              <div>Time Slot: <strong>{timeSlotLabel}</strong></div>
              {withLocker && <div>Locker: <strong>{selectedLocker.label}</strong></div>}
              <div className="pt-1 border-t border-emerald-200 text-sm font-bold text-forest-900">
                Total Payable: ₹{holdResult.totalPrice} INR
              </div>
            </div>

            <p className="text-[11px] font-mono text-emerald-800 font-bold">
              ✓ Instant payment activation: Your Door Keypad PIN will be activated and emailed immediately upon payment.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => setIsCheckoutOpen(true)}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold bg-emerald-700 hover:bg-emerald-600 shadow-md"
              >
                Pay ₹{holdResult.totalPrice} INR (UPI / QR / Cards) →
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleConfirmHold} className="space-y-4 text-left">
            {/* Workstation Photo & Summary */}
            <div className="p-3 bg-ivory-50 border border-ivory-200 rounded-xl text-xs font-mono space-y-1">
              <div>Station: <strong>{selectedSeat?.seatNumber} ({selectedSeat?.name})</strong></div>
              <div>Plan: <strong>{tenure.toUpperCase()} &bull; {currentShift.name} ({dailyHours} hrs)</strong></div>
              <div>Interval: {formatDisplayDate(startDate)} → {formatDisplayDate(calculatedEndDate)}</div>
              <div>Slot: {timeSlotLabel}</div>
              {withLocker && <div className="text-forest-800 font-bold">Locker: {selectedLocker.label} (+₹{lockerFee} INR)</div>}
              <div className="pt-1 border-t border-ivory-200 text-sm font-bold text-forest-900">
                Payable Fee: ₹{totalPayableAmount} INR
              </div>
            </div>

            <Input
              label="Student Name"
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
              label="Special Accommodations / Requests"
              placeholder="e.g. Left-handed orientation, prefers low foot traffic zone."
              rows={2}
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

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        bookingRequestId={holdResult?.holdRef || "REQ-PENDING"}
        seatLabel={selectedSeat ? `${selectedSeat.seatNumber} (${selectedSeat.name})` : "Desk"}
        durationLabel={`${tenure.toUpperCase()} • ${currentShift.name}`}
        amountPaise={(holdResult?.totalPrice || totalPayableAmount) * 100}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(paymentId, passCode) => {
          setIsHoldDialogOpen(false);
          setIsCheckoutOpen(false);

          if (tenure !== "one_visit") {
            try {
              localStorage.setItem("esz_student_registration_fee_paid", "true");
              setIsReturningMember(true);
            } catch {}
          }

          try {
            const newBooking = {
              id: holdResult?.holdRef || `BK-${Date.now()}`,
              bookingRef: holdResult?.holdRef || `ESZ-${Date.now()}`,
              seatId: selectedSeat?.id || "desk-04",
              seatLabel: selectedSeat ? `Workstation ${selectedSeat.seatNumber} (${selectedSeat.name})` : "Dedicated Workstation",
              roomName: selectedSeat?.zone || "Main Study Sanctuary",
              tierName: `${tenure.toUpperCase()} Plan (${currentShift.name})`,
              startDate: startDate,
              endDate: calculatedEndDate,
              requestStatus: "approved",
              paymentStatus: "paid",
              totalPricePaise: (holdResult?.totalPrice || totalPayableAmount) * 100,
              totalPriceRupees: `${holdResult?.totalPrice || totalPayableAmount}.00`,
              passCode: passCode || `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
              lockerLabel: withLocker ? selectedLocker.label : "None",
            };

            const existing = JSON.parse(localStorage.getItem("esz_student_bookings") || "[]");
            const updated = [newBooking, ...existing];
            localStorage.setItem("esz_student_bookings", JSON.stringify(updated));

            fetch("/api/member/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newBooking),
            }).catch(() => {});
          } catch (e) {
            console.error("Failed to save booking:", e);
          }

          window.location.href = "/dashboard?tab=residencies";
        }}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center font-serif text-charcoal-700">Loading workstation intake engine…</div>}>
      <BookContent />
    </Suspense>
  );
}
