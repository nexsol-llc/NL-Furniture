"use client";

import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard } from "./HomeUi";
import { useCompare, COMPARE_MAX, type CompareItem } from "@/providers/compareContext";
import { formatPrice, normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

export interface DealItem {
  _id: string;
  title: string;
  productLogo?: string;
  link?: string;
  price?: string;
  oldPrice?: string;
  saleValue?: string;
  brandName?: string;
  category?: string;
}

/** Right-rail deal list, fed by the admin's Top Angebote feed. */
export default function TopDealsRail({ deals }: { deals: DealItem[] }) {
  const { t } = useLanguage();

  return (
    <HomeCard className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 pb-2.5 pt-4">
        <h2 className="text-[15px] font-bold text-gray-900">{t("homeCompare.deals.title")}</h2>
        <Link
          href="/topaanbiedingen"
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("homeCompare.deals.viewAll")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {deals.length === 0 ? (
        <p className="px-4 pb-4 text-[11px] text-gray-400">{t("homeCompare.deals.empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {deals.map((deal) => (
            <DealRow key={deal._id} deal={deal} />
          ))}
        </ul>
      )}

      <div className="p-3 pt-2">
        <Link
          href="/topaanbiedingen"
          className="flex w-full items-center justify-center rounded-lg bg-primary-50 px-3 py-2 text-[11px] font-bold text-primary-700 transition-colors hover:bg-primary-100"
        >
          {t("homeCompare.deals.viewAll")}
        </Link>
      </div>
    </HomeCard>
  );
}

function DealRow({ deal }: { deal: DealItem }) {
  const { t } = useLanguage();
  const { has, toggle, isFull } = useCompare();

  const price = formatPrice(deal.price);
  const oldPrice = formatPrice(deal.oldPrice);
  const href = normalizeLink(deal.link);
  const selected = has(deal._id);
  const blocked = !selected && isFull;

  const compareItem: CompareItem = {
    id: deal._id,
    title: deal.title,
    image: deal.productLogo,
    price: deal.price,
    oldPrice: deal.oldPrice,
    brand: deal.brandName || deal.category,
    link: deal.link,
  };

  return (
    <li className="group flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-gray-50/70">
      <a
        href={href}
        {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-200"
      >
        <PlaceholderImage
          src={deal.productLogo}
          alt={deal.title}
          fill
          className="h-full w-full object-contain p-1"
          iconClassName="w-1/2 h-1/2"
        />
      </a>

      <div className="min-w-0 flex-1">
        <a
          href={href}
          {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="line-clamp-2 text-[11px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-700"
        >
          {deal.title}
        </a>
        {(deal.brandName || deal.category) && (
          <p className="truncate text-[9px] text-gray-400">{deal.brandName || deal.category}</p>
        )}
        <p className="mt-0.5 flex items-baseline gap-1">
          {price && <span className="text-[11px] font-bold text-primary-600">{price}</span>}
          {oldPrice && <span className="text-[9px] text-gray-400 line-through">{oldPrice}</span>}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {deal.saleValue && (
          <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold text-primary-700">
            {deal.saleValue}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggle(compareItem)}
          disabled={blocked}
          aria-pressed={selected}
          title={
            blocked
              ? t("homeCompare.compareTray.full", { max: COMPARE_MAX })
              : t("homeCompare.compareLabel")
          }
          aria-label={t("homeCompare.compareLabel")}
          className={`flex h-6 w-6 items-center justify-center rounded-full ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            selected
              ? "bg-primary-600 text-white ring-primary-600"
              : "bg-white text-gray-400 ring-gray-200 hover:text-primary-600 hover:ring-primary-300"
          }`}
        >
          <Scale className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
