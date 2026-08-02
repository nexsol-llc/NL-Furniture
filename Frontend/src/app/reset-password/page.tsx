"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t('auth.invalidOrMissingToken'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDontMatch'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('auth.resetError'));
        return;
      }

      toast.success(t('auth.resetSuccess'));
      setDone(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error(t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(240,115,76,0.15),_transparent_35%),linear-gradient(135deg,_#f3f4f6,_#e5e7eb_60%,_#d1d5db)] px-4">
        <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/20 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.invalidLinkHeading')}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {t('auth.invalidLinkText')}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 hover:shadow-soft-lg transition-all duration-200 text-sm shadow-soft-md"
          >
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(240,115,76,0.15),_transparent_35%),linear-gradient(135deg,_#f3f4f6,_#e5e7eb_60%,_#d1d5db)] px-4">
      <Toaster position="top-center" />
      <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/20 w-full max-w-md">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {t('auth.resetHeading')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('auth.resetSubtitle')}
          </p>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-650 font-semibold">
              {t('auth.passwordChangedSuccess')}
            </p>
            <p className="text-xs text-gray-500">
              {t('auth.redirectingToLogin')}
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs text-primary-600 font-bold hover:underline"
              >
                {t('auth.clickIfNoRedirect')}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                {t('auth.newPasswordLabel')}
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                {t('auth.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition-all shadow-soft"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 hover:shadow-soft-lg transition-all duration-200 text-sm shadow-soft-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.saving') : t('auth.savePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{t('auth.loadingForm')}</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
