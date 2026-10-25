"use client";

import React from "react";
import Image from "next/image";
import clsx from "clsx";
import { Seat, SeatStatus } from "@/lib/bookingAdapter";
import { DurationType, DURATION_RULES, formatDisplayDate } from "@/lib/dateUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Check, X, Calendar, Info } from "lucide-react";

interface SeatInspectorProps {
  seat: Seat | null;
  status: SeatStatus;
  statusMessage?: string;
  startDate: string;
  endDate: string;
  duration: DurationType;
  isOpen: boolean;
  onClose: () => void;
  onRequestSeat: (seat: Seat) => void;
  isMobile: boolean;
  className?: string;
}

export const SeatInspector: React.FC<SeatInspectorProps> = ({
  seat,
  status,
  statusMessage,
  startDate,
  endDate,
  duration,
  isOpen,
  onClose,
  onRequestSeat,
  isMobile,
  className,
}) => {
  if (!seat || !isOpen) return null;

  const currentRule = DURATION_RULES.find((r) => r.id === duration) || DURATION_RULES[2];
  const isAvailable = status === "available" || status === "selected";

  const content = (
    <div className="space-y-6 text-left">
      {/* Header Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-ivory-200">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
            Workstation Spec Sheet
          </span>
          <h3 className="font-serif text-2xl text-charcoal-900 leading-tight">
            {seat.name}
          </h3>
          <div className="text-xs text-charcoal-600 font-sans mt-0.5">
            Station {seat.seatNumber} • {seat.zone}
          </div>
        </div>
        <StatusBadge
          status={status === "available" ? "verified" : status === "temporarily_held" ? "pending_review" : "cancelled"}
          label={status === "available" ? "Open for Period" : status === "temporarily_held" ? "Temporary Hold" : "Unavailable"}
        />
      </div>

      {/* Photo when available */}
      {seat.photoUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden border border-ivory-300 bg-ivory-200">
          <Image
            src={seat.photoUrl}
            alt={seat.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-charcoal-950/80 text-[10px] font-mono text-ivory-50 uppercase">
            Actual Workstation Image
          </div>
        </div>
      )}

      {/* View & Orientation */}
      <div className="p-3 bg-ivory-100/60 border border-ivory-200 text-xs font-sans text-charcoal-800">
        <span className="font-semibold text-charcoal-900 block mb-0.5">Aperture & Sightline:</span>
        <p className="text-charcoal-600 leading-relaxed">{seat.viewDescription}</p>
      </div>

      {/* Verified Architectural Features */}
      <div className="space-y-2 text-xs font-sans text-charcoal-800">
        <span className="text-[10px] uppercase font-mono text-charcoal-500 tracking-wider block">
          Verified Workstation Inclusions
        </span>
        <div className="space-y-1.5">
          {seat.verifiedFeatures.map((feat, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-forest-800 flex-shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Period Dates */}
      <div className="p-4 border border-ivory-300 bg-ivory-50 space-y-2 text-xs font-sans">
        <div className="flex items-center justify-between text-charcoal-500 font-mono text-[10px] uppercase">
          <span>Selected Tenure</span>
          <span className="text-forest-900 font-bold">{currentRule.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 font-mono">
          <Calendar className="w-4 h-4 text-forest-800 flex-shrink-0" />
          <span>{formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}</span>
        </div>
      </div>

      {/* Price & Demo Assumption Notice */}
      <div className="p-4 border border-forest-900/20 bg-forest-50/40 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase font-mono text-charcoal-600">Calculated Fee</span>
          <div className="text-right">
            <span className="font-serif text-3xl font-bold text-charcoal-900">
              ${currentRule.basePrice}
            </span>
            <span className="text-xs font-mono text-charcoal-500 ml-1">USD</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 pt-2 border-t border-forest-200 text-[10px] font-mono text-amber-800 leading-tight">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-700" />
          <span>Demo pricing assumption. No payment collected. Subject to final curatorial confirmation.</span>
        </div>
      </div>

      {/* Request Workstation Action */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!isAvailable}
        onClick={() => onRequestSeat(seat)}
      >
        {isAvailable ? "Request Workstation Hold" : "Station Unavailable for Dates"}
      </Button>

      {statusMessage && (
        <p className="text-[11px] font-mono text-charcoal-500 text-center">
          {statusMessage}
        </p>
      )}
    </div>
  );

  // Mobile Bottom Sheet
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={`Workstation ${seat.seatNumber}`}
        subtitle={`${seat.zone} • ${currentRule.label}`}
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop Side Panel (Docked or sliding)
  return (
    <div
      className={clsx(
        "p-6 border border-forest-900/30 bg-ivory-50 shadow-editorial-lg relative transition-all animate-in fade-in duration-200",
        className
      )}
      role="complementary"
      aria-label="Workstation Detail Inspector"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close workstation inspector"
        className="absolute top-4 right-4 p-2 text-charcoal-500 hover:text-charcoal-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>

      {content}
    </div>
  );
};
