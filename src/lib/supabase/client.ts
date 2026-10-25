"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser environments.
 * Uses cookies automatically for session persistence.
 */
export function createClient() {
  // If environment variables are missing, provide clean fallback credentials
  // so the client initializes without crashing, while RLS and server actions
  // detect configuration status honestly.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unconfigured-sanctuary.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.unconfigured";

  return createBrowserClient(url, anonKey);
}
