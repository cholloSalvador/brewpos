"use client";

import { useState } from "react";
import { Coffee, CheckCircle, AlertCircle, Sparkles, Clock, ShoppingCart, BarChart3, Package } from "lucide-react";
import Link from "next/link";

export default function TrialPage() {
  const [form, setForm] = useState({ storeName: "", ownerName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Trial Activated!</h2>
          <p className="text-gray-500 mt-2">Your 14-day free trial has started.</p>
          <div className="bg-green-50 rounded-lg p-4 mt-4 text-left">
            <p className="text-sm text-green-800"><strong>Store:</strong> {form.storeName}</p>
            <p className="text-sm text-green-800"><strong>Email:</strong> {form.email}</p>
            <p className="text-sm text-green-800"><strong>Trial ends:</strong> {new Date(Date.now() + 14 * 86400000).toLocaleDateString()}</p>
          </div>
          <Link
            href="/login"
            className="mt-6 inline-block w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Coffee className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">BrewPOS</h1>
        <p className="text-gray-500 mt-1">Coffee Shop Management System</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-800">Start Your 14-Day Free Trial</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">No credit card required. Full access to all features.</p>

              <div className="space-y-3">
                {[
                  { icon: ShoppingCart, text: "Point of Sale with cash & card payments" },
                  { icon: Package, text: "Auto inventory deduction per recipe" },
                  { icon: BarChart3, text: "Sales reports (daily, weekly, monthly)" },
                  { icon: Clock, text: "Order history & customer tracking" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Create Your Account</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store / Business Name *</label>
                <input
                  type="text" required
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. My Coffee Shop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text" required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password" required minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : "Start Free 14-Day Trial"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Already have an account? <Link href="/login" className="text-amber-600 hover:underline">Login here</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
