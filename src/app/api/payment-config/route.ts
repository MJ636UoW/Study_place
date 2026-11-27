import { NextResponse } from "next/server";
import { isMongoAvailable } from "@/lib/hybridDb";
import { AdminSettings } from "@/models/AdminSettings";

export async function GET() {
  try {
    const mongoOk = await isMongoAvailable();
    if (mongoOk) {
      const settings = await AdminSettings.findOne();
      if (settings) {
        return NextResponse.json({
          success: true,
          upiId: settings.upiId || "shettyvarun001@okhdfcbank",
          upiIdAlias: "shettyvarun001@okicici",
          accountHolder: settings.accountHolder || "Varun Shetty",
          accountNumber: settings.accountNumber || "50200084920192",
          ifscCode: settings.ifscCode || "HDFC0000123",
          qrCodeUrl: settings.qrCodeUrl || "/upi-qr.jpg",
          razorpayKeyId: "",
        });
      }
    }
  } catch (err) {
    // fallback
  }

  return NextResponse.json({
    success: true,
    upiId: "shettyvarun001@okhdfcbank",
    upiIdAlias: "shettyvarun001@okicici",
    accountHolder: "Varun Shetty",
    accountNumber: "50200084920192",
    ifscCode: "HDFC0000123",
    qrCodeUrl: "/upi-qr.jpg",
    razorpayKeyId: "",
  });
}
