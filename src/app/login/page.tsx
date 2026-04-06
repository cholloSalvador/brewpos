"use client";

import { useState } from "react";
import { Coffee, AlertCircle, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user.role === "superadmin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-[72px] h-[72px] bg-amber-600 rounded-[22px] flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Coffee className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">BrewPOS</h1>
          <p className="text-[#86868b] mt-1 text-[15px]">Coffee Shop Management System</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-white/60 p-7 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[15px] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[15px] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur rounded-xl p-3.5 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <LogIn className="w-[18px] h-[18px]" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-8">
          <a href="/trial" className="text-[15px] text-amber-600 font-medium hover:text-amber-700 transition-colors">
            Start your free 14-day trial
          </a>
        </div>
      </div>
    </div>
  );
}
