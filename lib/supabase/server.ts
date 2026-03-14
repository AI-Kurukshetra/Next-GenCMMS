import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, hasSupabaseEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = cookies();

  if (!hasSupabaseEnv()) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        // In Server Components, cookie writes are not allowed; middleware/actions handle refresh writes.
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options) {
        // In Server Components, cookie writes are not allowed; middleware/actions handle refresh writes.
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}
