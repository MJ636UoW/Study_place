/**
 * Sanctuary Date & Duration Engine
 * Strict calendar rules with month-end and leap-year handling.
 * Customized for Elite Study Zone's 4 Official Plans.
 */

export type DurationType = "hour" | "week" | "month" | "weekend" | "day" | "quarter" | "year";

export interface DurationRule {
  id: DurationType;
  label: string;
  sublabel: string;
  description: string;
  basePrice: number;
}

export const DURATION_RULES: DurationRule[] = [
  {
    id: "hour",
    label: "Hourly Plan",
    sublabel: "One Visit / Hourly Pass",
    description: "Quick focused revision & study sprint. Select preferred hours & custom time slot. Zero registration fee.",
    basePrice: 99,
  },
  {
    id: "week",
    label: "Weekly Plan",
    sublabel: "7 Consecutive Days",
    description: "Seven continuous days of dedicated desk access with high-speed internet & smart keypad pass.",
    basePrice: 549,
  },
  {
    id: "month",
    label: "Monthly Plan",
    sublabel: "30 Calendar Days",
    description: "Full calendar month of dedicated desk access, smart keypad door PIN access, and optional locker.",
    basePrice: 1349,
  },
  {
    id: "weekend",
    label: "Weekend Plan",
    sublabel: "8 Days of Month (Sat & Sun)",
    description: "8 dedicated weekend days (4 consecutive Saturdays & Sundays) tailored for working professionals and aspirants.",
    basePrice: 699,
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
 * - Hour / Day: Same day as start date.
 * - Week: Exactly 7 days (startDate + 6 days inclusive).
 * - Month: Exactly 30 calendar days or month-end clipping.
 * - Weekend: 4 consecutive weekends (8 weekend days = 28 calendar days inclusive).
 */
export function calculateEndDate(startDateStr: string, duration: DurationType): string {
  const parts = startDateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return startDateStr;
  }

  const [year, month, day] = parts;
  const start = new Date(year, month - 1, day);

  if (duration === "hour" || duration === "day") {
    return formatDate(start);
  }

  if (duration === "week") {
    // 7 days total inclusive: startDate + 6 days
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return formatDate(end);
  }

  if (duration === "weekend") {
    // 4 full weekends (8 weekend days total = 28 days inclusive)
    const end = new Date(start);
    end.setDate(end.getDate() + 27);
    return formatDate(end);
  }

  if (duration === "month") {
    const targetMonth0 = start.getMonth() + 1;
    const targetYear = start.getFullYear() + Math.floor(targetMonth0 / 12);
    const normalizedMonth0 = targetMonth0 % 12;

    const maxDaysInTarget = getDaysInMonth(targetYear, normalizedMonth0);
    const targetDay = Math.min(day, maxDaysInTarget);

    const end = new Date(targetYear, normalizedMonth0, targetDay);
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
      targetDay = 28;
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

/**
 * Get current date (YYYY-MM-DD) and hour (0-23) in Indian Standard Time (Asia/Kolkata)
 */
export function getIstDateAndHour(): { todayStr: string; currentHour: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const formatted = formatter.format(now);
  const [datePart, hourPart] = formatted.split(", ");
  return {
    todayStr: datePart,
    currentHour: parseInt(hourPart, 10),
  };
}

/**
 * Compute the next day (YYYY-MM-DD) given a date string
 */
export function getTomorrowDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
