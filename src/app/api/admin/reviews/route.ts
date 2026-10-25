import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const reviews = AdminService.getReviews();
  return NextResponse.json({ success: true, reviews });
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
    const { reviewId, status, staffId = "staff_curator_1" } = body;

    if (!reviewId || !status) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "reviewId and status ('approved' | 'hidden') are required." },
        { status: 400 }
      );
    }

    const result = AdminService.moderateReview(reviewId, status, staffId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Review moderation failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
