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
  const status = searchParams.get("status") || "all";

  const enquiries = AdminService.getEnquiries(status);
  return NextResponse.json({ success: true, enquiries });
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
    const { enquiryId, reply, staffId = "staff_curator_1" } = body;

    if (!enquiryId || !reply) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "enquiryId and reply are required." },
        { status: 400 }
      );
    }

    const result = AdminService.respondToEnquiry(enquiryId, reply, staffId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Enquiry response failed";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
