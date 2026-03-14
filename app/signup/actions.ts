"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  // Validation
  if (!email || !password || !companyName || !fullName) {
    redirect("/signup?error=All fields are required");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password must be at least 6 characters");
  }

  if (!email.includes("@")) {
    redirect("/signup?error=Invalid email address");
  }

  const supabase = await createClient();

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user?.id) {
    redirect("/signup?error=Failed to create account");
  }

  // If user is immediately signed in (no email confirmation), proceed to onboarding
  // where workspace/org/profile creation runs with an authenticated session.
  if (data.session) {
    redirect("/onboarding");
  }

  // If email confirmation is required
  redirect("/login?message=Check your email to confirm signup, then login");
}
