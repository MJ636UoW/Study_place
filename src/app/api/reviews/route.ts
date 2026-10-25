import { NextRequest, NextResponse } from "next/server";
import { ReviewService } from "@/lib/reviews/reviewService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = ReviewService.getPublishedReviewsAndAggregates();
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, authorName, role, discipline, quote, rating, bookingId, membershipTenure } = body;

    if (!userId || !authorName || !quote || rating === undefined) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: Missing required fields (userId, authorName, quote, rating)." },
        { status: 400 }
      );
    }

    const result = ReviewService.submitReview({
      userId,
      authorName,
      role: role || "Visiting Fellow",
      discipline: discipline || "Independent Research",
      quote,
      rating: Number(rating),
      bookingId,
      membershipTenure,
    });

    if (!result.success) {
      const status =
        result.error === "INELIGIBLE_FOR_REVIEW"
          ? 403
          : result.error === "DUPLICATE_REVIEW"
          ? 409
          : 400;

      return NextResponse.json(
        { error: result.error, message: result.message },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        review: result.review,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
