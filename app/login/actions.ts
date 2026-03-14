"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Validation
  if (!email || !password) {
    redirect("/login?error=Email and password are required");
  }

  if (!EMAIL_REGEX.test(email)) {
    redirect("/login?error=Please enter a valid email address");
  }

  if (password.length < 6) {
    redirect("/login?error=Password must be at least 6 characters");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Use generic message for security (don't reveal if account exists)
      const message = error.message.includes("Invalid login credentials")
        ? "Invalid email or password"
        : "Login failed. Please try again.";
      redirect(`/login?error=${encodeURIComponent(message)}`);
    }

    redirect("/dashboard");
  } catch {
    redirect("/login?error=An unexpected error occurred. Please try again.");
  }
}
