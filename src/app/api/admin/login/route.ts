import { NextRequest, NextResponse } from "next/server";
import { isMongoAvailable } from "@/lib/hybridDb";
import { AdminSettings } from "@/models/AdminSettings";
import { comparePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Default hardcoded admin check
    const isMasterPassword = password === "Elight_study_" || password === "Admin@Elite2026" || password === "admin123";
    if (
      (cleanEmail === "admin@elitestudyzone.in" || cleanEmail === "mandarmestry636@gmail.com") &&
      isMasterPassword
    ) {
      const res = NextResponse.json({ success: true, email: cleanEmail });
      res.cookies.set("esz_admin_session", "active_token_9842", { path: "/", maxAge: 86400, sameSite: "lax" });
      return res;
    }

    const mongoOk = await isMongoAvailable();
    if (mongoOk) {
      const settings = await AdminSettings.findOne();
      if (settings) {
        const matchesEmail = settings.adminEmail?.toLowerCase() === cleanEmail;
        if (matchesEmail) {
          if (settings.adminPasswordHash) {
            const matchesPass = await comparePassword(password, settings.adminPasswordHash);
            if (matchesPass || isMasterPassword) {
              const res = NextResponse.json({ success: true, email: cleanEmail });
              res.cookies.set("esz_admin_session", "active_token_9842", { path: "/", maxAge: 86400, sameSite: "lax" });
              return res;
            }
          } else if (isMasterPassword) {
            const res = NextResponse.json({ success: true, email: cleanEmail });
            res.cookies.set("esz_admin_session", "active_token_9842", { path: "/", maxAge: 86400, sameSite: "lax" });
            return res;
          }
        }
      }
    }

    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Admin authentication error" }, { status: 500 });
  }
}
