import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(
        new URL("/login?error=Invalid+or+missing+verification+link", req.url)
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      verificationToken: token,
    });

    if (!user) {
      // Check if user is already verified
      const verifiedUser = await User.findOne({ email: cleanEmail, emailVerified: true });
      if (verifiedUser) {
        const jwtToken = signJwtToken({
          userId: verifiedUser._id.toString(),
          email: verifiedUser.email,
          name: verifiedUser.name,
          role: verifiedUser.role,
        });
        const res = NextResponse.redirect(new URL("/dashboard?verified=already", req.url));
        setAuthCookie(res, jwtToken);
        return res;
      }

      return NextResponse.redirect(
        new URL("/login?error=Invalid+or+expired+verification+token", req.url)
      );
    }

    // Verify user
    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    const jwtToken = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
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
