import { type DurationType, doIntervalsOverlap } from "./dateUtils.ts";

export type SeatStatus = "available" | "unavailable" | "selected" | "temporarily_held";

export interface Seat {
  id: string;
  seatNumber: string;
  name: string;
  zone: "North Skylight Gallery" | "Courtyard Loggia" | "Reference Stacks" | "East Mezzanine";
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

export const SEATS_FIXTURE_20: Seat[] = [
  // --- North Skylight Gallery (6 seats: N-01 to N-06) ---
  {
    id: "seat-N01",
    seatNumber: "N-01",
    name: "North Skylight Pier 01",
    zone: "North Skylight Gallery",
    viewDescription: "Direct diffused overhead skylight with morning light",
    verifiedFeatures: [
      "Natural 2700K circadian morning light",
      "Solid white oak 160x80cm workstation",
      "Redundant 1 Gbps wired RJ45 drop",
      "Acoustic felt privacy panel",
    ],
    photoUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    mapX: 60,
    mapY: 70,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [{ start: "2026-10-25", end: "2026-11-05", reason: "Resident Fellow Term" }],
    heldRanges: [],
  },
  {
    id: "seat-N02",
    seatNumber: "N-02",
    name: "North Skylight Pier 02",
    zone: "North Skylight Gallery",
    viewDescription: "Northern skylight with timber roof truss reveal",
    verifiedFeatures: [
      "FSC-certified Appalachian oak joinery",
      "Herman Miller Cosm high-back chair",
      "Acoustics certified < 36 dBA",
      "Heavy linen blotter with brass pen rest",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    mapX: 140,
    mapY: 70,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-N03",
    seatNumber: "N-03",
    name: "North Skylight Pier 03",
    zone: "North Skylight Gallery",
    viewDescription: "Central gallery orientation with symmetric timber sightlines",
    verifiedFeatures: [
      "Independent dimmer control on brass lamp",
      "Shielded cellular dead-zone for distraction zero",
      "Dedicated fiber drop",
      "Acoustic wall isolation",
    ],
    mapX: 220,
    mapY: 70,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [{ start: "2026-10-28", end: "2026-11-02", expiresAt: "15 min", note: "Prospective Member Hold" }],
  },
  {
    id: "seat-N04",
    seatNumber: "N-04",
    name: "North Skylight Pier 04",
    zone: "North Skylight Gallery",
    viewDescription: "Corner alcove with limestone wall reveal",
    verifiedFeatures: [
      "Deep reveal 40cm limestone acoustic buffer",
      "Solid white oak workstation",
      "Certified quietude < 34 dBA",
      "Locker #04 pairing",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
    mapX: 60,
    mapY: 135,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-N05",
    seatNumber: "N-05",
    name: "North Skylight Pier 05",
    zone: "North Skylight Gallery",
    viewDescription: "Courtyard sightline looking down into olive trees",
    verifiedFeatures: [
      "Garden courtyard vantage point",
      "Circadian 2700K task lighting",
      "Dual 100W USB-C PD charging ports",
      "Solid oak joinery",
    ],
    mapX: 140,
    mapY: 135,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-N06",
    seatNumber: "N-06",
    name: "North Skylight Pier 06",
    zone: "North Skylight Gallery",
    viewDescription: "Direct gallery center, adjacent to reading reference catalogs",
    verifiedFeatures: [
      "Immediate stack access",
      "High-density felt paneling",
      "Medical HEPA filtered supply diffuser",
      "Ergonomic chair",
    ],
    mapX: 220,
    mapY: 135,
    mapWidth: 65,
    mapHeight: 45,
    bookedRanges: [{ start: "2026-10-24", end: "2026-10-31", reason: "Visiting Scholar" }],
    heldRanges: [],
  },

  // --- Reference Stacks & Focus Alcoves (4 seats: A-01 to A-04) ---
  {
    id: "seat-A01",
    seatNumber: "A-01",
    name: "Archival Alcove 01",
    zone: "Reference Stacks",
    viewDescription: "Surrounded on three sides by historical architecture folios",
    verifiedFeatures: [
      "Three-sided acoustic book baffle",
      "Maximum solitude rating",
      "Dedicated reading easel",
      "Brass archival lamp",
    ],
    photoUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80",
    mapX: 350,
    mapY: 70,
    mapWidth: 60,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-A02",
    seatNumber: "A-02",
    name: "Archival Alcove 02",
    zone: "Reference Stacks",
    viewDescription: "Recessed niche flanked by leather-bound reference stacks",
    verifiedFeatures: [
      "Ultra-low ambient noise (< 32 dBA)",
      "Flat-file blueprint drawer included",
      "Oak drafting desk",
      "Silent zone priority",
    ],
    mapX: 425,
    mapY: 70,
    mapWidth: 60,
    mapHeight: 50,
    bookedRanges: [{ start: "2026-11-01", end: "2026-11-30", reason: "Monograph Fellow" }],
    heldRanges: [],
  },
  {
    id: "seat-A03",
    seatNumber: "A-03",
    name: "Archival Alcove 03",
    zone: "Reference Stacks",
    viewDescription: "Southern wall niche with soft shadow line",
    verifiedFeatures: [
      "Basalt wool acoustic damping",
      "Solid Appalachian oak desk",
      "Individual filtered air terminal",
      "Ethernet port",
    ],
    mapX: 350,
    mapY: 135,
    mapWidth: 60,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-A04",
    seatNumber: "A-04",
    name: "Archival Alcove 04",
    zone: "Reference Stacks",
    viewDescription: "Corner niche at the end of the history stacks",
    verifiedFeatures: [
      "Total visual isolation from pedestrian flow",
      "Warm focused light cone",
      "FSC oak desk",
      "Locker pairing",
    ],
    mapX: 425,
    mapY: 135,
    mapWidth: 60,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [{ start: "2026-10-26", end: "2026-10-30", expiresAt: "10 min", note: "Academic Review Hold" }],
  },

  // --- Courtyard Loggia (4 seats: C-01 to C-04) ---
  {
    id: "seat-C01",
    seatNumber: "C-01",
    name: "Loggia Garden Desk 01",
    zone: "Courtyard Loggia",
    viewDescription: "Floor-to-ceiling glass wall overlooking inner olive courtyard",
    verifiedFeatures: [
      "Direct botanical garden sightlines",
      "Natural cross-ventilation option",
      "Double acoustic glazing",
      "Solid white oak workstation",
    ],
    photoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    mapX: 60,
    mapY: 240,
    mapWidth: 70,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-C02",
    seatNumber: "C-02",
    name: "Loggia Garden Desk 02",
    zone: "Courtyard Loggia",
    viewDescription: "Courtyard glass reveal with afternoon warm glow",
    verifiedFeatures: [
      "Botanical courtyard view",
      "Circadian lighting tuned for dusk",
      "1 Gbps fiber port",
      "Acoustic isolation",
    ],
    mapX: 145,
    mapY: 240,
    mapWidth: 70,
    mapHeight: 50,
    bookedRanges: [{ start: "2026-10-25", end: "2026-11-20", reason: "Atelier Resident" }],
    heldRanges: [],
  },
  {
    id: "seat-C03",
    seatNumber: "C-03",
    name: "Loggia Garden Desk 03",
    zone: "Courtyard Loggia",
    viewDescription: "Loggia colonnade view with limestone pillar backdrop",
    verifiedFeatures: [
      "Sheltered colonnade acoustics",
      "Solid oak table with pencil trough",
      "Ergonomic chair",
      "Pour-over bar proximity (zero noise)",
    ],
    mapX: 60,
    mapY: 310,
    mapWidth: 70,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-C04",
    seatNumber: "C-04",
    name: "Loggia Garden Desk 04",
    zone: "Courtyard Loggia",
    viewDescription: "Corner loggia with gravel garden sightline",
    verifiedFeatures: [
      "Quiet garden corner",
      "Circadian task illumination",
      "High-speed fiber",
      "Locker access",
    ],
    mapX: 145,
    mapY: 310,
    mapWidth: 70,
    mapHeight: 50,
    bookedRanges: [],
    heldRanges: [],
  },

  // --- East Timber Mezzanine (6 seats: M-01 to M-06) ---
  {
    id: "seat-M01",
    seatNumber: "M-01",
    name: "Mezzanine Pier 01",
    zone: "East Mezzanine",
    viewDescription: "Elevated vantage point overlooking the double-height reading gallery",
    verifiedFeatures: [
      "Elevated mezzanine perspective",
      "Douglas fir timber rafters overhead",
      "Ultra-quiet upper tier (< 35 dBA)",
      "Dedicated fiber line",
    ],
    photoUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    mapX: 300,
    mapY: 240,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-M02",
    seatNumber: "M-02",
    name: "Mezzanine Pier 02",
    zone: "East Mezzanine",
    viewDescription: "Upper timber mezzanine with eastern clerestory window",
    verifiedFeatures: [
      "Gentle morning eastern sunrise light",
      "Solid oak joinery",
      "Acoustic floor insulation",
      "Cosm task chair",
    ],
    mapX: 375,
    mapY: 240,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [{ start: "2026-10-27", end: "2026-11-03", reason: "Sprint Scholar" }],
    heldRanges: [],
  },
  {
    id: "seat-M03",
    seatNumber: "M-03",
    name: "Mezzanine Pier 03",
    zone: "East Mezzanine",
    viewDescription: "Central mezzanine overlooking central reading stacks",
    verifiedFeatures: [
      "Balanced natural light",
      "Quiet mezzanine atmosphere",
      "Redundant fiber line",
      "Brass task lamp",
    ],
    mapX: 450,
    mapY: 240,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-M04",
    seatNumber: "M-04",
    name: "Mezzanine Pier 04",
    zone: "East Mezzanine",
    viewDescription: "Deep upper alcove with cedar wall lining",
    verifiedFeatures: [
      "Aromatic cedar wall paneling",
      "Exceptional sound absorption",
      "Solid oak desk",
      "Locker pairing",
    ],
    mapX: 300,
    mapY: 305,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-M05",
    seatNumber: "M-05",
    name: "Mezzanine Pier 05",
    zone: "East Mezzanine",
    viewDescription: "Upper gallery edge with reading room overview",
    verifiedFeatures: [
      "Expansive spatial sightline",
      "Circadian lighting control",
      "Dual USB-C PD power",
      "High-speed fiber",
    ],
    mapX: 375,
    mapY: 305,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
  {
    id: "seat-M06",
    seatNumber: "M-06",
    name: "Mezzanine Pier 06",
    zone: "East Mezzanine",
    viewDescription: "Corner mezzanine near rare manuscript vitrines",
    verifiedFeatures: [
      "Quiet corner position",
      "Museum-grade humidity & air filtering",
      "Solid oak workstation",
      "Cosm task chair",
    ],
    mapX: 450,
    mapY: 305,
    mapWidth: 60,
    mapHeight: 45,
    bookedRanges: [],
    heldRanges: [],
  },
];

/**
 * Fixture Data Adapter Implementation
 */
export class FixtureBookingAdapter implements BookingDataAdapter {
  private seats: Seat[];

  constructor(initialSeats: Seat[] = SEATS_FIXTURE_20) {
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
