import { NextRequest, NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await verifyUserCredentials(email, password);

    if (!result.ok || !result.user) {
      return NextResponse.json(
        { error: result.error || "Invalid email or password." },
        { status: result.unverified ? 403 : 401 }
      );
    }

    const user = result.user;
    const token = signJwtToken({
      userId: user._id ? user._id.toString() : "user_" + Buffer.from(user.email || "").toString("hex"),
      email: user.email || email,
      name: user.name || "Scholar",
      role: user.role || "student",
    });

    const res = NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        allottedHours: user.allottedHours,
        deskNumber: user.deskNumber,
        biometricPin: user.biometricPin,
      },
    });

    setAuthCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Login failed. Please check your credentials." },
      { status: 500 }
    );
  }
}
