"use client";

import { useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";
import { Reveal } from "../components/motion/Reveal";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('auth.forgotSendError'));
        return;
      }

      toast.success(t('auth.forgotLinkSent'));
      setDone(true);
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
            {t('auth.forgotHeading')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('auth.forgotSubtitle')}
          </p>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {t('auth.forgotLinkSentText', { email })}
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 hover:shadow-soft-lg transition-all duration-200 text-sm shadow-soft-md"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 hover:shadow-soft-lg transition-all duration-200 text-sm shadow-soft-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.sendingLink') : t('auth.requestLink')}
            </button>
          </form>
        )}

        {!done && (
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-600">
              {t('auth.rememberPassword')}{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:underline hover:text-primary-700"
              >
                {t('auth.loginHere')}
              </Link>
            </p>
          </div>
        )}
      </Reveal>
    </div>
  );
}
