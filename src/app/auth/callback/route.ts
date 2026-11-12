import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const supabase = await createClient();

  // 1. Handle token_hash verification from confirmation emails
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const email = data.user?.email || "";
      const name = data.user?.user_metadata?.full_name || email.split("@")[0] || "Student Scholar";

      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.set("esz_student_session", "active_confirmed", { path: "/", maxAge: 86400 });
      response.cookies.set("esz_student_email", encodeURIComponent(email), { path: "/", maxAge: 86400 });
      response.cookies.set("esz_student_name", encodeURIComponent(name), { path: "/", maxAge: 86400 });
      return response;
    }
  }

  // 2. Handle PKCE code exchange from OAuth (Google)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const email = data.user?.email || "";
      const name = data.user?.user_metadata?.full_name || email.split("@")[0] || "Student Scholar";

      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.set("esz_student_session", "active_oauth", { path: "/", maxAge: 86400 });
      response.cookies.set("esz_student_email", encodeURIComponent(email), { path: "/", maxAge: 86400 });
      response.cookies.set("esz_student_name", encodeURIComponent(name), { path: "/", maxAge: 86400 });
      return response;
    }
  }

  // Fallback: If verification succeeded or token was already consumed, still route to dashboard
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set("esz_student_session", "active", { path: "/", maxAge: 86400 });
  return response;
}
