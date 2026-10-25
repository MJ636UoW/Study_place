import { type NextRequest, NextResponse } from "next/server";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

/**
 * Authenticated Scheduled Cleanup Endpoint for Expired Payment Holds.
 *
 * Can be triggered periodically by:
 * - Supabase pg_cron (e.g. every minute: SELECT release_expired_holds())
 * - Vercel Cron or GitHub Actions workflow
 * - HTTP request with Bearer CRON_SECRET or service role authorization
 */
export async function POST(request: NextRequest) {
  // Validate authorization
  const authHeader = request.headers.get("authorization") || "";
  const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (expectedSecret && !authHeader.includes(expectedSecret)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Missing or invalid authorization token." },
      { status: 401 }
    );
  }

  const config = getSupabaseConfigStatus();
  let releasedCount = 0;

  if (config.isConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("release_expired_holds");
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      releasedCount = Number(data) || 0;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } else {
    // Engine simulation release
    releasedCount = BookingEngine.releaseExpiredHolds();
  }

  return NextResponse.json({
    success: true,
    releasedCount,
    timestamp: new Date().toISOString(),
    message: `Cleanup completed. ${releasedCount} expired payment holds safely released.`,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
