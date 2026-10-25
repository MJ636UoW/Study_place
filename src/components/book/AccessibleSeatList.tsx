"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Seat, SeatAvailability } from "@/lib/bookingAdapter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

interface AccessibleSeatListProps {
  availabilities: SeatAvailability[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: Seat) => void;
  className?: string;
}

export const AccessibleSeatList: React.FC<AccessibleSeatListProps> = ({
  availabilities,
  selectedSeatId,
  onSelectSeat,
  className,
}) => {
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  const filtered = availabilities.filter(({ seat, status }) => {
    if (onlyAvailable && status === "unavailable") return false;
    if (zoneFilter === "all") return true;
    return seat.zone === zoneFilter;
  });

  const zones = [
    { id: "all", label: "All Zones (20)" },
    { id: "North Skylight Gallery", label: "North Gallery (6)" },
    { id: "Reference Stacks", label: "Reference Stacks (4)" },
    { id: "Courtyard Loggia", label: "Courtyard Loggia (4)" },
    { id: "East Mezzanine", label: "East Mezzanine (6)" },
  ];

  return (
    <div className={clsx("w-full space-y-6", className)} role="region" aria-label="Accessible seat list">
      {/* Filters Bar */}
      <div className="p-4 border border-ivory-300 bg-ivory-100/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Zone Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZoneFilter(z.id)}
              className={clsx(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors min-h-[44px] flex items-center",
                zoneFilter === z.id
                  ? "bg-forest-900 text-ivory-50 border-forest-900 font-semibold"
                  : "bg-ivory-50 text-charcoal-700 border-ivory-300 hover:bg-ivory-200"
              )}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Toggle Only Available */}
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-sans text-charcoal-800 select-none min-h-[44px]">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="w-4 h-4 text-forest-900 rounded-none border-ivory-300 focus:ring-forest-900"
          />
          <span>Show available only</span>
        </label>
      </div>

      {/* Seat Cards List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-ivory-300 bg-ivory-50">
          <p className="font-serif text-lg text-charcoal-700 italic">
            No workstations match the selected zone filter for these dates.
          </p>
          <button
            type="button"
            onClick={() => {
              setZoneFilter("all");
              setOnlyAvailable(false);
            }}
            className="mt-3 text-xs uppercase font-mono tracking-wider text-forest-900 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const { seat, status, statusMessage } = item;
            const isSelected = selectedSeatId === seat.id;
            const isUnavailable = status === "unavailable";
            const isHeld = status === "temporarily_held";

            return (
              <div
                key={seat.id}
                className={clsx(
                  "p-5 border transition-all flex flex-col justify-between space-y-4 text-left",
                  isSelected
                    ? "border-forest-900 bg-forest-50/50 shadow-editorial ring-1 ring-forest-900"
                    : isUnavailable
                    ? "border-ivory-200 bg-ivory-100/40 opacity-70"
                    : "border-ivory-300 bg-ivory-50 hover:border-charcoal-400"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-charcoal-900 px-2 py-0.5 bg-ivory-200 border border-ivory-300">
                      {seat.seatNumber}
                    </span>
                    <StatusBadge
                      status={
                        isSelected
                          ? "confirmed"
                          : isUnavailable
                          ? "cancelled"
                          : isHeld
                          ? "pending_review"
                          : "verified"
                      }
                      label={
                        isSelected
                          ? "Selected Station"
                          : isUnavailable
                          ? "Unavailable"
                          : isHeld
                          ? "Temporarily Held"
                          : "Available"
                      }
                      size="sm"
                    />
                  </div>

                  <div>
                    <h4 className="font-serif text-xl text-charcoal-900 leading-snug">
                      {seat.name}
                    </h4>
                    <p className="text-xs text-charcoal-600 font-sans mt-0.5">
                      {seat.zone} • {seat.viewDescription}
                    </p>
                  </div>

                  {statusMessage && (
                    <div className="text-[11px] font-mono text-amber-800">
                      {statusMessage}
                    </div>
                  )}

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-2 border-t border-ivory-200 text-xs text-charcoal-700 font-sans">
                    {seat.verifiedFeatures.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest-800 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-ivory-200 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-charcoal-500">
                    Solid White Oak Desk
                  </span>

                  <Button
                    variant={isSelected ? "primary" : isUnavailable ? "outline" : "secondary"}
                    size="sm"
                    disabled={isUnavailable}
                    onClick={() => onSelectSeat(seat)}
                  >
                    {isSelected ? "Station Selected" : isUnavailable ? "Unavailable" : "Inspect & Select"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
