import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase URL and publishable key are not configured.");
  }

  return { url: getSupabaseUrl(), publishableKey };
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("Supabase URL is not configured.");
  const parsedUrl = new URL(value);
  const isLocal = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
  if (parsedUrl.protocol !== "https:" && !(isLocal && parsedUrl.protocol === "http:")) {
    throw new Error("Supabase URL must use HTTPS outside local development.");
  }
  if (parsedUrl.username || parsedUrl.password) throw new Error("Supabase URL must not contain credentials.");
  return parsedUrl.origin;
}

export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
