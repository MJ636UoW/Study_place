/**
 * Sanctuary Supabase Environment & Business Rules Configuration
 *
 * Implements honest configuration detection (no fake integration),
 * integer paise financial math, and business timezone constants.
 */

export const BUSINESS_TIMEZONE = "Asia/Kolkata";
export const PAISE_PER_INR = 100;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  missingVars: string[];
  message: string;
}

/**
 * Validates whether real Supabase environment variables are present.
 * Detects placeholder values like "https://your-project.supabase.co" or empty strings.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const isRealUrl =
    url.trim().length > 0 &&
    !url.includes("your-project") &&
    !url.includes("placeholder") &&
    url.startsWith("https://");

  const isRealAnonKey =
    anonKey.trim().length > 20 &&
    !anonKey.includes("placeholder") &&
    !anonKey.includes("your-anon-key");

  const isRealServiceKey =
    serviceRoleKey.trim().length > 20 &&
    !serviceRoleKey.includes("placeholder") &&
    !serviceRoleKey.includes("your-service-key");

  const missingVars: string[] = [];
  if (!isRealUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!isRealAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!isRealServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");

  const isConfigured = isRealUrl && isRealAnonKey;

  return {
    isConfigured,
    hasUrl: isRealUrl,
    hasAnonKey: isRealAnonKey,
    hasServiceRoleKey: isRealServiceKey,
    missingVars,
    message: isConfigured
      ? "Supabase integration active and connected."
      : `Supabase unconfigured: missing ${missingVars.join(", ")}. Using offline fixture adapter.`,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

/**
 * Money utilities: Strict integer Paise representation (1 INR = 100 Paise)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_INR);
}

export function paiseToRupees(paise: number | bigint): number {
  return Number(paise) / PAISE_PER_INR;
}

export function formatPaise(paise: number | bigint, options: { showPaiseIfZero?: boolean } = {}): string {
  const rupees = paiseToRupees(paise);
  const hasSubPaise = rupees % 1 !== 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasSubPaise || options.showPaiseIfZero ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
