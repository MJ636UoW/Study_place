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
        },
      });
    }
  } catch (err) {
    console.warn("MongoDB settings fetch fallback:", err);
  }

  return NextResponse.json({
    success: true,
    settings: cachedSettings,
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
