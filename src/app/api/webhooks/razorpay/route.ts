import { type NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/paymentService";

/**
 * POST /api/webhooks/razorpay
 *
 * Enforces:
 * 1. HMAC verification using the RAW request body (never parsed JSON).
 * 2. Idempotent deduplication by event ID.
 * 3. Safe handling of duplicated and out-of-order events.
 * 4. Automatic late-payment refund routing if payment arrives after hold expiry.
 */
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Razorpay webhook signature calculation requires the EXACT RAW request body
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!rawBody || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST",
          message: "Missing raw webhook payload or x-razorpay-signature header.",
        },
        { status: 400 }
      );
    }

    const result = await PaymentService.processWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "WEBHOOK_VERIFICATION_FAILED",
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        processed: result.processed,
        duplicate: result.duplicate || false,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal webhook processing error";
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
