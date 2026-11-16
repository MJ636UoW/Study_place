import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfigStatus } from "./config";

function getPublicBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost && !forwardedHost.includes("localhost:10000")) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return "https://study-place.onrender.com";
}

/**
 * Updates the user's auth session and enforces route security rules.
 */
export async function updateSession(request: NextRequest) {
  const baseUrl = getPublicBaseUrl(request);
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Check MongoDB JWT auth_token, student session cookie, and admin cookie
  const authToken = request.cookies.get("auth_token")?.value;
  const studentSession = request.cookies.get("esz_student_session")?.value;
  const adminCookie = request.cookies.get("esz_admin_session")?.value;

  let hasSupabaseUser = false;
  const configStatus = getSupabaseConfigStatus();

  if (configStatus.isConfigured) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) hasSupabaseUser = true;
    } catch {
      // Supabase offline/timeout fallback
    }
  }

  const hasStudentSession = Boolean(authToken || studentSession || hasSupabaseUser);

  // 2. Protected Student Routes: /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!hasStudentSession) {
      return NextResponse.redirect(`${baseUrl}/login?next=${encodeURIComponent(pathname)}`);
    }
  }

  // If already logged in and visiting /login, redirect to /dashboard
  if (pathname === "/login" && hasStudentSession) {
    const next = request.nextUrl.searchParams.get("next") || "/dashboard";
    const targetUrl = next.startsWith("/") ? `${baseUrl}${next}` : `${baseUrl}/dashboard`;
    return NextResponse.redirect(targetUrl);
  }

  // 3. Protected Admin Routes: /admin (excluding /admin/login and /admin/mfa)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && pathname !== "/admin/mfa") {
    const isAdminAuthenticated = adminCookie === "active_token_9842";
    if (!isAdminAuthenticated && !hasSupabaseUser) {
      return NextResponse.redirect(`${baseUrl}/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }

  return response;
}
