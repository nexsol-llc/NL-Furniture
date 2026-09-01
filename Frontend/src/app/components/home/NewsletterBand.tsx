"use client";

import { Mail } from "lucide-react";
import NewsletterForm from "../NewsletterForm";
import { useLanguage } from "@/providers/languageContext";

/** Closing sign-up band. */
export default function NewsletterBand() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900 p-5 shadow-depth-2 md:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-start gap-5 md:flex-row md:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
          <Mail className="h-6 w-6" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg leading-tight text-white md:text-xl">
            {t("homeCompare.newsletterBand.titleLine1")}
            <br className="hidden sm:block" />{" "}
            {t("homeCompare.newsletterBand.titleLine2")}
          </h2>
          <p className="mt-1 text-[11px] text-white/70 md:text-xs">
            {t("homeCompare.newsletterBand.subtitle")}
          </p>
        </div>

        <div className="w-full md:w-[380px]">
          <NewsletterForm
            formClassName="flex gap-2"
            inputClassName="min-w-0 flex-1 rounded-lg border border-white/25 bg-white/95 px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            buttonClassName="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-black"
          />
        </div>
      </div>
    </section>
  );
}
