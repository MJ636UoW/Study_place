import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, effectiveDate, reason, userId } = body;

    if (!bookingId || !effectiveDate) {
      return NextResponse.json({ error: "Missing bookingId or effectiveDate." }, { status: 400 });
    }

    const effectiveUserId = userId || "usr_sterling_01";
    const result = AdminService.cancelBookingWithEffectiveDate({
      bookingId,
      effectiveDate,
      staffId: `member_${effectiveUserId}`,
      reason: reason || "Member requested voluntary cancellation via Dashboard.",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      proratedRefundRupees: result.proratedRefundRupees,
      remainingDays: result.remainingDays,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
