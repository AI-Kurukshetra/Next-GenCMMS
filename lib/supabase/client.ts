import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
