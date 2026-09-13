"use client";

import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";

type AdvertiseWithUsCardProps = {
  href?: string;
};

export const ADVERTISE_HREF = "/partner-worden";

/** Compact business CTA for the fixed-width homepage right rail. */
export default function AdvertiseWithUsCard({
  href = ADVERTISE_HREF,
}: AdvertiseWithUsCardProps) {
  const { t } = useLanguage();

  return (
    <section
      className="mt-4 overflow-hidden rounded-[17px] border border-primary-200/70 bg-primary-50 p-[18px] shadow-soft-sm transition-shadow duration-200 hover:shadow-soft"
      style={{
        background:
          "color-mix(in srgb, rgb(var(--primary-600-rgb)) 10%, white)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold leading-tight text-gray-900">
            {t("homeCompare.advertise.title")}
          </h2>
          <p className="mt-1.5 text-[10px] leading-[1.45] text-gray-600">
            {t("homeCompare.advertise.description")}
          </p>

          <Link
            href={href}
            aria-label={t("homeCompare.advertise.ariaLabel")}
            className="group/cta mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-[10px] font-bold text-white shadow-soft-sm transition-colors duration-200 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {t("homeCompare.advertise.cta")}
            <ArrowRight
              aria-hidden="true"
              className="h-3 w-3 transition-transform duration-200 group-hover/cta:translate-x-0.5"
            />
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary-200/80 bg-white/75 text-primary-700 shadow-soft-sm"
        >
          <span className="absolute -right-1 top-1 h-3 w-3 rounded-full bg-primary-300/70" />
          <span className="absolute -bottom-0.5 left-1 h-2 w-2 rounded-full bg-primary-500/25" />
          <Megaphone className="h-7 w-7 -rotate-12" strokeWidth={1.8} />
        </div>
      </div>
    </section>
  );
}
