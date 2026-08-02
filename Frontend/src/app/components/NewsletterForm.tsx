"use client";

import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";

interface NewsletterFormProps {
  placeholder?: string;
  buttonText?: string;
  buttonClassName?: string;
  inputClassName?: string;
  formClassName?: string;
}

export default function NewsletterForm({
  placeholder,
  buttonText,
  buttonClassName = "bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-cta hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98] transition-all duration-200",
  inputClassName = "flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm",
  formClassName = "flex flex-col sm:flex-row gap-3",
}: NewsletterFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(t('newsletterForm.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('newsletterForm.subscribeError'));
        return;
      }

      toast.success(data.message || t('newsletterForm.subscribeSuccess'));
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(t('newsletterForm.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubscribe} className={formClassName}>
        <input
          type="email"
          placeholder={placeholder ?? t('newsletterForm.placeholder')}
          className={inputClassName}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`${buttonClassName} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? t('newsletterForm.submitting') : (buttonText ?? t('newsletterForm.buttonText'))}
        </button>
      </form>
    </>
  );
}
