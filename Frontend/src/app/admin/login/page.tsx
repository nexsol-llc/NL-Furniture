"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, setAdminToken, decodeAdminToken } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      const payload = decodeAdminToken(data.token);
      if (!payload) {
        setError("Invalid token received");
        return;
      }

      setAdminToken(data.token);
      router.push("/admin");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgb(var(--primary-400-rgb)/0.15),_transparent_35%),linear-gradient(135deg,_#f3f4f6,_#e5e7eb_60%,_#d1d5db)] px-4">
      <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/20 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Melden Sie sich mit Ihrem Admin-Konto an.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              placeholder="admin@beispiel.de"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white transition-all shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white transition-all shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-700 hover:shadow-sm transition-all duration-200 text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
