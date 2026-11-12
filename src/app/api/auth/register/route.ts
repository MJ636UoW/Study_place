import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      }
      // User exists but unverified: update password & resend verification token
      const passwordHash = await hashPassword(password);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      existingUser.name = name.trim();
      existingUser.passwordHash = passwordHash;
      existingUser.phone = phone || existingUser.phone;
      existingUser.verificationToken = verificationToken;
      await existingUser.save();

      const origin = req.nextUrl.origin || "https://study-place.onrender.com";
      await sendVerificationEmail(cleanEmail, existingUser.name, verificationToken, origin);

      return NextResponse.json({
        success: true,
        message: "Verification email sent. Please check your inbox and click the link to confirm.",
      });
    }

    // New user creation
    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Assign next biometric PIN (e.g. 101+)
    const count = await User.countDocuments();
    const biometricPin = String(count + 1).padStart(3, "0");

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phone: phone || "",
      role: "student",
      emailVerified: false,
      verificationToken,
      authProvider: "email",
      allottedHours: 48,
      usedHours: 0,
      deskNumber: `Desk #${String((count % 30) + 1).padStart(2, "0")}`,
      lockerNumber: `Locker #${String((count % 40) + 1).padStart(2, "0")}`,
      biometricPin,
    });

    const origin = req.nextUrl.origin || "https://study-place.onrender.com";
    await sendVerificationEmail(cleanEmail, newUser.name, verificationToken, origin);

    return NextResponse.json({
      success: true,
      message: "Registration successful! A verification link has been sent to your email. Please check your inbox.",
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
