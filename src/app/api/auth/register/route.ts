import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { sendVerificationEmail } from "@/lib/mailer";
import { sendWhatsAppWelcome } from "@/lib/whatsapp";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

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
    const cleanName = name.trim();
    const existing = await findUserByEmail(cleanEmail);

    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    const { user, token } = await createUser({
      name: cleanName,
      email: cleanEmail,
      password,
      phone,
      emailVerified: true,
    });

    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    let origin = "https://elitestudyzone.in";
    if (forwardedHost && !forwardedHost.includes("localhost:10000")) {
      origin = `${forwardedProto}://${forwardedHost}`;
    }

    const confirmUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    sendVerificationEmail(cleanEmail, cleanName, token, origin).catch((e) =>
      console.warn("sendVerificationEmail error:", e)
    );

    // Also dispatch welcome & credentials via WhatsApp
    if (phone) {
      sendWhatsAppWelcome({
        phone,
        name: cleanName,
        email: cleanEmail,
        initialPassCode: user?.biometricPin,
      }).catch((e) => console.warn("[WhatsApp] Welcome dispatch error:", e));
    }

    const jwtToken = signJwtToken({
      userId: user?._id ? user._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
      email: cleanEmail,
      name: cleanName,
      role: "student",
    });

    const res = NextResponse.json({
      success: true,
      message: `Account created successfully! Welcome to Elite Study Zone, ${cleanName}.`,
      confirmUrl,
      user: {
        name: cleanName,
        email: cleanEmail,
        phone,
      },
    });

    setAuthCookie(res, jwtToken);
    res.cookies.set("esz_student_session", "active", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(cleanName), { path: "/", maxAge: 604800, sameSite: "lax" });

    return res;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
