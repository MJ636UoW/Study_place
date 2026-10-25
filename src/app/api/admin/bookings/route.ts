import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") || "2026-10-25";

  const reservedSeats = AdminService.getReservedSeatsForDate(date);
  const upcomingEndings = AdminService.getUpcomingEndings(7, date);
  const financial = AdminService.getFinancialBreakdown();

  return NextResponse.json({
    success: true,
    date,
    reservedSeats,
    upcomingEndings,
    financial,
  });
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
    const { action, staffId = "staff_curator_1" } = body;

    if (action === "walk-in") {
      const { seatId, userId, guestName, startDate, endDate } = body;
      if (!seatId || !userId || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_ERROR", message: "Missing required walk-in fields." },
          { status: 400 }
        );
      }
      const result = await AdminService.createWalkIn({
        seatId,
        userId,
        guestName: guestName || "Walk-in Scholar",
        startDate,
        endDate,
        staffId,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === "cash-payment") {
      const { bookingRequestId, receiptRef, notes, amountPaise } = body;
      if (!bookingRequestId || !receiptRef || !amountPaise) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_ERROR", message: "Missing required cash payment fields." },
          { status: 400 }
        );
      }
      const result = await AdminService.recordCashPayment({
        bookingRequestId,
        staffId,
        receiptRef,
        notes: notes || "Cash collected at front loggia desk",
        amountPaise,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === "cancel") {
      const { bookingId, effectiveDate, reason } = body;
      if (!bookingId || !effectiveDate) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_ERROR", message: "bookingId and effectiveDate are required." },
          { status: 400 }
        );
      }
      const result = AdminService.cancelBookingWithEffectiveDate({
        bookingId,
        effectiveDate,
        staffId,
        reason: reason || "Administrative cancellation",
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === "attendance") {
      const { allocationId, status } = body;
      if (!allocationId || !status) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_ERROR", message: "allocationId and status are required." },
          { status: 400 }
        );
      }
      const result = AdminService.recordAttendance(allocationId, status, staffId);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: "INVALID_ACTION", message: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking operation failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
