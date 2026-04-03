"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";

const PREMIUM_ACCESS_TABLE = "user_access";

type UserAccessRow = {
  is_premium: boolean | null;
};

export async function getCurrentUserPremiumStatus() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!session?.user) {
    return false;
  }

  const { data, error } = await supabase
    .from(PREMIUM_ACCESS_TABLE)
    .select("is_premium")
    .eq("user_id", session.user.id)
    .maybeSingle<UserAccessRow>();

  if (error) {
    throw new Error(`Premium access check failed: ${error.message}`);
  }

  return Boolean(data?.is_premium);
}
