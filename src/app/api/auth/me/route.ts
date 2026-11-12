import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/hybridDb";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await findUserByEmail(session.email);

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          name: session.name || "Scholar",
          email: session.email,
          role: session.role || "student",
          allottedHours: 48,
          usedHours: 0,
          deskNumber: "Desk #04",
          lockerNumber: "Locker #14",
          biometricPin: "001",
        },
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role || "student",
        allottedHours: user.allottedHours || 48,
        usedHours: user.usedHours || 0,
        deskNumber: user.deskNumber || "Desk #04",
        lockerNumber: user.lockerNumber || "Locker #14",
        biometricPin: user.biometricPin || "001",
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
