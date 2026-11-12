import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { HourlyMagicPass } from "@/models/HourlyMagicPass";
import { BiometricDeviceUser } from "@/models/BiometricDeviceUser";
import { User } from "@/models/User";
import { signJwtToken, setAuthCookie } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { email, hours = 2, name = "Hourly Scholar" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const durationHours = Math.max(1, Math.min(12, Number(hours) || 2));

    // Generate random 6-digit numeric pass code
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const numericPin = parseInt(pin, 10);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // Save Magic Pass to MongoDB
    await HourlyMagicPass.create({
      pin,
      email: cleanEmail,
      userName: name,
      hoursAllocated: durationHours,
      expiresAt,
      status: "ACTIVE",
    });

    // Also register on Biometric device collection for ZKTeco LX50 gate PIN validation
    await BiometricDeviceUser.findOneAndUpdate(
      { pin: numericPin },
      {
        pin: numericPin,
        name: `Hourly: ${cleanEmail.split("@")[0]}`,
        status: "ACTIVE",
        enrolled: true,
      },
      { upsert: true }
    );

    // Find or create user record in MongoDB
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        name,
        email: cleanEmail,
        role: "student",
        emailVerified: true,
        authProvider: "email",
        allottedHours: durationHours,
        usedHours: 0,
        biometricPin: pin,
        deskNumber: "Hot Desk Zone",
        lockerNumber: "Temporary",
      });
    } else {
      user.allottedHours = durationHours;
      user.biometricPin = pin;
      await user.save();
    }

    // Dispatch email with Biometric PIN
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Elite Study Zone - Hourly Biometric Pass</h2>
        <p>Your temporary access pass has been generated successfully.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <div style="font-size: 13px; color: #1e40af; font-weight: 600; text-transform: uppercase;">ZKTeco Gate PIN</div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a; margin: 8px 0;">${pin}</div>
          <div style="font-size: 12px; color: #64748b;">Valid for ${durationHours} hour(s) until ${expiresAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <p style="font-size: 13px; color: #475569;">Enter this 6-digit PIN on the biometric reader at the main door to unlock access.</p>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: `Your Biometric Pass PIN: ${pin} - Elite Study Zone`,
      html,
    });

    const jwtToken = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      pin,
      hoursAllocated: durationHours,
      expiresAt: expiresAt.toISOString(),
      message: `Pass generated! Use PIN ${pin} on the door biometric reader.`,
    });

    setAuthCookie(res, jwtToken);
    return res;
  } catch (error: any) {
    console.error("Magic Pass Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate hourly pass." },
      { status: 500 }
    );
  }
}
