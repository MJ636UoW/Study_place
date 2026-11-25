"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Seat, SeatAvailability } from "@/lib/bookingAdapter";
import { Compass, Check } from "lucide-react";

interface SvgRoomMapProps {
  availabilities: SeatAvailability[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: Seat) => void;
  className?: string;
}

export const SvgRoomMap: React.FC<SvgRoomMapProps> = ({
  availabilities,
  selectedSeatId,
  onSelectSeat,
  className,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<SeatAvailability | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, avail: SeatAvailability) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (avail.status !== "unavailable") {
        onSelectSeat(avail.seat);
      }
    }
  };

  return (
    <div className={clsx("w-full space-y-4", className)}>
      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Available */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-sky-50 border-2 border-[#0B2545] rounded-sm" />
            <span className="text-slate-800 font-medium">Available (Open)</span>
          </div>

          {/* Selected */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#0B2545] border-2 border-blue-500 rounded-sm" />
            <span className="text-[#0B2545] font-bold">Selected</span>
          </div>

          {/* Temporarily Held */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-amber-100 border-2 border-amber-600 border-dashed rounded-sm" />
            <span className="text-amber-800">Temporarily Held</span>
          </div>

          {/* Unavailable / Booked */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-400 opacity-60 rounded-sm" />
            <span className="text-slate-500">Booked / Occupied</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1 font-semibold">
          <Compass className="w-3.5 h-3.5 text-[#0B2545]" />
          <span>Real Room Layout &bull; 18 Desks</span>
        </div>
      </div>

      {/* Main SVG Floor Plan Canvas */}
      <div className="relative border-2 border-slate-200 bg-white rounded-xl overflow-hidden shadow-md max-w-xl mx-auto">
        {/* Architectural Subtle Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 430 870"
          className="w-full h-auto select-none p-2 sm:p-4"
          role="region"
          aria-label="Elite Study Zone 18-seat real architectural floorplan"
        >
          {/* Hatched Pattern for Booked Seats */}
          <defs>
            <pattern
              id="hatch-unavailable-desk"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94A3B8" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* =========================================================================
              OUTER ARCHITECTURAL WALLS
              Matches real blueprint:
              - Left straight wall from y:20 to y:790
              - Bottom wall with entrance opening from x:165 to x:245
              - Right wall from y:790 up to y:118
              - Architectural recess at top-right (x:388 -> x:272 -> y:20)
              - Top wall from x:272 to x:42
              ========================================================================= */}
          <path
            d="
              M 42,20
              L 272,20
              L 272,118
              L 388,118
              L 388,790
              L 245,790
              M 165,790
              L 42,790
              Z
            "
            fill="none"
            stroke="#0B2545"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Central Whisper Hallway Guide Label */}
          <text
            x="215"
            y="435"
            textAnchor="middle"
            fill="#CBD5E1"
            fontSize="11"
            fontFamily="monospace"
            letterSpacing="0.3em"
            transform="rotate(-90 215 435)"
            className="font-bold select-none pointer-events-none"
          >
            MAIN WALKWAY CORRIDOR
          </text>

          {/* Top Notch Decorative Architectural Accent */}
          <line
            x1="272"
            y1="118"
            x2="388"
            y2="118"
            stroke="#0B2545"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.3"
          />

          {/* =========================================================================
              ENTRANCE DOOR & SWING (Bottom Center x: 165 to 245, y: 790)
              ========================================================================= */}
          <g id="entrance-door" className="select-none">
            {/* Door swing arc */}
            <path
              d="M 165,790 A 70,70 0 0,1 235,745"
              fill="none"
              stroke="#0B2545"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            {/* Door leaf */}
            <line
              x1="165"
              y1="790"
              x2="235"
              y2="745"
              stroke="#0B2545"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Entrance Door Hinge Pivot */}
            <circle cx="165" cy="790" r="3.5" fill="#0B2545" />

            {/* Entry Arrow ⬆ */}
            <path
              d="M 205,845 L 205,805 M 195,818 L 205,805 L 215,818"
              fill="none"
              stroke="#0B2545"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="205"
              y="860"
              textAnchor="middle"
              fill="#0B2545"
              fontSize="10"
              fontFamily="sans-serif"
              fontWeight="800"
              letterSpacing="0.12em"
            >
              ENTRANCE
            </text>
          </g>

          {/* =========================================================================
              18 WORKSTATIONS RENDERING
              ========================================================================= */}
          {availabilities.map((avail) => {
            const { seat, status, statusMessage } = avail;
            const isSelected = selectedSeatId === seat.id;
            const isUnavailable = status === "unavailable";
            const isHeld = status === "temporarily_held";

            // Visual styles exactly aligned with architectural blueprint
            let rectFill = "#EFF6FF"; // Soft brand blue fill
            let rectStroke = "#0B2545"; // Deep navy
            let rectStrokeWidth = 2.5;
            let textFill = "#0B2545";
            let dashArray = undefined;

            if (isUnavailable) {
              rectFill = "url(#hatch-unavailable-desk)";
              rectStroke = "#94A3B8";
              rectStrokeWidth = 1.5;
              textFill = "#64748B";
            } else if (isSelected) {
              rectFill = "#0B2545";
              rectStroke = "#2563EB";
              rectStrokeWidth = 3.5;
              textFill = "#FFFFFF";
            } else if (isHeld) {
              rectFill = "#FEF3C7";
              rectStroke = "#D97706";
              rectStrokeWidth = 2;
              textFill = "#92400E";
              dashArray = "4 3";
            }

            return (
              <g
                key={seat.id}
                role="button"
                tabIndex={isUnavailable ? -1 : 0}
                aria-disabled={isUnavailable}
                aria-pressed={isSelected}
                aria-label={`Workstation ${seat.seatNumber}: ${seat.name}, ${seat.zone}. Status: ${status}. ${
                  statusMessage || ""
                }`}
                onClick={() => {
                  if (!isUnavailable) onSelectSeat(seat);
                }}
                onKeyDown={(e) => handleKeyDown(e, avail)}
                onMouseEnter={() => setHoveredSeat(avail)}
                onMouseLeave={() => setHoveredSeat(null)}
                className={clsx(
                  "transition-all duration-150 outline-none",
                  isUnavailable
                    ? "cursor-not-allowed opacity-75"
                    : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
                  "focus-visible:ring-2 focus-visible:ring-blue-600"
                )}
              >
                {/* Selected Halo Ring */}
                {isSelected && (
                  <rect
                    x={seat.mapX - 4}
                    y={seat.mapY - 4}
                    width={seat.mapWidth + 8}
                    height={seat.mapHeight + 8}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    rx="6"
                    className="animate-pulse"
                  />
                )}

                {/* Desk Outer Box */}
                <rect
                  x={seat.mapX}
                  y={seat.mapY}
                  width={seat.mapWidth}
                  height={seat.mapHeight}
                  fill={rectFill}
                  stroke={rectStroke}
                  strokeWidth={rectStrokeWidth}
                  strokeDasharray={dashArray}
                  rx="3"
                  style={{ transition: "fill 140ms ease-out, stroke 140ms ease-out" }}
                />

                {/* Large Bold Seat Number (Blueprint Style) */}
                <text
                  x={seat.mapX + seat.mapWidth / 2}
                  y={seat.mapY + seat.mapHeight / 2 - (seat.seatNumber === "10" ? 2 : 4)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textFill}
                  fontSize={seat.seatNumber === "10" ? "20" : "24"}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="900"
                  letterSpacing="-0.02em"
                >
                  {seat.seatNumber}
                </text>

                {/* Status Sub-badge */}
                <text
                  x={seat.mapX + seat.mapWidth / 2}
                  y={seat.mapY + seat.mapHeight / 2 + (seat.seatNumber === "10" ? 14 : 16)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={
                    isSelected
                      ? "#93C5FD"
                      : isHeld
                      ? "#B45309"
                      : isUnavailable
                      ? "#64748B"
                      : "#2563EB"
                  }
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="0.06em"
                >
                  {isSelected ? "SELECTED" : isHeld ? "HELD" : isUnavailable ? "BOOKED" : "AVAILABLE"}
                </text>

                {/* Desk Selection Indicator Icon */}
                {isSelected && (
                  <circle
                    cx={seat.mapX + seat.mapWidth - 10}
                    cy={seat.mapY + 10}
                    r="5"
                    fill="#3B82F6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Inspector Tooltip Strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-sans min-h-[44px]">
          {hoveredSeat ? (
            <div className="flex items-center gap-2 text-slate-900 flex-wrap">
              <span className="font-mono font-extrabold text-[#0B2545] bg-sky-100 px-2 py-0.5 rounded text-xs">
                Desk #{hoveredSeat.seat.seatNumber}
              </span>
              <span className="font-semibold text-slate-800">{hoveredSeat.seat.name}</span>
              <span className="text-slate-500 text-[11px]">({hoveredSeat.seat.zone})</span>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">
                • {hoveredSeat.statusMessage}
              </span>
            </div>
          ) : (
            <div className="text-slate-500 text-[11px] font-sans flex items-center gap-1.5">
              <span>👉 Click or tap any open desk (#1 to #18) on the floorplan to reserve.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
