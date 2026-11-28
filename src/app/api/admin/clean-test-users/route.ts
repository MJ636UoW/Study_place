import { NextRequest, NextResponse } from "next/server";
import { deleteUsersByPatterns } from "@/lib/hybridDb";
import { BookingEngine } from "@/lib/booking/bookingEngine";

export async function GET(req: NextRequest) {
  return handleClean(req);
}

export async function POST(req: NextRequest) {
  return handleClean(req);
}

async function handleClean(req: NextRequest) {
  try {
    const patterns = [
      "mandarjoshi8975",
      "mandarj2412",
      "mandar.j.2412",
      "mandar",
      "deepak",
    ];

    const result = await deleteUsersByPatterns(patterns);

    // Also purge test booking requests from in-memory engine
    BookingEngine.purgeTestBookingsByPatterns(patterns);

    return NextResponse.json({
      success: true,
      message: "Successfully cleared accounts for Mandar Joshi and Deepak Joshi from the dataset.",
      patterns,
      result,
    });
  } catch (error: any) {
    console.error("Clean test users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear users." },
      { status: 500 }
    );
  }
}
