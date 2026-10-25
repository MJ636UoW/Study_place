import { NextRequest, NextResponse } from "next/server";
import { BookingEngine } from "@/lib/booking/bookingEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, userId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing required bookingId." }, { status: 400 });
    }

    const effectiveUserId = userId || "usr_sterling_01";
    const result = await BookingEngine.renewBooking(bookingId, effectiveUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Renewal failed", message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      requestNumber: result.requestNumber,
      message: "Renewal request submitted. Reminder: Renewal is neither automatic nor guaranteed; it is subject to desk availability and curatorial intake review.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
