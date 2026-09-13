"use client";

import React, { useId, useState, type ReactNode } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";

interface NewsletterFormProps {
  placeholder?: string;
  buttonText?: string;
  buttonClassName?: string;
  inputClassName?: string;
  formClassName?: string;
  feedbackClassName?: string;
  buttonContent?: ReactNode;
  loadingContent?: ReactNode;
  ariaLabel?: string;
  inputLabel?: string;
}

export default function NewsletterForm({
  placeholder,
  buttonText,
  buttonClassName = "bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-cta hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98] transition-all duration-200",
  inputClassName = "flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm",
  formClassName = "flex flex-col sm:flex-row gap-3",
  feedbackClassName = "text-xs",
  buttonContent,
  loadingContent,
  ariaLabel,
  inputLabel,
}: NewsletterFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const inputId = useId();
  const feedbackId = `${inputId}-feedback`;
  const normalizedEmail = email.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const showValidationError = touched && !isValid;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFeedback(null);
    if (!isValid) {
      toast.error(t('newsletterForm.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      await res.json();

      if (!res.ok) {
        setFeedback("error");
        toast.error(t('newsletterForm.subscribeError'));
        return;
      }

      setFeedback("success");
      toast.success(t('newsletterForm.subscribeSuccess'));
      setEmail("");
      setTouched(false);
    } catch (err) {
      console.error(err);
      setFeedback("error");
      toast.error(t('newsletterForm.subscribeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubscribe}
        className={formClassName}
        aria-label={ariaLabel ?? t('newsletterForm.formLabel')}
        aria-busy={loading}
        noValidate
      >
        <div className="contents">
          <label htmlFor={inputId} className="sr-only">
            {inputLabel ?? placeholder ?? t('newsletterForm.placeholder')}
          </label>
          <input
            id={inputId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={placeholder ?? t('newsletterForm.placeholder')}
            className={inputClassName}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFeedback(null);
            }}
            onBlur={() => setTouched(true)}
            disabled={loading}
            required
            aria-invalid={showValidationError}
            aria-describedby={showValidationError || feedback ? feedbackId : undefined}
          />

          <button
            type="submit"
            disabled={loading || !isValid}
            aria-label={buttonText ?? t('newsletterForm.buttonText')}
            className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading
              ? (loadingContent ?? t('newsletterForm.submitting'))
              : (buttonContent ?? buttonText ?? t('newsletterForm.buttonText'))}
          </button>
        </div>

        {(showValidationError || feedback) && (
          <p
            id={feedbackId}
            role={feedback === "error" || showValidationError ? "alert" : "status"}
            className={feedbackClassName}
          >
            {showValidationError
              ? t('newsletterForm.invalidEmail')
              : feedback === "success"
                ? t('newsletterForm.subscribeSuccess')
                : t('newsletterForm.subscribeError')}
          </p>
        )}
      </form>
    </>
  );
}
