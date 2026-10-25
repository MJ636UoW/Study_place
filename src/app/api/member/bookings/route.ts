import { NextRequest, NextResponse } from "next/server";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { NotificationService } from "@/lib/notifications/notificationService";
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
        userName: "Fellow Sterling",
        userEmail: "sterling@oxford-fellows.net",
      }))
    );

    // 4. Fetch durable notification records
    const notifications = NotificationService.getNotificationsForUser(userId);

    return NextResponse.json({
      success: true,
      userId,
      allocations: engineAllocs,
      requests: engineReqs,
      fixtureBookings: bookingsFixture,
      notifications,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
