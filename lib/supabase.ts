"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (client) return client;

  if (!SUPABASE_URL) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL. Configure it in your local env or Vercel project settings before using cloud save.");
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure it in your local env or Vercel project settings before using cloud save.");
  }

  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
