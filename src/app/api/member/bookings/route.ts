import { NextRequest, NextResponse } from "next/server";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { NotificationService } from "@/lib/notifications/notificationService";
import { sendBookingConfirmationEmail } from "@/lib/mailer";
import { sendWhatsAppBookingPass } from "@/lib/whatsapp";
import { syncStudentWithFitFaat } from "@/lib/fitfaat";
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
    const phone = booking.phone || req.cookies.get("esz_student_phone")?.value || "";
    const isPendingAdminApproval =
      booking.paymentStatus === "awaiting_verification" ||
      booking.requestStatus === "pending_approval" ||
      booking.passCode === "Pending Admin Approval" ||
      booking.doorPin === "Pending Admin Approval";

    // 1. Register into BookingEngine queue so the request appears in the Admin Portal under "Pending Intake"
    BookingEngine.addPendingUtrBooking({
      id: booking.id || booking.bookingRef || `BK-${Date.now()}`,
      requestNumber: booking.bookingRef || booking.id || `REQ-${Date.now().toString().slice(-4)}`,
      userId: email || "student",
      userName: name,
      userEmail: email || "",
      userPhone: phone,
      seatId: booking.seatId || "desk-04",
      seatLabel: booking.seatLabel || "Dedicated Workstation",
      planId: booking.tierName || "One Visit Plan",
      startDate: booking.startDate || new Date().toISOString().split("T")[0],
      endDate: booking.endDate || booking.startDate || new Date().toISOString().split("T")[0],
      totalPricePaise: Math.round(parseFloat(booking.totalPriceRupees || "99") * 100),
      utrNumber: booking.utrNumber || "",
    });

    // 2. If awaiting admin verification: Do NOT dispatch Door PIN or sync FitFaat yet!
    // The PIN will be generated and dispatched ONLY when the admin approves the request.
    if (isPendingAdminApproval) {
      return NextResponse.json({
        success: true,
        booking,
        status: "pending_approval",
        message: "Payment reference submitted successfully. Waiting for admin approval.",
      });
    }

    // 3. If pre-approved / instant walk-in: Dispatch immediately
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
        amountRupees: booking.totalPriceRupees || "99.00",
        doorPin,
      }).catch((e) => console.warn("[Booking Dispatch] Email dispatch error:", e));
    }

    if (phone) {
      sendWhatsAppBookingPass({
        phone,
        name,
        passCode: doorPin,
        seatOrPass: booking.seatLabel || "Dedicated Workstation",
        slotOrDates: `${booking.startDate || ""} to ${booking.endDate || ""}`,
        amountRupees: String(booking.totalPriceRupees || "99.00"),
      }).catch((e) => console.warn("[WhatsApp] Booking pass dispatch error:", e));

      syncStudentWithFitFaat({
        name,
        mobile: phone,
        email: email || "",
        biometricPin: doorPin,
        planDuration: booking.tierName,
      }).catch((e) => console.warn("[FitFaat] Booking sync error:", e));
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
