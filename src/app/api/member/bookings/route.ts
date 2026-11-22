import { NextRequest, NextResponse } from "next/server";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { NotificationService } from "@/lib/notifications/notificationService";
import { sendBookingConfirmationEmail } from "@/lib/mailer";
import { bookingsFixture } from "@/fixtures";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr_sterling_01";

    // 1. Release expired holds first
    BookingEngine.releaseExpiredHolds();

    // 2. Fetch engine allocations & requests
    const engineAllocs = BookingEngine.getAllAllocations().filter((a) => a.userId === userId);
    const engineReqs = BookingEngine.getAllRequests().filter((r) => r.userId === userId);

    // 3. Queue any upcoming membership ending reminders if ending in <= 3 days
    NotificationService.queueMembershipEndingReminders(
      engineAllocs.map((a) => ({
        id: a.id,
        userId: a.userId,
        seatId: a.seatId,
        endDate: a.endDate,
        userName: "Active Scholar",
        userEmail: userId.includes("@") ? userId : "scholar@elitestudyzone.in",
      }))
    );

    // 4. Fetch durable notification records
    const notifications = NotificationService.getNotificationsForUser(userId);

    return NextResponse.json({
      success: true,
      userId,
      allocations: engineAllocs,
      requests: engineReqs,
      notifications,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const booking = await req.json();

    // Extract student email from cookie or booking payload
    const cookieEmail = req.cookies.get("esz_student_email")?.value;
    const cookieName = req.cookies.get("esz_student_name")?.value;
    const cookiePin = req.cookies.get("esz_student_pin")?.value;

    const email = booking.email || (cookieEmail ? decodeURIComponent(cookieEmail) : null);
    const name = booking.name || (cookieName ? decodeURIComponent(cookieName) : "Scholar");
    const doorPin = booking.doorPin || cookiePin || "394821";

    if (email && email.includes("@")) {
      sendBookingConfirmationEmail({
        to: email,
        name,
        bookingRef: booking.bookingRef || booking.id || `ESZ-${Date.now()}`,
        seatLabel: booking.seatLabel || "Dedicated Workstation",
        roomName: booking.roomName || "Main Study Sanctuary",
        timeSlotOrDuration: booking.tierName || "Custom Study Session",
        startDate: booking.startDate || new Date().toISOString().split("T")[0],
        endDate: booking.endDate,
        amountRupees: booking.totalPriceRupees || "294.00",
        doorPin,
      }).catch((e) => console.warn("[Booking Dispatch] Email dispatch error:", e));
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
