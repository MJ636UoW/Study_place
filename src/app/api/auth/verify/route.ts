import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken, findUserByEmail } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(
        new URL("/login?error=Invalid+or+missing+verification+link", req.url)
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await verifyEmailToken(cleanEmail, token);

    if (!result.ok || !result.user) {
      // Check if user is already verified
      const existing = await findUserByEmail(cleanEmail);
      if (existing && existing.emailVerified) {
        const jwtToken = signJwtToken({
          userId: existing._id ? existing._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
          email: existing.email || cleanEmail,
          name: existing.name || "Scholar",
          role: existing.role || "student",
        });
        const res = NextResponse.redirect(new URL("/dashboard?verified=already", req.url));
        setAuthCookie(res, jwtToken);
        return res;
      }

      return NextResponse.redirect(
        new URL("/login?error=Invalid+or+expired+verification+token", req.url)
      );
    }

    const user = result.user;
    const jwtToken = signJwtToken({
      userId: user._id ? user._id.toString() : "user_" + Buffer.from(cleanEmail).toString("hex"),
      email: user.email || cleanEmail,
      name: user.name || "Scholar",
      role: user.role || "student",
    });

    const redirectUrl = new URL("/dashboard?welcome=true", req.url);
    const res = NextResponse.redirect(redirectUrl);
    setAuthCookie(res, jwtToken);

    return res;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Verification+failed.+Please+try+logging+in.", req.url)
    );
  }
}
