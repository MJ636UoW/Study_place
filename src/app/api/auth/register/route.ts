import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(cleanEmail);

    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    const { user, token } = await createUser({
      name,
      email: cleanEmail,
      password,
      phone,
      emailVerified: false,
    });

    const origin = req.nextUrl.origin || "https://study-place.onrender.com";
    await sendVerificationEmail(cleanEmail, name, token, origin);

    return NextResponse.json({
      success: true,
      message: `Registration successful! A confirmation email has been sent to ${cleanEmail}. Please click the link to confirm your account, then log in.`,
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
