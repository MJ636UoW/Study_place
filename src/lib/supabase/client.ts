"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser environments.
 * Uses cookies automatically for session persistence.
 */
export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://dyaobbudjufenwporvdb.supabase.co";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_WxuAYGiRxPHNI6P6yc9uQQ_WhkZeoO1";

  return createBrowserClient(url, anonKey);
}
