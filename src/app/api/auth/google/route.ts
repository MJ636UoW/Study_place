import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await findUserByEmail(cleanEmail);

    if (!user) {
      const created = await createUser({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        authProvider: "google",
        emailVerified: true,
      });
      user = created.user;
    }

    const token = signJwtToken({
      userId: user._id ? user._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
      email: cleanEmail,
      name: user.name || name || "Scholar",
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
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Google." },
      { status: 500 }
    );
  }
}
