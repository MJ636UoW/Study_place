import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { sendVerificationEmail, sendWelcomeAccessEmail } from "@/lib/mailer";
import { sendWhatsAppWelcome } from "@/lib/whatsapp";
import { syncStudentWithFitFaat } from "@/lib/fitfaat";
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
    const doorPin = user?.biometricPin || String(Math.floor(100000 + Math.random() * 900000));

    sendVerificationEmail(cleanEmail, cleanName, token, origin, doorPin).catch((e) =>
      console.warn("sendVerificationEmail error:", e)
    );

    sendWelcomeAccessEmail({
      to: cleanEmail,
      name: cleanName,
      doorPin,
      siteUrl: origin,
    }).catch((e) => console.warn("sendWelcomeAccessEmail error:", e));

    // Also dispatch welcome & credentials via WhatsApp
    let whatsappLink: string | null = null;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
      const waMsg = `*ELITE STUDY ZONE • DOOR ACCESS PASS*\n\nHello ${cleanName},\nWelcome to Elite Study Zone (Ghatkopar West).\n\nYour 6-Digit Door Keypad Access PIN is: *#${doorPin}*\n\nEnter this PIN on the digital door keypad to unlock. To exit the study hall, press the push-to-exit button next to the door.\n\nPortal: https://elitestudyzone.in`;
      whatsappLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(waMsg)}`;

      sendWhatsAppWelcome({
        phone,
        name: cleanName,
        email: cleanEmail,
        initialPassCode: doorPin,
      }).catch((e) => console.warn("[WhatsApp] Welcome dispatch error:", e));

      // Sync student with FitFaat & eSSL Door Keypad Machine
      syncStudentWithFitFaat({
        name: cleanName,
        mobile: phone,
        email: cleanEmail,
        biometricPin: doorPin,
      }).catch((e) => console.warn("[FitFaat] Welcome sync error:", e));
    }

    const jwtToken = signJwtToken({
      userId: user?._id ? user._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
      email: cleanEmail,
      name: cleanName,
      role: "student",
    });

    const res = NextResponse.json({
      success: true,
      message: `Account created successfully! Welcome to Elite Study Zone, ${cleanName}. Your door access PIN is #${doorPin}.`,
      confirmUrl,
      passCode: doorPin,
      doorPin,
      whatsappLink,
      user: {
        name: cleanName,
        email: cleanEmail,
        phone,
        doorPin,
      },
    });

    setAuthCookie(res, jwtToken);
    res.cookies.set("esz_student_session", "active", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(cleanName), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_pin", doorPin, { path: "/", maxAge: 604800, sameSite: "lax" });

    return res;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
