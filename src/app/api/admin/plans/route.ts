import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const plans = AdminService.getPlans();
  return NextResponse.json({ success: true, plans });
}

export async function PATCH(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { planId, updates, staffId = "staff_curator_1" } = body;

    if (!planId || !updates) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "planId and updates are required." },
        { status: 400 }
      );
    }

    const result = AdminService.updatePlan(planId, updates, staffId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Plan update failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
