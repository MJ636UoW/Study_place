import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { email, name, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const count = await User.countDocuments();
      const biometricPin = String(count + 1).padStart(3, "0");

      user = await User.create({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        authProvider: "google",
        emailVerified: true, // Google accounts are pre-verified
        role: "student",
        allottedHours: 48,
        usedHours: 0,
        deskNumber: `Desk #${String((count % 30) + 1).padStart(2, "0")}`,
        lockerNumber: `Locker #${String((count % 40) + 1).padStart(2, "0")}`,
        biometricPin,
        avatarUrl: avatarUrl || "",
      });
    } else {
      user.emailVerified = true;
      if (name && !user.name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    const token = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
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
      { error: error.message || "Failed to authenticate with Google." },
      { status: 500 }
    );
  }
}
