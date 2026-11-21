import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/hybridDb";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let user = null;
    try {
      user = await findUserByEmail(session.email);
    } catch (_) {
      // Gracefully continue with session data if DB is temporarily connecting
    }

    const derivedName = user?.name || session.name || (session.email ? session.email.split("@")[0] : "Scholar");
    const cookiePin = req.cookies.get("esz_student_pin")?.value;
    const doorPin = user?.biometricPin || cookiePin || "849201";

    return NextResponse.json({
      authenticated: true,
      user: {
        name: derivedName,
        email: session.email,
        phone: user?.phone || "",
        role: user?.role || session.role || "student",
        allottedHours: user?.allottedHours || 0,
        usedHours: user?.usedHours || 0,
        deskNumber: user?.deskNumber || "",
        lockerNumber: user?.lockerNumber || "",
        biometricPin: doorPin,
        doorPin,
        emailVerified: user?.emailVerified ?? true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 200 });
  }
}
