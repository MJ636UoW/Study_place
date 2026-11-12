import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select("-passwordHash -verificationToken");

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        allottedHours: user.allottedHours,
        usedHours: user.usedHours,
        deskNumber: user.deskNumber,
        lockerNumber: user.lockerNumber,
        biometricPin: user.biometricPin,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
