"use client";

import Link from "next/link";
import { Eye, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { ADVERTISE_HREF } from "./AdvertiseWithUsCard";
import { useLanguage } from "@/providers/languageContext";

type WhyAdvertiseCardProps = {
  href?: string;
};

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Compact benefit summary beneath the homepage's advertising CTA. */
export default function WhyAdvertiseCard({
  href = ADVERTISE_HREF,
}: WhyAdvertiseCardProps) {
  const { t } = useLanguage();

  const benefits: Benefit[] = [
    {
      icon: Eye,
      title: t("homeCompare.whyAdvertise.visibilityTitle"),
      description: t("homeCompare.whyAdvertise.visibilityDescription"),
    },
    {
      icon: Target,
      title: t("homeCompare.whyAdvertise.audienceTitle"),
      description: t("homeCompare.whyAdvertise.audienceDescription"),
    },
    {
      icon: TrendingUp,
      title: t("homeCompare.whyAdvertise.salesTitle"),
      description: t("homeCompare.whyAdvertise.salesDescription"),
    },
  ];

  return (
    <section className="mt-4 overflow-hidden rounded-[17px] border border-gray-200/90 bg-white p-[18px] shadow-soft-sm transition-shadow duration-200 hover:shadow-soft">
      <h2 className="text-[14px] font-semibold leading-tight text-gray-900">
        {t("homeCompare.whyAdvertise.title")}
      </h2>

      <ul className="mt-4 space-y-3.5">
        {benefits.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary-200/70 bg-primary-50 text-primary-700"
              style={{
                background:
                  "color-mix(in srgb, rgb(var(--primary-600-rgb)) 9%, white)",
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold leading-tight text-gray-900">
                {title}
              </span>
              <span className="mt-0.5 block text-[9px] leading-[1.45] text-gray-500">
                {description}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        aria-label={t("homeCompare.whyAdvertise.ariaLabel")}
        className="mt-4 flex w-full items-center justify-center rounded-[10px] bg-primary-700 px-3 py-2.5 text-[10px] font-bold text-white shadow-soft-sm transition-colors duration-200 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        {t("homeCompare.whyAdvertise.cta")}
      </Link>
    </section>
  );
}
