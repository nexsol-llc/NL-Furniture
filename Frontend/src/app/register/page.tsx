"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";
import { Reveal } from "../components/motion/Reveal";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('auth.registerFailed'));
        return;
      }

      toast.success(t('auth.registerSuccess'));
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error(t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(240,115,76,0.15),_transparent_35%),linear-gradient(135deg,_#f3f4f6,_#e5e7eb_60%,_#d1d5db)] px-4">
      <Toaster position="top-center" />
      <Reveal className="glass-panel p-8 md:p-10 rounded-3xl shadow-depth-4 w-full max-w-md">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {t('auth.registerHeading')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              {t('auth.usernameLabel')}
            </label>
            <input
              type="text"
              placeholder={t('auth.usernamePlaceholder')}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition-all shadow-soft"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition-all shadow-soft"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              placeholder={t('auth.passwordMinChars')}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition-all shadow-soft"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 hover:shadow-soft-lg transition-all duration-200 text-sm shadow-soft-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.registering') : t('auth.registerHeading')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-600 hover:underline hover:text-primary-700"
            >
              {t('auth.loginHere')}
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
