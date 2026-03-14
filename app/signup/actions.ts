"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  // Validation
  if (!email || !password || !passwordConfirm || !companyName || !fullName) {
    redirect("/signup?error=All fields are required");
  }

  if (!EMAIL_REGEX.test(email)) {
    redirect("/signup?error=Please enter a valid email address");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password must be at least 8 characters");
  }

  if (password !== passwordConfirm) {
    redirect("/signup?error=Passwords do not match");
  }

  if (fullName.length < 2) {
    redirect("/signup?error=Name must be at least 2 characters");
  }

  if (companyName.length < 2) {
    redirect("/signup?error=Company name must be at least 2 characters");
  }

  try {
    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (error) {
      // Handle common signup errors
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      } else if (message.includes("password")) {
        message = "Password does not meet security requirements.";
      }
      redirect(`/signup?error=${encodeURIComponent(message)}`);
    }

    if (!data.user?.id) {
      redirect("/signup?error=Failed to create account");
    }

    // If user is immediately signed in (no email confirmation), send to landing.
    if (data.session) {
      redirect("/");
    }

    // If email confirmation is required, send user back to landing.
    redirect("/");
  } catch {
    redirect("/signup?error=An unexpected error occurred. Please try again.");
  }
}
