import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";
import { BookingEngine } from "@/lib/booking/bookingEngine";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const refunds = BookingEngine.getAllRefunds();
  return NextResponse.json({ success: true, refunds });
}

export async function POST(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { refundId, staffId = "staff_curator_1" } = body;

    if (!refundId) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "refundId is required." },
        { status: 400 }
      );
    }

    const result = await AdminService.dispatchRefund(refundId, staffId);
    if (result.success) {
      try {
        const { RazorpayClient } = await import("@/lib/payments/razorpay");
        const allRefunds = BookingEngine.getAllRefunds();
        const refund = allRefunds.find((r) => r.id === refundId);
        if (refund) {
          const providerResult = await RazorpayClient.createRefund({
            paymentId: refund.paymentAttemptId.replace(/^pay-/, ""),
            amountPaise: refund.amountPaise,
            notes: { refundId: refund.id, reason: refund.reason },
          });
          result.providerRefundId = providerResult.id;
        }
      } catch (e) {
        console.error("[Refund] Provider dispatch log:", e);
      }
    }
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Refund dispatch failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
