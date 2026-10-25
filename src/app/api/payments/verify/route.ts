import { type NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/paymentService";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

/**
 * POST /api/payments/verify
 *
 * Enforces:
 * 1. Server-side verification of Razorpay HMAC SHA-256 signature.
 * 2. Never trusts browser callback alone; checks captured state with provider.
 * 3. Invariant: Late payment after hold expiry routes safely to refunds without stealing the seat.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingRequestId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!bookingRequestId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Missing required checkout parameters (bookingRequestId, orderId, paymentId, signature).",
        },
        { status: 400 }
      );
    }

    // Determine current user
    let userId = body.userId;
    const config = getSupabaseConfigStatus();

    if (config.isConfigured) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          userId = user.id;
        }
      } catch {
        // Fall back to body/header user if auth call fails
      }
    }

    if (!userId) {
      userId = request.headers.get("x-user-id") || "user-resident-2";
    }

    const result = await PaymentService.verifyAndConfirmPayment({
      bookingRequestId,
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!result.success) {
      // Check if this was a late payment routed to refund
      if (result.requiresRefund) {
        return NextResponse.json(
          {
            ...result,
            status: "refund_initiated",
          },
          { status: 409 } // Conflict / seat expired
        );
      }

      const statusCode =
        result.error === "INVALID_SIGNATURE"
          ? 401
          : result.error === "PAYMENT_NOT_CAPTURED"
          ? 402
          : result.error === "NOT_FOUND"
          ? 404
          : 400;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal payment verification error";
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
