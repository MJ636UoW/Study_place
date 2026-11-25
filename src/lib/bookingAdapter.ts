import { type DurationType, doIntervalsOverlap } from "./dateUtils.ts";

export type SeatStatus = "available" | "unavailable" | "selected" | "temporarily_held";

export interface Seat {
  id: string;
  seatNumber: string;
  name: string;
  zone: string;
  viewDescription: string;
  verifiedFeatures: string[];
  photoUrl?: string;
  // SVG Map placement
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
  // Existing reservations
  bookedRanges: { start: string; end: string; reason: string }[];
  heldRanges: { start: string; end: string; expiresAt: string; note: string }[];
}

export interface SeatAvailability {
  seat: Seat;
  status: SeatStatus;
  statusMessage?: string;
}

export interface AvailabilityQuery {
  startDate: string;
  endDate: string;
  duration: DurationType;
  zoneFilter?: string;
}

export interface HoldRequest {
  seatId: string;
  startDate: string;
  endDate: string;
  duration: DurationType;
  guestName: string;
  guestEmail: string;
  specialRequests?: string;
}

export interface HoldResponse {
  success: boolean;
  holdRef: string;
  expiresAt: string;
  totalPrice: number;
  message: string;
}

/**
 * Replaceable Data Adapter Interface
 * Swap this mock implementation with an API or Supabase/PostgreSQL adapter.
 */
export interface BookingDataAdapter {
  getAllSeats(): Promise<Seat[]>;
  checkAvailability(query: AvailabilityQuery): Promise<SeatAvailability[]>;
  submitHold(request: HoldRequest): Promise<HoldResponse>;
}

export const SEATS_FIXTURE_18: Seat[] = [
  // --- Left Wing: Desks 1 to 9 (Bottom to Top) ---
  {
    id: "seat-01",
    seatNumber: "1",
    name: "Workstation Desk 1",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing entry-adjacent workstation with rapid aisle access",
    verifiedFeatures: [
      "Dedicated 230V AC socket & 65W USB-C PD",
      "Ergonomic mesh high-back chair",
      "Warm circadian LED desk lamp",
      "High-speed 5G WiFi & wired Cat6 port",
    ],
    photoUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    mapX: 46,
    mapY: 704,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-02",
    seatNumber: "2",
    name: "Workstation Desk 2",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing lower-middle perimeter workstation",
    verifiedFeatures: [
      "Anti-glare matte writing surface",
      "Dual universal power outlets",
      "Silent study zone priority (< 35 dBA)",
      "Dedicated under-desk bag hook",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    mapX: 46,
    mapY: 622,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-03",
    seatNumber: "3",
    name: "Workstation Desk 3",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing middle workstation with acoustic divider panel",
    verifiedFeatures: [
      "High-density sound baffle screen",
      "Full spectrum reading task light",
      "Certified silent study atmosphere",
      "High-speed fiber connectivity",
    ],
    mapX: 46,
    mapY: 540,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-04",
    seatNumber: "4",
    name: "Workstation Desk 4",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing central corridor study pod",
    verifiedFeatures: [
      "Comfort-foam ergonomic lumbar chair",
      "Individual dimmer lighting control",
      "Dual fast-charging ports",
      "Clean air HEPA diffuser zone",
    ],
    mapX: 46,
    mapY: 458,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-05",
    seatNumber: "5",
    name: "Workstation Desk 5",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing central focus desk with wide workspace",
    verifiedFeatures: [
      "Generous 100x60cm study desk",
      "Surge-protected power supply",
      "Acoustic felt isolation buffer",
      "Direct sightline to central aisle",
    ],
    mapX: 46,
    mapY: 376,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-06",
    seatNumber: "6",
    name: "Workstation Desk 6",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing upper-middle workstation for deep focus",
    verifiedFeatures: [
      "Shielded study alcove with reduced glare",
      "Multi-angle adjustable desk light",
      "Spacious footrest & lumbar support",
      "Zero-distraction zone guarantee",
    ],
    mapX: 46,
    mapY: 294,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-07",
    seatNumber: "7",
    name: "Workstation Desk 7",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing quiet upper workstation",
    verifiedFeatures: [
      "Silent zone priority rating (< 34 dBA)",
      "Twin AC sockets & USB-C power",
      "Comfort executive study chair",
      "Stable high-speed WiFi 6",
    ],
    mapX: 46,
    mapY: 212,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-08",
    seatNumber: "8",
    name: "Workstation Desk 8",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Left wing upper workstation facing across from Desk 11",
    verifiedFeatures: [
      "Optimal reading temperature 2700K lamp",
      "Smooth solid-surface writing tabletop",
      "Ergonomic mesh back support",
      "Wired Cat6 Ethernet drop",
    ],
    mapX: 46,
    mapY: 130,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-09",
    seatNumber: "9",
    name: "Workstation Desk 9",
    zone: "Left Wing (Desks 1-9)",
    viewDescription: "Top-left quiet corner workstation with maximum privacy",
    verifiedFeatures: [
      "Maximum isolation corner workstation",
      "Double-buffered acoustic wall boundary",
      "Dual 65W fast charger ports",
      "Overhead warm ambient accent light",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
    mapX: 46,
    mapY: 48,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },

  // --- Head Wall: Desk 10 (Horizontal) ---
  {
    id: "seat-10",
    seatNumber: "10",
    name: "Workstation Desk 10",
    zone: "Head Wall (Desk 10)",
    viewDescription: "Top head wall prime executive workstation overlooking central gallery",
    verifiedFeatures: [
      "Prime central head-wall position",
      "Wide-span panoramic executive desk",
      "Premium high-back ergonomic chair",
      "Dual AC outlets & dual fast USB-C PD",
    ],
    photoUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80",
    mapX: 184,
    mapY: 26,
    mapWidth: 84,
    mapHeight: 56,
    bookedRanges: [],
    heldRanges: [],
  },

  // --- Right Wing: Desks 11 to 18 (Top to Bottom) ---
  {
    id: "seat-11",
    seatNumber: "11",
    name: "Workstation Desk 11",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing upper study pod positioned below architectural recess",
    verifiedFeatures: [
      "Sheltered nook acoustics buffer",
      "Solid writing desk with cable pass-through",
      "Ergonomic mesh chair",
      "Dedicated fiber Internet connection",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    mapX: 306,
    mapY: 130,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-12",
    seatNumber: "12",
    name: "Workstation Desk 12",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing upper-middle workstation facing across from Desk 7",
    verifiedFeatures: [
      "Dedicated warm LED reading task light",
      "Dual 230V outlets & surge suppression",
      "Ergonomic contoured seat cushion",
      "Quiet zone compliance (< 35 dBA)",
    ],
    mapX: 306,
    mapY: 212,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-13",
    seatNumber: "13",
    name: "Workstation Desk 13",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing middle focus desk with acoustic isolation",
    verifiedFeatures: [
      "Dense acoustic divider screen",
      "High-speed dual-band WiFi 6",
      "Matte eye-comfort desktop surface",
      "Convenient power hub at table height",
    ],
    mapX: 306,
    mapY: 294,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-14",
    seatNumber: "14",
    name: "Workstation Desk 14",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing center workstation with clear aisle spacing",
    verifiedFeatures: [
      "Full ergonomic tilt & swivel chair",
      "Individual desk light control",
      "Universal charging outlets",
      "Continuous airflow from filtered vent",
    ],
    mapX: 306,
    mapY: 376,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-15",
    seatNumber: "15",
    name: "Workstation Desk 15",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing lower-middle study station",
    verifiedFeatures: [
      "Solid oak-finish sturdy work surface",
      "Surge-protected multi-plug strip",
      "Lumbar support adjustable chair",
      "Zero distraction sound rating",
    ],
    mapX: 306,
    mapY: 458,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-16",
    seatNumber: "16",
    name: "Workstation Desk 16",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing lower focus desk with wide legroom",
    verifiedFeatures: [
      "Generous legroom and storage buffer",
      "Warm reading lamp with dimmer",
      "High-speed fiber connectivity",
      "Acoustic paneling on rear wall",
    ],
    mapX: 306,
    mapY: 540,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-17",
    seatNumber: "17",
    name: "Workstation Desk 17",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing lower workstation facing across from Desk 2",
    verifiedFeatures: [
      "Ergonomic mesh chair with headrest",
      "Dedicated dual AC outlets",
      "Circadian anti-fatigue task lamp",
      "Spacious desktop area",
    ],
    mapX: 306,
    mapY: 622,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-18",
    seatNumber: "18",
    name: "Workstation Desk 18",
    zone: "Right Wing (Desks 11-18)",
    viewDescription: "Right wing entry-adjacent workstation with quick exit route",
    verifiedFeatures: [
      "Quick access to main entrance door",
      "High-speed fiber internet and power hub",
      "Ergonomic seating with lumbar control",
      "Clean air circulation zone",
    ],
    photoUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    mapX: 306,
    mapY: 704,
    mapWidth: 78,
    mapHeight: 74,
    bookedRanges: [],
    heldRanges: [],
  },
];

export const SEATS_FIXTURE_20: Seat[] = SEATS_FIXTURE_18;

/**
 * Fixture Data Adapter Implementation
 */
export class FixtureBookingAdapter implements BookingDataAdapter {
  private seats: Seat[];

  constructor(initialSeats: Seat[] = SEATS_FIXTURE_18) {
    this.seats = [...initialSeats];
  }

  async getAllSeats(): Promise<Seat[]> {
    // Simulate brief network latency
    await new Promise((r) => setTimeout(r, 60));
    return this.seats;
  }

  async checkAvailability(query: AvailabilityQuery): Promise<SeatAvailability[]> {
    await new Promise((r) => setTimeout(r, 120));

    return this.seats.map((seat) => {
      // 1. Check if occupied across [query.startDate, query.endDate]
      const occupiedConflict = seat.bookedRanges.find((range) =>
        doIntervalsOverlap(query.startDate, query.endDate, range.start, range.end)
      );

      if (occupiedConflict) {
        return {
          seat,
          status: "unavailable" as SeatStatus,
          statusMessage: `Reserved for ${occupiedConflict.reason} (${occupiedConflict.start} to ${occupiedConflict.end})`,
        };
      }

      // 2. Check if temporarily held
      const heldConflict = seat.heldRanges.find((range) =>
        doIntervalsOverlap(query.startDate, query.endDate, range.start, range.end)
      );

      if (heldConflict) {
        return {
          seat,
          status: "temporarily_held" as SeatStatus,
          statusMessage: `Temporarily held (${heldConflict.note}, expires in ${heldConflict.expiresAt})`,
        };
      }

      // 3. Otherwise available
      return {
        seat,
        status: "available" as SeatStatus,
        statusMessage: "Available for selected membership period",
      };
    });
  }

  async submitHold(request: HoldRequest): Promise<HoldResponse> {
    await new Promise((r) => setTimeout(r, 300));

    const holdRef = `HLD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      success: true,
      holdRef,
      expiresAt,
      totalPrice: 0, // Calculated by caller
      message: `Workstation ${request.seatId} placed on curatorial hold for 15 minutes.`,
    };
  }
}

// Global singleton instance behind the adapter interface
export const bookingAdapter: BookingDataAdapter = new FixtureBookingAdapter();
