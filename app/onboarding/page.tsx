import Image from "next/image";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
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
          <h1 className="text-3xl font-black text-white mb-2">Welcome to Asset Ops</h1>
          <p className="text-slate-300 text-sm">Let us set up your maintenance workspace in just a few steps</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form action={completeOnboardingAction} className="space-y-4">
            {/* Progress indicator */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
              <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
              <div className="h-1 flex-1 bg-slate-200 rounded-full" />
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Your Full Name
              </label>
              <input
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-500 mt-1">How you will appear in the system</p>
            </div>

            {/* Organization Name Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Organization Name
              </label>
              <input
                name="organization_name"
                type="text"
                placeholder="Acme Manufacturing"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-500 mt-1">Your company or facility name</p>
            </div>

            {/* Location Name Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                First Location
              </label>
              <input
                name="location_name"
                type="text"
                placeholder="Main Plant"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-500 mt-1">You can add more locations later</p>
            </div>

            {searchParams.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700 font-medium">
                  ❌ {searchParams.error}
                </p>
              </div>
            )}

            <FormSubmitButton
              type="submit"
              pendingText="Setting Up..."
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl active:scale-95"
            >
              Set Up Workspace
            </FormSubmitButton>
          </form>

          {/* Info Cards */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex gap-3">
              <span className="text-lg">📊</span>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Ready-to-use Dashboard</p>
                <p className="text-slate-600">Start tracking assets and work orders immediately</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">👥</span>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Invite Your Team</p>
                <p className="text-slate-600">Add team members with different roles and permissions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">🚀</span>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Get Started in Minutes</p>
                <p className="text-slate-600">No complex setup or training required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          You can modify these details anytime in Settings
        </p>
      </div>
    </main>
  );
}
