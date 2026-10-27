/**
 * Sanctuary Date & Duration Engine
 * Strict calendar rules with month-end and leap-year handling.
 */

export type DurationType = "day" | "week" | "month" | "quarter" | "year";

export interface DurationRule {
  id: DurationType;
  label: string;
  sublabel: string;
  description: string;
  basePrice: number;
}

export const DURATION_RULES: DurationRule[] = [
  {
    id: "day",
    label: "Day Pass",
    sublabel: "1 Day (07:30 — 22:00)",
    description: "Single-session deep focus. Full day access to desk, Wi-Fi, and refreshments.",
    basePrice: 299,
  },
  {
    id: "week",
    label: "Weekly Sprint",
    sublabel: "7 Consecutive Days",
    description: "Seven continuous days of dedicated desk access with locker.",
    basePrice: 1499,
  },
  {
    id: "month",
    label: "Monthly Resident",
    sublabel: "1 Calendar Month",
    description: "Full calendar month with 24/7 keycard access and personal locker.",
    basePrice: 2499,
  },
  {
    id: "quarter",
    label: "Quarterly Fellow",
    sublabel: "3 Calendar Months",
    description: "Three calendar months with all-zone access and 8 guest passes.",
    basePrice: 5999,
  },
  {
    id: "year",
    label: "Annual Residency",
    sublabel: "1 Full Year (Leap Year Aware)",
    description: "365/366 days of continuous tenure with private storage vault and priority support.",
    basePrice: 19999,
  },
];


/**
 * Check if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Days in a specific month, accounting for leap years.
 */
export function getDaysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * Calculate the exact end date based on documented calendar rules:
 * - Day: Same day as start date (ends 22:00).
 * - Week: Exactly 7 days (startDate + 6 days inclusive).
 * - Month: Exact calendar month with month-end clipping.
 *   e.g., Jan 31 -> Feb 28 (or Feb 29 in leap year); Mar 31 -> Apr 30.
 * - Quarter: Exactly 3 calendar months with month-end clipping.
 * - Year: Exact calendar year (same day/month next year, or Feb 28 if starting Feb 29).
 */
export function calculateEndDate(startDateStr: string, duration: DurationType): string {
  const parts = startDateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return startDateStr;
  }

  const [year, month, day] = parts;
  const start = new Date(year, month - 1, day);

  if (duration === "day") {
    return formatDate(start);
  }

  if (duration === "week") {
    // 7 days total inclusive: startDate + 6 days
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return formatDate(end);
  }

  if (duration === "month") {
    const targetMonth0 = start.getMonth() + 1;
    const targetYear = start.getFullYear() + Math.floor(targetMonth0 / 12);
    const normalizedMonth0 = targetMonth0 % 12;

    const maxDaysInTarget = getDaysInMonth(targetYear, normalizedMonth0);
    const targetDay = Math.min(day, maxDaysInTarget);

    const end = new Date(targetYear, normalizedMonth0, targetDay);
    // 1 calendar month duration ends the day before the same numerical day next month
    end.setDate(end.getDate() - 1);
    return formatDate(end);
  }

  if (duration === "quarter") {
    const targetMonth0 = start.getMonth() + 3;
    const targetYear = start.getFullYear() + Math.floor(targetMonth0 / 12);
    const normalizedMonth0 = targetMonth0 % 12;

    const maxDaysInTarget = getDaysInMonth(targetYear, normalizedMonth0);
    const targetDay = Math.min(day, maxDaysInTarget);

    const end = new Date(targetYear, normalizedMonth0, targetDay);
    end.setDate(end.getDate() - 1);
    return formatDate(end);
  }

  if (duration === "year") {
    const targetYear = start.getFullYear() + 1;
    const isTargetLeap = isLeapYear(targetYear);
    const targetMonth0 = start.getMonth();
    let targetDay = day;

    if (start.getMonth() === 1 && day === 29 && !isTargetLeap) {
      targetDay = 28; // Feb 29 rolls to Feb 28 non-leap
    }

    const end = new Date(targetYear, targetMonth0, targetDay);
    end.setDate(end.getDate() - 1);
    return formatDate(end);
  }

  return formatDate(start);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if two date ranges [s1, e1] and [s2, e2] overlap.
 */
export function doIntervalsOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 <= e2 && e1 >= s2;
}
