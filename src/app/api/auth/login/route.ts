import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { comparePassword, signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account was created via Google Sign In. Please use Continue with Google." },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Your email address has not been confirmed yet. Please check your inbox for the confirmation link.",
          unverified: true,
        },
        { status: 403 }
      );
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
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in." },
      { status: 500 }
    );
  }
}
