import Image from "next/image";
import Link from "next/link";
import { signInAction } from "@/app/login/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
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
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            {searchParams.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700 font-medium">
                  ❌ {searchParams.error}
                </p>
              </div>
            )}

            {searchParams.message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-700 font-medium">
                  ✓ {searchParams.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg hover:shadow-xl active:scale-95"
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
