"use client";

import { Headphones, Lock, RotateCcw, Tags, Truck } from "lucide-react";
import { HomeCard } from "./HomeUi";
import { useLanguage } from "@/providers/languageContext";

/** The five service guarantees, in one horizontally scrollable strip. */
export default function TrustStrip() {
  const { t } = useLanguage();

  const items = [
    { icon: Truck, title: t("homeCompare.trust.shippingTitle"), text: t("homeCompare.trust.shippingText") },
    { icon: Tags, title: t("homeCompare.trust.priceTitle"), text: t("homeCompare.trust.priceText") },
    { icon: RotateCcw, title: t("homeCompare.trust.returnsTitle"), text: t("homeCompare.trust.returnsText") },
    { icon: Lock, title: t("homeCompare.trust.paymentTitle"), text: t("homeCompare.trust.paymentText") },
    { icon: Headphones, title: t("homeCompare.trust.supportTitle"), text: t("homeCompare.trust.supportText") },
  ];

  return (
    <HomeCard className="px-4 py-3.5">
      <ul className="flex items-center gap-5 overflow-x-auto hide-scrollbar md:grid md:grid-cols-5 md:gap-3 md:overflow-visible">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex shrink-0 items-center gap-2.5 md:min-w-0 md:shrink">
            <Icon className="h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[11px] font-bold text-gray-900 md:truncate md:whitespace-normal">
                {title}
              </span>
              <span className="block whitespace-nowrap text-[10px] text-gray-400 md:truncate md:whitespace-normal">
                {text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}
