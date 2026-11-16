import { NextRequest, NextResponse } from "next/server";
import { createMagicPass, createUser, findUserByEmail } from "@/lib/hybridDb";
import { signJwtToken, setAuthCookie } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import { sendWhatsAppBookingPass } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, hours = 2, name = "Hourly Scholar", phone, slot } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { pin, durationHours, expiresAt } = await createMagicPass(cleanEmail, hours, name);

    let user = await findUserByEmail(cleanEmail);
    if (!user) {
      const created = await createUser({
        name,
        email: cleanEmail,
        emailVerified: true,
      });
      user = created.user;
    }

    // Try sending email if mailer configured
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Elite Study Zone - Hourly Biometric Pass</h2>
        <p>Your temporary access pass has been generated successfully.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <div style="font-size: 13px; color: #1e40af; font-weight: 600; text-transform: uppercase;">ZKTeco Gate PIN</div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a; margin: 8px 0;">${pin}</div>
          <div style="font-size: 12px; color: #64748b;">Valid for ${durationHours} hour(s)</div>
        </div>
        <p style="font-size: 13px; color: #475569;">Enter this 6-digit PIN on the biometric reader at the main door to unlock access.</p>
      </div>
    `;

    sendEmail({
      to: cleanEmail,
      subject: `Your Biometric Pass PIN: #${pin} - Elite Study Zone`,
      html,
    }).catch(() => {});

    // Dispatch pass details to WhatsApp if phone provided
    if (phone) {
      sendWhatsAppBookingPass({
        phone,
        name,
        passCode: pin,
        seatOrPass: "Hourly Flex Workstation",
        slotOrDates: slot || `${durationHours} hour(s) access`,
        amountRupees: String(durationHours * 49),
      }).catch((e) => console.warn("[WhatsApp] Pass dispatch error:", e));
    }

    const token = signJwtToken({
      userId: "hourly_" + pin,
      email: cleanEmail,
      name,
      role: "student",
    });

    const res = NextResponse.json({
      success: true,
      pin,
      hoursAllocated: durationHours,
      expiresAt: expiresAt.toISOString(),
      message: `Pass generated! Use PIN #${pin} on the door biometric reader.`,
    });

    setAuthCookie(res, token);
    res.cookies.set("esz_student_session", "hourly_pass", { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_email", encodeURIComponent(cleanEmail), { path: "/", maxAge: 604800, sameSite: "lax" });
    res.cookies.set("esz_student_name", encodeURIComponent(name), { path: "/", maxAge: 604800, sameSite: "lax" });
    return res;
  } catch (error: any) {
    console.error("Magic Pass Error:", error);
    return NextResponse.json(
      { error: "Failed to generate hourly pass." },
      { status: 500 }
    );
  }
}
