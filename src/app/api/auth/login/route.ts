import { NextRequest, NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || body.phone || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Registered email or mobile number, and password are required." },
        { status: 400 }
      );
    }

    const result = await verifyUserCredentials(identifier, password);

    if (!result.ok || !result.user) {
      return NextResponse.json(
        { error: result.error || "Invalid email, mobile number, or password." },
        { status: result.unverified ? 403 : 401 }
      );
    }

    const user = result.user;
    const resolvedEmail = user.email || identifier;
    const token = signJwtToken({
      userId: user._id ? user._id.toString() : "user_" + Buffer.from(resolvedEmail).toString("hex"),
      email: resolvedEmail,
      name: user.name || "Scholar",
      role: user.role || "student",
    });

    const res = NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: resolvedEmail,
        role: user.role,
        allottedHours: user.allottedHours,
        deskNumber: user.deskNumber,
        biometricPin: user.biometricPin,
      },
    });

    setAuthCookie(res, token);
    res.cookies.set("esz_student_session", "active", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(resolvedEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(user.name || "Scholar"), { path: "/", maxAge: 604800, sameSite: "lax" });
    return res;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Login failed. Please check your credentials." },
      { status: 500 }
    );
  }
}
