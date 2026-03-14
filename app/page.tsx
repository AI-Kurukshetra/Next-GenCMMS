import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      <div className="relative z-10">
        {/* Header/Navigation */}
        <header className="border-b border-slate-700/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Asset Ops Logo"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#benefits" className="hover:text-white transition">Why Choose Us</a>
              <a href="#cta" className="hover:text-white transition">Get Started</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-slate-300 font-semibold hover:text-white hover:bg-slate-700/50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition"
              >
                Start Free
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-block">
              <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-sm font-bold">
                ✨ Next-Gen CMMS Platform
              </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
              Maintenance Operations,<br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Completely Transformed
              </span>
            </h2>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Real-time asset tracking, intelligent work order management, preventive maintenance automation, and inventory control. Everything you need to run maintenance like a pro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/signup"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/50 transition active:scale-95"
              >
                Start Free Trial →
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              No credit card required • Set up in minutes • First location included
            </p>
          </div>

          {/* Dashboard Preview Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-slate-700/40 p-4 border border-slate-600/50">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Assets</p>
                <p className="text-3xl font-black text-white mt-2">1,247</p>
              </div>
              <div className="rounded-xl bg-slate-700/40 p-4 border border-slate-600/50">
                <p className="text-xs font-bold text-slate-400 uppercase">Open WOs</p>
                <p className="text-3xl font-black text-white mt-2">87</p>
              </div>
              <div className="rounded-xl bg-slate-700/40 p-4 border border-slate-600/50">
                <p className="text-xs font-bold text-slate-400 uppercase">PM Rate</p>
                <p className="text-3xl font-black text-white mt-2">94%</p>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 border border-indigo-500/30 p-6">
              <div className="text-slate-300 text-center">
                <p className="font-semibold">📊 Your Maintenance Dashboard</p>
                <p className="text-sm mt-2">Real-time KPIs, work order workflows, inventory alerts, and PM compliance tracking</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-700/50">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-sm font-bold mb-4">
              Core Capabilities
            </span>
            <h3 className="text-4xl md:text-5xl font-black text-white">
              Everything Your Team Needs
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Work Orders */}
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-indigo-500/40 transition group">
              <div className="text-5xl mb-4">📋</div>
              <h4 className="text-2xl font-black text-white mb-3">Work Order Management</h4>
              <p className="text-slate-300 mb-6">
                Create, assign, and track maintenance tasks with full lifecycle management. Real-time status updates, priority levels, and technician assignments.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Instant creation and assignment</li>
                <li>✓ Status workflow (Open → In Progress → Completed)</li>
                <li>✓ Time tracking and labor costs</li>
                <li>✓ Photo uploads and notes</li>
              </ul>
            </div>

            {/* Feature 2: Asset Registry */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-purple-500/40 transition group">
              <div className="text-5xl mb-4">🏭</div>
              <h4 className="text-2xl font-black text-white mb-3">Asset Registry</h4>
              <p className="text-slate-300 mb-6">
                Complete asset inventory with specifications, maintenance history, warranty tracking, and location management across multiple facilities.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Full asset specifications</li>
                <li>✓ Maintenance history timeline</li>
                <li>✓ Warranty & purchase tracking</li>
                <li>✓ Multi-location support</li>
              </ul>
            </div>

            {/* Feature 3: Preventive Maintenance */}
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-cyan-500/40 transition group">
              <div className="text-5xl mb-4">🔧</div>
              <h4 className="text-2xl font-black text-white mb-3">Preventive Maintenance</h4>
              <p className="text-slate-300 mb-6">
                Automated PM scheduling with intelligent reminders and auto-generation of work orders. Never miss a maintenance cycle again.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Interval-based scheduling</li>
                <li>✓ Auto work order generation</li>
                <li>✓ Compliance tracking</li>
                <li>✓ Historical trending</li>
              </ul>
            </div>

            {/* Feature 4: Inventory Management */}
            <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-green-500/40 transition group">
              <div className="text-5xl mb-4">📦</div>
              <h4 className="text-2xl font-black text-white mb-3">Inventory Control</h4>
              <p className="text-slate-300 mb-6">
                Track spare parts, monitor stock levels, automate reorder alerts, and link inventory usage directly to work orders.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Real-time stock tracking</li>
                <li>✓ Low-stock alerts</li>
                <li>✓ Automated reordering</li>
                <li>✓ Cost tracking & analytics</li>
              </ul>
            </div>

            {/* Feature 5: Analytics & Reporting */}
            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-orange-500/40 transition group">
              <div className="text-5xl mb-4">📊</div>
              <h4 className="text-2xl font-black text-white mb-3">Analytics & Insights</h4>
              <p className="text-slate-300 mb-6">
                Real-time dashboards with KPIs, compliance metrics, work order throughput, and predictive maintenance insights.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Real-time KPI cards</li>
                <li>✓ PM completion rates</li>
                <li>✓ Asset uptime tracking</li>
                <li>✓ Cost analysis</li>
              </ul>
            </div>

            {/* Feature 6: Multi-Tenant & Roles */}
            <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl p-8 hover:border-pink-500/40 transition group">
              <div className="text-5xl mb-4">👥</div>
              <h4 className="text-2xl font-black text-white mb-3">Team Collaboration</h4>
              <p className="text-slate-300 mb-6">
                Role-based access control with Admin, Manager, and Technician views. Perfect for organizations of any size.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Role-based dashboards</li>
                <li>✓ Multi-location support</li>
                <li>✓ Vendor management</li>
                <li>✓ Notification system</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-700/50">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-sm font-bold mb-4">
              Why Choose Asset Ops
            </span>
            <h3 className="text-4xl md:text-5xl font-black text-white">
              Built for Modern Manufacturing
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Lightning Fast", desc: "Real-time updates and instant notifications keep everyone in sync" },
              { icon: "🔒", title: "Secure & Compliant", desc: "Enterprise-grade security with role-based access and audit logs" },
              { icon: "📱", title: "Mobile Ready", desc: "Fully responsive design works on desktop, tablet, and mobile phones" },
              { icon: "🚀", title: "Easy Setup", desc: "Get started in minutes with guided onboarding and templates" },
              { icon: "🔗", title: "API Ready", desc: "Integrate with your existing systems via REST APIs" },
              { icon: "📈", title: "Scalable", desc: "From single location to enterprise with unlimited assets and users" },
            ].map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6 hover:border-indigo-500/50 transition"
              >
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{benefit.title}</h4>
                <p className="text-slate-400 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-700/50">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/10 to-cyan-600/10 backdrop-blur-xl p-12 text-center space-y-6">
            <h3 className="text-4xl md:text-5xl font-black text-white">
              Ready to Transform Your Maintenance?
            </h3>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of organizations using Asset Ops to reduce downtime, improve compliance, and optimize operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/signup"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/50 transition active:scale-95"
              >
                Start Free Trial →
              </Link>
              <a
                href="mailto:demo@assetops.com"
                className="px-8 py-4 rounded-lg border-2 border-indigo-500/50 text-white font-bold text-lg hover:bg-indigo-500/10 transition"
              >
                Request Demo
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-700/50">
              {[
                { label: "No Credit Card", icon: "💳" },
                { label: "Setup in Minutes", icon: "⏱️" },
                { label: "Free Forever Plan", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl">{item.icon}</div>
                  <p className="text-sm font-semibold text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 mt-20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="font-black text-white text-sm">AO</span>
                  </div>
                  <span className="font-black text-white">Asset Ops</span>
                </div>
                <p className="text-sm text-slate-400">
                  Modern CMMS for manufacturing and operations teams.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#features" className="hover:text-white transition">Features</a></li>
                  <li><a href="/dashboard" className="hover:text-white transition">Demo</a></li>
                  <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition">About</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition">Security</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2024 Asset Ops. All rights reserved. Built with ❤️ for manufacturing teams.</p>
            </div>
          </div>
        </footer>

        {hasSupabaseEnv() ? null : (
          <div className="fixed bottom-4 right-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 max-w-xs">
            ⚠️ Configure <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and
            <code className="bg-amber-100 px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100 px-1 rounded ml-1">.env.local</code>.
          </div>
        )}
      </div>
    </main>
  );
}
