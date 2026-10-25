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

  // 1. Protected Member Routes: /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protected Admin Routes: /admin (excluding /admin/mfa challenge screen)
  if (pathname.startsWith("/admin") && pathname !== "/admin/mfa") {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify admin role
    const { data: adminRecord } = await supabase
      .from("admin_roles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminRecord) {
      // User is not an admin: redirect away to dashboard
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized_admin", request.url));
    }

    // Check MFA Assurance Level (AAL)
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData && (aalData.currentLevel !== "aal2" || aalData.nextLevel === "aal2")) {
      // Admin requires MFA step-up authentication
      return NextResponse.redirect(new URL("/admin/mfa", request.url));
    }
  }

  return response;
}
