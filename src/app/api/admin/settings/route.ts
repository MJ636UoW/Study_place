import { NextRequest, NextResponse } from "next/server";
import { isMongoAvailable } from "@/lib/hybridDb";
import { AdminSettings } from "@/models/AdminSettings";
import { hashPassword, comparePassword } from "@/lib/auth";

// Resilient memory cache if MongoDB is offline
let cachedSettings = {
  adminEmail: "admin@elitestudyzone.in",
  adminPasswordHash: "",
  upiId: "elitestudyzone@okhdfcbank",
  accountHolder: "Elite Study Zone",
  accountNumber: "50200084920192",
  ifscCode: "HDFC0000123",
  qrCodeUrl: "",
  centerPhone: "+91 98753 59327",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  gmailUser: process.env.GMAIL_USER || "",
  gmailAppPass: process.env.GMAIL_APP_PASS || "",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID || "",
  whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "+91 98753 59327",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "esz_whatsapp_verify_token_2026",
};

export async function GET() {
  try {
    const mongoOk = await isMongoAvailable();
    if (mongoOk) {
      let settings = await AdminSettings.findOne();
      if (!settings) {
        settings = await AdminSettings.create(cachedSettings);
      }
      return NextResponse.json({
        success: true,
        settings: {
          adminEmail: settings.adminEmail,
          upiId: settings.upiId,
          accountHolder: settings.accountHolder,
          accountNumber: settings.accountNumber,
          ifscCode: settings.ifscCode,
          qrCodeUrl: settings.qrCodeUrl,
          centerPhone: settings.centerPhone,
          razorpayKeyId: settings.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          razorpayKeySecret: settings.razorpayKeySecret ? "••••••••" : "",
          gmailUser: settings.gmailUser || process.env.GMAIL_USER || "",
          gmailAppPass: settings.gmailAppPass ? "••••••••" : "",
          googleClientId: settings.googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          whatsappPhoneId: settings.whatsappPhoneId || process.env.WHATSAPP_PHONE_ID || "",
          whatsappToken: settings.whatsappToken ? "••••••••" : "",
          whatsappNumber: settings.whatsappNumber || "+91 98753 59327",
          whatsappVerifyToken: settings.whatsappVerifyToken || "esz_whatsapp_verify_token_2026",
        },
      });
    }
  } catch (err) {
    console.warn("MongoDB settings fetch fallback:", err);
  }

  return NextResponse.json({
    success: true,
    settings: {
      ...cachedSettings,
      razorpayKeySecret: cachedSettings.razorpayKeySecret ? "••••••••" : "",
      gmailAppPass: cachedSettings.gmailAppPass ? "••••••••" : "",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      adminEmail,
      currentPassword,
      newPassword,
      upiId,
      accountHolder,
      accountNumber,
      ifscCode,
      qrCodeUrl,
      centerPhone,
      razorpayKeyId,
      razorpayKeySecret,
      gmailUser,
      gmailAppPass,
      googleClientId,
      whatsappPhoneId,
      whatsappToken,
      whatsappNumber,
      whatsappVerifyToken,
    } = body;

    const mongoOk = await isMongoAvailable();
    let settingsDoc = null;

    if (mongoOk) {
      settingsDoc = await AdminSettings.findOne();
      if (!settingsDoc) {
        settingsDoc = await AdminSettings.create(cachedSettings);
      }
    }

    // 1. Password update if requested
    if (newPassword) {
      if (currentPassword && settingsDoc?.adminPasswordHash) {
        const matches = await comparePassword(currentPassword, settingsDoc.adminPasswordHash);
        if (!matches) {
          return NextResponse.json({ error: "Current password does not match." }, { status: 400 });
        }
      }
      const newHash = await hashPassword(newPassword);
      if (settingsDoc) settingsDoc.adminPasswordHash = newHash;
      cachedSettings.adminPasswordHash = newHash;
    }

    // 2. Email update if provided
    if (adminEmail && adminEmail.includes("@")) {
      const cleanEmail = adminEmail.trim().toLowerCase();
      if (settingsDoc) settingsDoc.adminEmail = cleanEmail;
      cachedSettings.adminEmail = cleanEmail;
    }

    // 3. Payment details update
    if (upiId !== undefined) {
      if (settingsDoc) settingsDoc.upiId = upiId.trim();
      cachedSettings.upiId = upiId.trim();
    }

    if (accountHolder !== undefined) {
      if (settingsDoc) settingsDoc.accountHolder = accountHolder.trim();
      cachedSettings.accountHolder = accountHolder.trim();
    }

    if (accountNumber !== undefined) {
      if (settingsDoc) settingsDoc.accountNumber = accountNumber.trim();
      cachedSettings.accountNumber = accountNumber.trim();
    }

    if (ifscCode !== undefined) {
      if (settingsDoc) settingsDoc.ifscCode = ifscCode.trim();
      cachedSettings.ifscCode = ifscCode.trim();
    }

    if (qrCodeUrl !== undefined) {
      if (settingsDoc) settingsDoc.qrCodeUrl = qrCodeUrl.trim();
      cachedSettings.qrCodeUrl = qrCodeUrl.trim();
    }

    if (centerPhone !== undefined) {
      if (settingsDoc) settingsDoc.centerPhone = centerPhone.trim();
      cachedSettings.centerPhone = centerPhone.trim();
    }

    if (razorpayKeyId !== undefined) {
      if (settingsDoc) settingsDoc.razorpayKeyId = razorpayKeyId.trim();
      cachedSettings.razorpayKeyId = razorpayKeyId.trim();
    }

    if (razorpayKeySecret !== undefined && razorpayKeySecret && !razorpayKeySecret.includes("••")) {
      if (settingsDoc) settingsDoc.razorpayKeySecret = razorpayKeySecret.trim();
      cachedSettings.razorpayKeySecret = razorpayKeySecret.trim();
    }

    if (gmailUser !== undefined) {
      if (settingsDoc) settingsDoc.gmailUser = gmailUser.trim();
      cachedSettings.gmailUser = gmailUser.trim();
    }

    if (gmailAppPass !== undefined && gmailAppPass && !gmailAppPass.includes("••")) {
      const cleanPass = gmailAppPass.trim().replace(/\s+/g, "");
      if (settingsDoc) settingsDoc.gmailAppPass = cleanPass;
      cachedSettings.gmailAppPass = cleanPass;
    }

    if (googleClientId !== undefined) {
      if (settingsDoc) settingsDoc.googleClientId = googleClientId.trim();
      cachedSettings.googleClientId = googleClientId.trim();
    }

    if (whatsappPhoneId !== undefined) {
      if (settingsDoc) settingsDoc.whatsappPhoneId = whatsappPhoneId.trim();
      cachedSettings.whatsappPhoneId = whatsappPhoneId.trim();
    }

    if (whatsappToken !== undefined && whatsappToken && !whatsappToken.includes("••")) {
      if (settingsDoc) settingsDoc.whatsappToken = whatsappToken.trim();
      cachedSettings.whatsappToken = whatsappToken.trim();
    }

    if (whatsappNumber !== undefined) {
      if (settingsDoc) settingsDoc.whatsappNumber = whatsappNumber.trim();
      cachedSettings.whatsappNumber = whatsappNumber.trim();
    }

    if (whatsappVerifyToken !== undefined) {
      if (settingsDoc) settingsDoc.whatsappVerifyToken = whatsappVerifyToken.trim();
      cachedSettings.whatsappVerifyToken = whatsappVerifyToken.trim();
    }

    if (settingsDoc) {
      await settingsDoc.save();
    }

    return NextResponse.json({
      success: true,
      message: "Admin & Payment settings saved successfully!",
      settings: cachedSettings,
    });
  } catch (error: any) {
    console.error("Admin settings save error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
