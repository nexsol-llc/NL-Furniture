"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { setUserToken } from "@/lib/userAuth"
import { useLanguage } from "@/providers/languageContext"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t('auth.loginFailed'))
        toast.error(t('auth.loginFailed'))
        return
      }

      setUserToken(data.token)
      toast.success(t('auth.loginSuccess'))
      setTimeout(() => router.push("/dashboard"), 800)
    } catch {
      setError(t('auth.networkError'))
      toast.error(t('auth.networkErrorShort'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(240,115,76,0.15),_transparent_35%),linear-gradient(135deg,_#f3f4f6,_#e5e7eb_60%,_#d1d5db)] px-4">
      <Toaster position="top-center" />
      <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/20 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {t('auth.loginHeading')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('auth.loginSubtitle')}
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
              placeholder="••••••••"
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
            {loading ? t('auth.loggingIn') : t('auth.loginHeading')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6 space-y-3">
          <p className="text-sm text-gray-600">
            {t('auth.noAccount')}{" "}
            <Link
              href="/register"
              className="font-semibold text-primary-600 hover:underline hover:text-primary-700"
            >
              {t('auth.createAccount')}
            </Link>
          </p>
          <div className="block">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
