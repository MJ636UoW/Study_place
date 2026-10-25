import { type NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/paymentService";

/**
 * POST /api/payments/reconcile
 *
 * Authenticated scheduled reconciliation endpoint for missed or delayed Razorpay payment events.
 * Protected by CRON_SECRET or service role authorization.
 */
export async function POST(request: NextRequest) {
  // Validate authorization
  const authHeader = request.headers.get("authorization") || "";
  const cronHeader = request.headers.get("x-cron-secret") || "";
  const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (expectedSecret) {
    const isAuthorized =
      authHeader.includes(expectedSecret) || cronHeader === expectedSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Missing or invalid reconciliation secret." },
        { status: 401 }
      );
    }
  }

  try {
    const result = await PaymentService.reconcileMissedEvents();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reconciliation failed";
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
