import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken, findUserByEmail } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

function getPublicBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost && !forwardedHost.includes("localhost:10000")) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return "https://study-place.onrender.com";
}

export async function GET(req: NextRequest) {
  const baseUrl = getPublicBaseUrl(req);

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+or+missing+verification+link`);
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await verifyEmailToken(cleanEmail, token);

    if (!result.ok || !result.user) {
      // Check if user is already verified
      const existing = await findUserByEmail(cleanEmail);
      if (existing && existing.emailVerified) {
        const scholarName = existing.name || cleanEmail.split("@")[0] || "Scholar";
        const jwtToken = signJwtToken({
          userId: existing._id ? existing._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
          email: existing.email || cleanEmail,
          name: scholarName,
          role: existing.role || "student",
        });
        const res = NextResponse.redirect(`${baseUrl}/dashboard?verified=already`);
        setAuthCookie(res, jwtToken);
        res.cookies.set("esz_student_session", "active", { path: "/", maxAge: 604800, sameSite: "lax" });
        res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
        res.cookies.set("esz_student_name", encodeURIComponent(scholarName), { path: "/", maxAge: 604800, sameSite: "lax" });
        return res;
      }

      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+or+expired+verification+token`);
    }

    const user = result.user;
    const scholarName = user.name || cleanEmail.split("@")[0] || "Scholar";
    const jwtToken = signJwtToken({
      userId: user._id ? user._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
      email: user.email || cleanEmail,
      name: scholarName,
      role: user.role || "student",
    });

    const res = NextResponse.redirect(`${baseUrl}/dashboard?welcome=true`);
    setAuthCookie(res, jwtToken);
    res.cookies.set("esz_student_session", "active", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(scholarName), { path: "/", maxAge: 604800, sameSite: "lax" });

    return res;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=Verification+failed.+Please+try+logging+in.`);
  }
}
