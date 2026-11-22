import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";
import { sendWelcomeAccessEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential } = body;

    if (!credential || typeof credential !== "string") {
      return NextResponse.json(
        { error: "Google ID credential token is required. Please sign in via Google." },
        { status: 400 }
      );
    }

    // Decode Google ID Token (JWT standard 3-part)
    const parts = credential.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: "Invalid Google credential token format." },
        { status: 400 }
      );
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);

    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Google credential did not provide a valid email." },
        { status: 400 }
      );
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const name = payload.name || cleanEmail.split("@")[0];
    let user = await findUserByEmail(cleanEmail);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const created = await createUser({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        authProvider: "google",
        emailVerified: true,
      });
      user = created.user;
    }

    const doorPin = user.biometricPin || String(Math.floor(100000 + Math.random() * 900000));

    // Dispatch welcome email with Keypad Access PIN, entry/exit guides & center details
    sendWelcomeAccessEmail({
      to: cleanEmail,
      name: user.name || name || "Scholar",
      doorPin,
      siteUrl: "https://elitestudyzone.in",
    }).catch((e) => console.warn("[Google Auth] sendWelcomeAccessEmail error:", e));

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
        biometricPin: doorPin,
        doorPin,
      },
    });

    setAuthCookie(res, token);
    res.cookies.set("esz_student_session", "active_google", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(user.name || "Scholar"), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_pin", doorPin, { path: "/", maxAge: 604800, sameSite: "lax" });
    return res;
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Google." },
      { status: 500 }
    );
  }
}
