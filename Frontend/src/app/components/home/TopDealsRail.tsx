"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard } from "./HomeUi";
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
  rating?: number;
  ratingCount?: string | number;
}

const parsePrice = (value: unknown): number | null => {
  const normalized = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot >= 0 ? "." : "";
  const separatorIndex = normalized.lastIndexOf(decimalSeparator);
  const numeric = decimalSeparator
    ? `${normalized.slice(0, separatorIndex).replace(/[.,]/g, "")}.${normalized.slice(separatorIndex + 1)}`
    : normalized;
  const parsed = Number(numeric);

  return Number.isFinite(parsed) ? parsed : null;
};

const getDiscount = (deal: DealItem): number | null => {
  const explicitPercentage = deal.saleValue?.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (explicitPercentage) {
    const parsed = Number(explicitPercentage[1].replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100) return Math.round(parsed);
  }

  const currentPrice = parsePrice(deal.price);
  const previousPrice = parsePrice(deal.oldPrice);
  if (!currentPrice || !previousPrice || currentPrice >= previousPrice) return null;

  const calculated = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
  return calculated > 0 && calculated <= 100 ? calculated : null;
};

/** Clean three-item deal list for the fixed-width home-page right rail. */
export default function TopDealsRail({ deals }: { deals: DealItem[] }) {
  const { t } = useLanguage();
  const visibleDeals = deals.slice(0, 3);

  return (
    <HomeCard className="mt-2.5 overflow-hidden rounded-[15px] border-gray-200/90 shadow-[0_3px_14px_-8px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-3 px-3.5 pb-2.5 pt-3.5">
        <h2 className="text-[13px] font-bold text-gray-900">
          {t("homeCompare.deals.title")}
        </h2>
        <Link
          href="/topaanbiedingen"
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary-600 transition-colors duration-200 hover:text-primary-700"
        >
          {t("homeCompare.deals.viewAll")}
          <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </div>

      {visibleDeals.length === 0 ? (
        <p className="px-3.5 pb-4 text-[11px] text-gray-400">
          {t("homeCompare.deals.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 px-1.5 pb-1.5">
          {visibleDeals.map((deal) => (
            <DealRow key={deal._id} deal={deal} />
          ))}
        </ul>
      )}
    </HomeCard>
  );
}

function DealRow({ deal }: { deal: DealItem }) {
  const { t } = useLanguage();
  const price = formatPrice(deal.price);
  const oldPrice = formatPrice(deal.oldPrice);
  const href = normalizeLink(deal.link);
  const discount = getDiscount(deal);
  const rating =
    typeof deal.rating === "number" && Number.isFinite(deal.rating) && deal.rating > 0
      ? Math.min(deal.rating, 5)
      : null;

  return (
    <li>
      <a
        href={href}
        {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={t("homeCompare.deals.productAriaLabel", { product: deal.title })}
        className="group flex min-w-0 items-center gap-3 rounded-[10px] px-2 py-3 transition-colors duration-200 hover:bg-primary-50/60"
      >
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[9px] bg-gray-50 ring-1 ring-gray-200/80">
          <PlaceholderImage
            src={deal.productLogo}
            alt={deal.title}
            fill
            sizes="68px"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.035]"
            iconClassName="h-7 w-7"
          />
        </div>

        <div className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[10px] font-semibold leading-[1.3] text-gray-900 transition-colors duration-200 group-hover:text-primary-700">
            {deal.title}
          </span>

          {discount !== null && (
            <span className="mt-1 block text-[9px] font-semibold leading-none text-emerald-600">
              {t("homeCompare.deals.upToDiscount", { discount })}
            </span>
          )}

          {rating !== null && (
            <span
              className="mt-1 flex min-w-0 items-center gap-1 text-[9px] leading-none text-gray-500"
              aria-label={t("homeCompare.deals.ratingAriaLabel", { rating })}
            >
              <span aria-hidden="true" className="inline-flex shrink-0 gap-px">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Star
                    key={index}
                    className={`h-2.5 w-2.5 ${
                      index < Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </span>
              <span>{rating}</span>
              {deal.ratingCount !== undefined && deal.ratingCount !== "" && (
                <span>{t("homeCompare.ratingCount", { count: deal.ratingCount })}</span>
              )}
            </span>
          )}

          {(price || oldPrice) && (
            <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              {price && <span className="text-[12px] font-bold text-gray-900">{price}</span>}
              {oldPrice && (
                <span className="text-[9px] text-gray-400 line-through">{oldPrice}</span>
              )}
            </span>
          )}
        </div>
      </a>
    </li>
  );
}
