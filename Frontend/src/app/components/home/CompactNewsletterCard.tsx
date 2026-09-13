"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import NewsletterForm from "../NewsletterForm";
import { useLanguage } from "@/providers/languageContext";

/** Compact newsletter sign-up for the homepage right sidebar. */
export default function CompactNewsletterCard() {
  const { t } = useLanguage();

  return (
    <section
      className="mt-4 min-w-0 overflow-hidden rounded-[17px] border border-primary-700/60 p-[18px] shadow-soft"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--primary-600) 42%, var(--primary-950)), color-mix(in srgb, var(--primary-700) 64%, var(--primary-950)))",
      }}
    >
      <h2 className="text-[14px] font-semibold leading-tight text-white">
        {t("homeCompare.compactNewsletter.title")}
      </h2>
      <p className="mt-2 text-[10px] leading-[1.5] text-white/75">
        {t("homeCompare.compactNewsletter.description")}
      </p>

      <NewsletterForm
        ariaLabel={t("newsletterForm.formLabel")}
        inputLabel={t("newsletterForm.placeholder")}
        placeholder={t("newsletterForm.placeholder")}
        buttonText={t("newsletterForm.buttonText")}
        buttonContent={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
        loadingContent={<LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
        formClassName="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_42px] gap-2"
        inputClassName="h-[42px] min-w-0 rounded-[11px] border border-white/20 bg-white/95 px-3 text-[11px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-primary-950 disabled:opacity-75"
        buttonClassName="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-primary-700 text-white shadow-soft-sm transition-colors duration-200 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
        feedbackClassName="col-span-2 text-[9px] leading-[1.4] text-white/85"
      />
    </section>
  );
}
