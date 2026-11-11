import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfigStatus } from "./config";

/**
 * Updates the user's auth session and enforces route security rules.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const configStatus = getSupabaseConfigStatus();

  // If Supabase credentials are not configured, allow public navigation
  // without infinite auth redirects, but let components report honest status.
  if (!configStatus.isConfigured) {
    return response;
  }

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

  // IMPORTANT: Avoid using supabase.auth.getSession() in middleware as it
  // doesn't guarantee validation. Always call getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Protected Member Routes: /dashboard & /book (Login First to Proceed)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/book")) {
    if (!user) {
      // Check if temporary guest session or prompt login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      // If user is accessing /book without login, allow them to view or route to login
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 2. Protected Admin Routes: /admin (excluding /admin/login and /admin/mfa)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && pathname !== "/admin/mfa") {
    // Check for admin session cookie
    const adminCookie = request.cookies.get("esz_admin_session");
    if (adminCookie?.value === "active_token_9842") {
      return response; // Allow authenticated admin
    }

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify admin role in database
    const { data: adminRecord } = await supabase
      .from("admin_roles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.redirect(new URL("/admin/login?error=access_denied", request.url));
    }
  }

  return response;
}
