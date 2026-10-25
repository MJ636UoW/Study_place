import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const pendingRequests = AdminService.getPendingRequests();
  const expiringHolds = AdminService.getExpiringHolds();
  const exceptions = AdminService.getPaymentExceptions();

  return NextResponse.json({
    success: true,
    pendingRequests,
    expiringHolds,
    exceptions,
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
    const { action, requestId, holdDurationMinutes, reason, staffId = "staff_curator_1" } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "requestId is required." },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const result = await AdminService.approveRequest(requestId, staffId, holdDurationMinutes || 15);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } else if (action === "reject") {
      const result = await AdminService.rejectRequest(requestId, staffId, reason || "Curatorial desk decision");
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    return NextResponse.json(
      { success: false, error: "INVALID_ACTION", message: "Action must be 'approve' or 'reject'." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request processing failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
