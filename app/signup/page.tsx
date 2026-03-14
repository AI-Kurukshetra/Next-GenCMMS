import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/signup/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Asset Ops Logo"
            width={80}
            height={80}
            className="h-20 w-20 mx-auto mb-4"
            priority
          />
          <h1 className="text-3xl font-black text-white mb-2">Get Started</h1>
          <p className="text-slate-300 text-sm">Set up your maintenance operations platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form action={signUpAction} className="space-y-4">
            {/* Error Alert */}
            {searchParams.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-3">
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm text-red-700 font-medium">{searchParams.error}</p>
                </div>
              </div>
            )}

            {/* Company Name Field */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-semibold text-slate-900 mb-2">
                Company Name
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="Your Company Inc."
                required
                minLength={2}
                autoComplete="organization"
                aria-label="Company name"
                aria-required="true"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-500 mt-1">We will use this to set up your workspace</p>
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-slate-900 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                minLength={2}
                autoComplete="name"
                aria-label="Full name"
                aria-required="true"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                autoComplete="email"
                aria-label="Email address"
                aria-required="true"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                aria-label="Password"
                aria-required="true"
                aria-describedby="password-hint"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p id="password-hint" className="text-xs text-slate-500 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="password_confirm" className="block text-sm font-semibold text-slate-900 mb-2">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                aria-label="Confirm password"
                aria-required="true"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            <FormSubmitButton
              type="submit"
              pendingText="Creating Account..."
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create account"
            >
              Create Account
            </FormSubmitButton>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link
            href="/login"
            className="w-full block text-center px-4 py-3 rounded-lg border-2 border-slate-200 text-slate-900 font-semibold hover:bg-slate-50 hover:border-indigo-300 transition"
          >
            Sign In
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs text-slate-300 font-medium">Real-time</p>
            <p className="text-xs text-slate-400">Dashboards</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔧</div>
            <p className="text-xs text-slate-300 font-medium">Preventive</p>
            <p className="text-xs text-slate-400">Maintenance</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-xs text-slate-300 font-medium">Inventory</p>
            <p className="text-xs text-slate-400">Tracking</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Terms of Service
          </a>
          {" "}and{" "}
          <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
