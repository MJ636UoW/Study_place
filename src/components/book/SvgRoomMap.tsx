"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Seat, SeatAvailability } from "@/lib/bookingAdapter";
import { Compass } from "lucide-react";

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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-ivory-100/70 border border-ivory-300 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Available */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-ivory-50 border border-charcoal-700" />
            <span className="text-charcoal-700">Available</span>
          </div>

          {/* Selected */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-forest-900 border-2 border-amber-600 ring-1 ring-forest-900" />
            <span className="text-charcoal-900 font-semibold">Selected</span>
          </div>

          {/* Temporarily Held */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-700 border-dashed" />
            <span className="text-amber-800">Temporarily Held</span>
          </div>

          {/* Unavailable */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-stone-300 border border-stone-400 opacity-60" />
            <span className="text-stone-500">Unavailable for Dates</span>
          </div>
        </div>

        <div className="text-[10px] text-charcoal-500 uppercase tracking-widest flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-forest-800" />
          <span>Interactive Architectural Plat</span>
        </div>
      </div>

      {/* Main SVG Floor Plan Canvas */}
      <div className="relative border border-ivory-300 bg-ivory-50 overflow-hidden shadow-editorial">
        {/* Subtle Architectural Grid Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#DDD3C1 1px, transparent 1px), linear-gradient(90deg, #DDD3C1 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 540 380"
          className="w-full h-auto select-none"
          role="region"
          aria-label="Sanctuary 20-seat interactive floorplan"
        >
          {/* Defs for hatched pattern on unavailable seats */}
          <defs>
            <pattern id="hatch-unavailable" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#9E9689" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Exterior Walls */}
          <rect x="15" y="15" width="510" height="350" fill="none" stroke="#1A1918" strokeWidth="3" />

          {/* ZONE 1: North Skylight Gallery (Top Left) */}
          <rect x="25" y="25" width="280" height="175" fill="#FAF8F5" stroke="#DDD3C1" strokeWidth="1" strokeDasharray="4 2" />
          <text x="35" y="45" fill="#706B64" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
            ZONE A • NORTH SKYLIGHT GALLERY
          </text>
          <line x1="25" y1="52" x2="160" y2="52" stroke="#DDD3C1" strokeWidth="1" />

          {/* ZONE 2: Reference Stacks & Focus Alcoves (Top Right) */}
          <rect x="315" y="25" width="200" height="175" fill="#F4EFE6" stroke="#DDD3C1" strokeWidth="1" strokeDasharray="4 2" />
          <text x="325" y="45" fill="#706B64" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
            ZONE B • REFERENCE STACKS
          </text>
          <line x1="315" y1="52" x2="435" y2="52" stroke="#DDD3C1" strokeWidth="1" />

          {/* Bookcase decorative lines in Stacks */}
          <rect x="495" y="65" width="12" height="120" fill="#EAE3D5" stroke="#2E2C29" strokeWidth="1" />

          {/* Dividing Central Corridor */}
          <line x1="15" y1="210" x2="525" y2="210" stroke="#1A1918" strokeWidth="1.5" strokeDasharray="8 4" />
          <text x="270" y="206" textAnchor="middle" fill="#99938B" fontSize="8" fontFamily="monospace" letterSpacing="0.2em">
            CENTRAL WHISPER LOGGIA CORRIDOR
          </text>

          {/* ZONE 3: Courtyard Loggia (Bottom Left) */}
          <rect x="25" y="220" width="215" height="145" fill="#FAF8F5" stroke="#DDD3C1" strokeWidth="1" strokeDasharray="4 2" />
          <text x="35" y="235" fill="#706B64" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
            ZONE C • COURTYARD LOGGIA
          </text>
          {/* Courtyard glass boundary indication */}
          <line x1="25" y1="365" x2="240" y2="365" stroke="#183728" strokeWidth="2.5" />
          <text x="130" y="362" textAnchor="middle" fill="#183728" fontSize="7" fontFamily="sans-serif">
            BOTANICAL GLASSHOUSE WALL
          </text>

          {/* ZONE 4: East Timber Mezzanine (Bottom Right) */}
          <rect x="250" y="220" width="265" height="145" fill="#F4EFE6" stroke="#DDD3C1" strokeWidth="1" strokeDasharray="4 2" />
          <text x="260" y="235" fill="#706B64" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
            ZONE D • TIMBER MEZZANINE
          </text>

          {/* SEATS RENDERING (20 SEATS) */}
          {availabilities.map((avail) => {
            const { seat, status, statusMessage } = avail;
            const isSelected = selectedSeatId === seat.id;
            const isUnavailable = status === "unavailable";
            const isHeld = status === "temporarily_held";

            // Determine visual styles
            let rectFill = "#FAF8F5";
            let rectStroke = "#1A1918";
            let rectStrokeWidth = 1.5;
            let textFill = "#1A1918";
            let dashArray = undefined;

            if (isUnavailable) {
              rectFill = "url(#hatch-unavailable)";
              rectStroke = "#9E9689";
              textFill = "#706B64";
            } else if (isSelected) {
              rectFill = "#183728";
              rectStroke = "#C5832B";
              rectStrokeWidth = 3;
              textFill = "#FAF8F5";
            } else if (isHeld) {
              rectFill = "#FEF3D6";
              rectStroke = "#B37423";
              rectStrokeWidth = 1.8;
              textFill = "#7D4F12";
              dashArray = "3 2";
            }

            return (
              <g
                key={seat.id}
                role="button"
                tabIndex={isUnavailable ? -1 : 0}
                aria-disabled={isUnavailable}
                aria-pressed={isSelected}
                aria-label={`${seat.seatNumber}: ${seat.name}, ${seat.zone}. Status: ${status}. ${statusMessage || ""}`}
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
                    : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                  "focus-visible:ring-2 focus-visible:ring-forest-900"
                )}
              >
                {/* Smooth Seat Selection Highlight Halo */}
                {isSelected && (
                  <rect
                    x={seat.mapX - 4}
                    y={seat.mapY - 4}
                    width={seat.mapWidth + 8}
                    height={seat.mapHeight + 8}
                    fill="none"
                    stroke="#C5832B"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    rx="3"
                    className="transition-all duration-200"
                  />
                )}

                {/* Desk Surface Rect */}
                <rect
                  x={seat.mapX}
                  y={seat.mapY}
                  width={seat.mapWidth}
                  height={seat.mapHeight}
                  fill={rectFill}
                  stroke={rectStroke}
                  strokeWidth={rectStrokeWidth}
                  strokeDasharray={dashArray}
                  rx="1"
                  style={{ transition: "fill 140ms ease-out, stroke 140ms ease-out" }}
                />

                {/* Desk Identifier Number */}
                <text
                  x={seat.mapX + seat.mapWidth / 2}
                  y={seat.mapY + seat.mapHeight / 2 - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textFill}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                >
                  {seat.seatNumber}
                </text>

                {/* Sub-label state */}
                <text
                  x={seat.mapX + seat.mapWidth / 2}
                  y={seat.mapY + seat.mapHeight / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? "#E5AF5D" : isHeld ? "#915E1A" : isUnavailable ? "#8F8980" : "#6E6962"}
                  fontSize="7"
                  fontFamily="sans-serif"
                  letterSpacing="0.05em"
                >
                  {isSelected ? "SELECTED" : isHeld ? "HELD" : isUnavailable ? "BOOKED" : "OPEN"}
                </text>

                {/* Ergonomic Chair Indicator on Front Edge */}
                <circle
                  cx={seat.mapX + seat.mapWidth / 2}
                  cy={seat.mapY + seat.mapHeight + 6}
                  r="4"
                  fill={isSelected ? "#C5832B" : isUnavailable ? "#C8BBA5" : "#1A1918"}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Inspector Tooltip Strip */}
        <div className="p-3 bg-ivory-100 border-t border-ivory-200 flex items-center justify-between text-xs font-sans min-h-[44px]">
          {hoveredSeat ? (
            <div className="flex items-center gap-2 text-charcoal-900">
              <span className="font-mono font-bold">{hoveredSeat.seat.seatNumber}</span>
              <span>—</span>
              <span className="font-semibold">{hoveredSeat.seat.name}</span>
              <span className="text-charcoal-500 text-[11px]">({hoveredSeat.seat.zone})</span>
              <span className="text-[11px] font-mono text-amber-800">
                • {hoveredSeat.statusMessage}
              </span>
            </div>
          ) : (
            <div className="text-charcoal-500 text-[11px] font-sans">
              Click or press Enter on any open workstation to inspect features and reserve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
