import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function POST(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { seatId, startDate, endDate, reason, staffId = "staff_curator_1" } = body;

    if (!seatId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "seatId, startDate, endDate, and reason are required." },
        { status: 400 }
      );
    }

    const result = AdminService.addMaintenanceBlock(seatId, startDate, endDate, reason, staffId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Maintenance scheduling failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
