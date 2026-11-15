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
          upiId: settings.upiId || "elitestudyzone@okhdfcbank",
          accountHolder: settings.accountHolder || "Elite Study Zone",
          accountNumber: settings.accountNumber || "50200084920192",
          ifscCode: settings.ifscCode || "HDFC0000123",
          qrCodeUrl: settings.qrCodeUrl || "",
        });
      }
    }
  } catch (err) {
    // fallback
  }

  return NextResponse.json({
    success: true,
    upiId: "elitestudyzone@okhdfcbank",
    accountHolder: "Elite Study Zone",
    accountNumber: "50200084920192",
    ifscCode: "HDFC0000123",
    qrCodeUrl: "",
  });
}
