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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unconfigured-sanctuary.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      "Elevated admin client error: SUPABASE_SERVICE_ROLE_KEY environment variable is missing on server."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
