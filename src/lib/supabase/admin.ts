import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Elevated Administrative Supabase Client (Service Role).
 *
 * CRITICAL SECURITY INVARIANT:
 * This client bypasses Row Level Security (RLS). It MUST NEVER be executed
 * or bundled on the browser/client side. It is strictly for internal
 * server actions, webhook ingestion, and background audit workers.
 */

if (typeof window !== "undefined") {
  throw new Error("FATAL SECURITY VIOLATION: Supabase Admin Service Role client loaded in browser context!");
}

export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://dyaobbudjufenwporvdb.supabase.co";

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_WxuAYGiRxPHNI6P6yc9uQQ_WhkZeoO1";

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
