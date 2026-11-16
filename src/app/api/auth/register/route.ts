import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { sendVerificationEmail } from "@/lib/mailer";
import { sendWhatsAppWelcome } from "@/lib/whatsapp";

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

    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    let origin = "https://study-place.onrender.com";
    if (forwardedHost && !forwardedHost.includes("localhost:10000")) {
      origin = `${forwardedProto}://${forwardedHost}`;
    }

    const confirmUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    sendVerificationEmail(cleanEmail, name, token, origin).catch((e) =>
      console.warn("sendVerificationEmail error:", e)
    );

    // Also dispatch welcome & credentials via WhatsApp
    if (phone) {
      sendWhatsAppWelcome({
        phone,
        name,
        email: cleanEmail,
        initialPassCode: user?.biometricPin,
      }).catch((e) => console.warn("[WhatsApp] Welcome dispatch error:", e));
    }

    return NextResponse.json({
      success: true,
      message: `Account created for ${cleanEmail}! Please confirm your email to sign in.`,
      confirmUrl,
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
