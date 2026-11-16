import { NextRequest, NextResponse } from "next/server";
import { findPassOrUserByCode } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Access Code or Door PIN is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    let result: any = await findPassOrUserByCode(cleanCode);

    if (!result) {
      try {
        const { BookingEngine } = await import("@/lib/booking/bookingEngine");
        const alloc = BookingEngine.getAllAllocations().find(
          (a) => a.passCode?.toUpperCase() === cleanCode || a.passCode?.replace(/^PASS-/, "").toUpperCase() === cleanCode
        );
        if (alloc) {
          result = {
            name: alloc.userId,
            email: `${alloc.userId}@elitestudyzone.in`,
            pin: alloc.passCode,
            deskNumber: alloc.seatId,
          };
        }
      } catch (_) {}
    }

    if (!result) {
      return NextResponse.json(
        {
          error: "Invalid or expired Access Code. Please verify your PIN from your WhatsApp/Email or book an hourly pass.",
        },
        { status: 401 }
      );
    }

    const token = signJwtToken({
      userId: "code_" + (result.pin || cleanCode),
      email: result.email,
      name: result.name,
      role: "student",
    });

    const res = NextResponse.json({
      success: true,
      message: `Access verified! Welcome back, ${result.name}.`,
      user: {
        name: result.name,
        email: result.email,
        pin: result.pin,
        deskNumber: result.deskNumber,
      },
    });

    setAuthCookie(res, token);
    res.cookies.set("esz_student_session", "code_pass", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(result.email), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(result.name), { path: "/", maxAge: 604800, sameSite: "lax" });

    return res;
  } catch (error: any) {
    console.error("Code Login Error:", error);
    return NextResponse.json(
      { error: "Server error during code verification." },
      { status: 500 }
    );
  }
}
