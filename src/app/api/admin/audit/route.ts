import { type NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";

export async function GET(request: NextRequest) {
  if (!AdminService.verifyAdminAuth(request.headers)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Curatorial administrative authentication required." },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get("limit") || "100");

  const auditEvents = AdminService.getAuditHistory(limit);
  return NextResponse.json({ success: true, auditEvents });
}
