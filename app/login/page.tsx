import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
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
          <h1 className="text-3xl font-black text-white mb-2">Asset Ops</h1>
          <p className="text-slate-300 text-sm">Sign in to your maintenance workspace</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form action={signInAction} className="space-y-4">
            {/* Error Alert */}
            {searchParams.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-3">
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm text-red-700 font-medium">{searchParams.error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {searchParams.message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-3">
                  <span className="text-lg">✓</span>
                  <p className="text-sm text-green-700 font-medium">{searchParams.message}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
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

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition"
                  aria-label="Forgot your password?"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                aria-label="Password"
                aria-required="true"
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-500 mt-2">Minimum 6 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">
                New to Asset Ops?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="w-full block text-center px-4 py-3 rounded-lg border-2 border-slate-200 text-slate-900 font-semibold hover:bg-slate-50 hover:border-indigo-300 transition"
          >
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          By signing in, you agree to our{" "}
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
