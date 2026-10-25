import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";
import { bookingsFixture } from "@/fixtures";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const previewUser = searchParams.get("previewUser");
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  // If previewUser is requested, return affected bookings & payment implications
  if (previewUser) {
    const preview = AdminService.getAccountRestrictionPreview(previewUser);
    return NextResponse.json({ success: true, preview });
  }

  // Member search across fixtures and active allocations
  const members = bookingsFixture
    .filter((b) => {
      if (!query) return true;
      return (
        b.memberName.toLowerCase().includes(query) ||
        b.memberEmail.toLowerCase().includes(query) ||
        b.bookingRef.toLowerCase().includes(query) ||
        b.seatLabel.toLowerCase().includes(query)
      );
    })
    .map((b) => ({
      userId: `user-${b.memberEmail.split("@")[0]}`,
      name: b.memberName,
      email: b.memberEmail,
      bookingRef: b.bookingRef,
      tier: b.tierName,
      seat: b.seatLabel,
      status: b.status,
    }));

  return NextResponse.json({
    success: true,
    members,
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
    const {
      userId,
      type,
      durationDays,
      reason,
      refundDecision = "manual_review",
      staffId = "staff_curator_1",
    } = body;

    if (!userId || !type || !reason) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "userId, type, and reason are required." },
        { status: 400 }
      );
    }

    if (type !== "suspension" && type !== "ban") {
      return NextResponse.json(
        { success: false, error: "INVALID_TYPE", message: "Type must be 'suspension' or 'ban'." },
        { status: 400 }
      );
    }

    const result = AdminService.restrictAccount({
      userId,
      type,
      durationDays: durationDays ? Number(durationDays) : undefined,
      reason,
      refundDecision,
      staffId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Restriction operation failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
