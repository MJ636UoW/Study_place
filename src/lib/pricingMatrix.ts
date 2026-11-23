/**
 * Elite Study Zone - Official Pricing Matrix & Plan Specifications
 * Strictly derived from Client Requirements & Official Plan Matrix
 */

export type ShiftId = "quick_focus" | "deep_focus" | "study_shift" | "two_shifts" | "full_day";

export interface ShiftDefinition {
  id: ShiftId;
  name: string;
  hours: number;
  tagline: string;
  description: string;
}

export const SHIFTS: ShiftDefinition[] = [
  {
    id: "quick_focus",
    name: "Quick Focus",
    hours: 2,
    tagline: "2 Hours Daily Focus",
    description: "Ideal for brisk revision, daily practice, and focused study sprints.",
  },
  {
    id: "deep_focus",
    name: "Deep Focus",
    hours: 3,
    tagline: "3 Hours Daily Focus",
    description: "Perfect for deep conceptual study sessions and competitive test drills.",
  },
  {
    id: "study_shift",
    name: "Study Shift",
    hours: 5,
    tagline: "5 Hours Daily Shift",
    description: "Designed for intensive daily preparation and disciplined syllabus completion.",
  },
  {
    id: "two_shifts",
    name: "Two Shifts",
    hours: 10,
    tagline: "10 Hours Double Shift",
    description: "Comprehensive dual-shift access for civil services, CA, and medical aspirants.",
  },
  {
    id: "full_day",
    name: "Full Day",
    hours: 15,
    tagline: "15 Hours (Full Center Day)",
    description: "Unrestricted open-to-close immersion from 07:00 AM to 11:00 PM.",
  },
];

export type PlanTenure = "one_visit" | "week" | "month" | "weekend";

export interface TenureDefinition {
  id: PlanTenure;
  name: string;
  sublabel: string;
  daysLabel: string;
  daysCount: number;
  hasRegistrationFee: boolean;
}

export const TENURES: TenureDefinition[] = [
  {
    id: "one_visit",
    name: "Hourly / One Visit",
    sublabel: "Single Session Pass",
    daysLabel: "1 Visit",
    daysCount: 1,
    hasRegistrationFee: false,
  },
  {
    id: "week",
    name: "Weekly Plan",
    sublabel: "7 Consecutive Days",
    daysLabel: "7 Days",
    daysCount: 7,
    hasRegistrationFee: true,
  },
  {
    id: "month",
    name: "Monthly Plan",
    sublabel: "30 Calendar Days",
    daysLabel: "30 Days",
    daysCount: 30,
    hasRegistrationFee: true,
  },
  {
    id: "weekend",
    name: "Weekend Plan",
    sublabel: "8 Days of Month (Saturdays & Sundays)",
    daysLabel: "8 Days/Month",
    daysCount: 8,
    hasRegistrationFee: true,
  },
];

export interface PlanPricingRow {
  shiftId: ShiftId;
  shiftName: string;
  hours: number;
  one_visit: number;
  week: number;
  month: number;
  weekend: number;
}

export const DEFAULT_PRICING_MATRIX: PlanPricingRow[] = [
  { shiftId: "quick_focus", shiftName: "Quick Focus", hours: 2, one_visit: 99, week: 549, month: 1349, weekend: 699 },
  { shiftId: "deep_focus", shiftName: "Deep Focus", hours: 3, one_visit: 139, week: 679, month: 1799, weekend: 999 },
  { shiftId: "study_shift", shiftName: "Study Shift", hours: 5, one_visit: 199, week: 999, month: 2599, weekend: 1399 },
  { shiftId: "two_shifts", shiftName: "Two Shifts", hours: 10, one_visit: 299, week: 1599, month: 4499, weekend: 2099 },
  { shiftId: "full_day", shiftName: "Full Day", hours: 15, one_visit: 349, week: 1999, month: 5999, weekend: 2499 },
];

export function getPlanPrice(
  shiftId: ShiftId,
  tenure: PlanTenure,
  customMatrix?: PlanPricingRow[]
): number {
  const matrix = customMatrix && customMatrix.length > 0 ? customMatrix : DEFAULT_PRICING_MATRIX;
  const row = matrix.find((r) => r.shiftId === shiftId) || matrix[0];
  return row[tenure] ?? 99;
}

// Dedicated Storage Locker Pricing & Inventory
export const LOCKER_RATES: Record<PlanTenure, number> = {
  one_visit: 49,
  week: 99,
  month: 299,
  weekend: 299,
};

export interface LockerItem {
  id: string;
  number: string;
  label: string;
  status: "available" | "occupied";
  size: "Standard" | "Spacious";
}

export const LOCKERS_FIXTURE_24: LockerItem[] = Array.from({ length: 24 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  // Lockers 05, 11, 19 occupied for realistic student demo
  const isOccupied = i === 4 || i === 10 || i === 18;
  return {
    id: `locker-${num}`,
    number: `#${num}`,
    label: `Locker #${num}`,
    status: isOccupied ? "occupied" : "available",
    size: i < 12 ? "Standard" : "Spacious",
  };
});
