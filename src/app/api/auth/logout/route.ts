import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Signed out successfully" });
  clearAuthCookie(res);
  res.cookies.set("esz_student_session", "", { path: "/", maxAge: 0 });
  res.cookies.set("esz_student_email", "", { path: "/", maxAge: 0 });
  res.cookies.set("esz_student_name", "", { path: "/", maxAge: 0 });
  res.cookies.set("esz_admin_session", "", { path: "/", maxAge: 0 });
  return res;
}
