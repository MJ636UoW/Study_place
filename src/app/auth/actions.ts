"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

export interface AuthActionResult {
  success: boolean;
  message: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

/**
 * Sign in using email and password
 */
export async function signInWithPassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return {
      success: false,
      message: config.message,
      error: "Supabase environment variables are missing in .env.local",
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return {
      success: false,
      message: "Please enter both email and password.",
      error: "validation_error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      error: error.code || "auth_error",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/**
 * Register a new member account with verified email workflow
 */
export async function signUpWithPassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return {
      success: false,
      message: config.message,
      error: "Supabase environment variables are missing in .env.local",
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return {
      success: false,
      message: "Full name, email, and password are required.",
      error: "validation_error",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      error: error.code || "signup_error",
    };
  }

  // If Supabase has email confirmations enabled, user session won't be active immediately
  if (data.user && !data.session) {
    return {
      success: true,
      message: "Verification link dispatched. Please inspect your inbox to activate sanctuary credentials.",
      requiresEmailVerification: true,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sign in using Magic Link / OTP
 */
export async function signInWithOtp(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return {
      success: false,
      message: config.message,
      error: "Supabase environment variables are missing in .env.local",
    };
  }

  const email = formData.get("email") as string;
  if (!email) {
    return {
      success: false,
      message: "Email address is required for dispatching a magic pass.",
      error: "validation_error",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      error: error.code || "otp_error",
    };
  }

  return {
    success: true,
    message: "Magic pass dispatched. Follow the link in your email to authenticate.",
  };
}

/**
 * Sign out and clear all secure auth cookies
 */
export async function signOut(): Promise<void> {
  const config = getSupabaseConfigStatus();
  if (config.isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Request password recovery link
 */
export async function requestPasswordReset(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return {
      success: false,
      message: config.message,
      error: "Supabase unconfigured",
    };
  }

  const email = formData.get("email") as string;
  if (!email) {
    return {
      success: false,
      message: "Please provide the account email address.",
      error: "validation_error",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      error: error.code || "reset_error",
    };
  }

  return {
    success: true,
    message: "Password recovery instructions dispatched to your email address.",
  };
}
