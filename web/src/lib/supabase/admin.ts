import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/types";
import { getSupabaseUrl } from "./public";

export async function createAdminClient() {
  // SUPABASE_SECRET_KEY bypasses RLS; call this only after each admin action
  // has passed requireAdmin(). Never import it into a client component.
  await requireAdmin();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Supabase server secret is not configured.");

  return createSupabaseClient<Database>(getSupabaseUrl(), secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
