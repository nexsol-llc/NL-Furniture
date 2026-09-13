"use client";

import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { AdChip, HomeCard, Rail, SectionHeader } from "./HomeUi";
import PlaceholderImage from "../PlaceholderImage";
import { normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

export interface RailProduct {
  _id: string;
  title: string;
  image?: string;
  link?: string;
  price?: string;
  oldPrice?: string;
  saleValue?: string;
  brandName?: string;
  /**
   * Only rendered when the feed actually carries one. Nothing in the catalog
   * stores ratings today, so most products fall back to the brand line rather
   * than showing an invented score.
   */
  rating?: number;
  ratingCount?: string;
}

/** Product carousel — used for both the best sellers and the sponsored picks. */
export default function ProductRail({
  title,
  href,
  linkLabel,
  products,
  sponsored = false,
  emptyLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
  products: RailProduct[];
  /** Marks every card with the "Sponsored" chip. */
  sponsored?: boolean;
  emptyLabel: string;
}) {
  const { t } = useLanguage();

  return (
    <HomeCard className="p-4">
      <SectionHeader title={title} href={href} linkLabel={linkLabel} className="mb-3.5" />

      {products.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">{emptyLabel}</p>
      ) : (
        <Rail
          prevLabel={t("homeCompare.brands.prev")}
          nextLabel={t("homeCompare.brands.next")}
          contentClassName="gap-4 pb-2"
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} sponsored={sponsored} />
          ))}
        </Rail>
      )}
    </HomeCard>
  );
}

function ProductCard({ product, sponsored }: { product: RailProduct; sponsored: boolean }) {
  const { t } = useLanguage();
  const [favourite, setFavourite] = useState(false);

  const price = formatEuroPrice(product.price);
  const oldPrice = formatEuroPrice(product.oldPrice);
  const href = normalizeLink(product.link);
  return (
    <article className="group flex w-[76vw] max-w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-gray-200/90 bg-white shadow-[0_4px_16px_-12px_rgba(15,23,42,0.22)] transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.3)] sm:w-[210px] lg:w-[220px] 2xl:w-[calc((100%-4rem)/5)] 2xl:max-w-none">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-gray-50">
        <a
          href={href}
          {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="absolute inset-0 block"
        >
          <PlaceholderImage
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 220px, (min-width: 640px) 210px, 76vw"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            iconClassName="w-1/4 h-1/4"
          />
        </a>

        <button
          type="button"
          onClick={() => setFavourite((current) => !current)}
          aria-pressed={favourite}
          aria-label={t("header.wishlistTitle")}
          className={`absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-soft-sm ring-1 transition-all duration-200 hover:scale-105 ${
            favourite
              ? "bg-primary-600 text-white ring-primary-600"
              : "bg-white/90 text-gray-500 ring-white/80 hover:text-primary-600"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${favourite ? "fill-current" : ""}`} />
        </button>

        {sponsored && (
          <AdChip label={t("homeCompare.sponsoredLabel")} className="absolute left-2 top-2" />
        )}
        {product.saleValue && (
          <span className="absolute bottom-2 left-2 rounded-md bg-primary-600 px-2 py-1 text-[9px] font-bold text-white shadow-soft-sm">
            {product.saleValue}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <a
          href={href}
          {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="line-clamp-2 text-[12px] font-semibold leading-4 text-gray-900 transition-colors duration-200 hover:text-primary-700"
        >
          {product.title}
        </a>

        {product.brandName && (
          <span className="mt-0.5 truncate text-[10px] text-gray-400">{product.brandName}</span>
        )}

        {typeof product.rating === "number" && (
          <span className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex gap-0.5" aria-label={`${product.rating} / 5`}>
              {[0, 1, 2, 3, 4].map((index) => (
                <Star
                  key={index}
                  className={`h-3 w-3 ${index < Math.round(product.rating!) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
                />
              ))}
            </span>
            {product.ratingCount && (
              <span className="text-[9px] text-gray-400">
                {t("homeCompare.ratingCount", { count: product.ratingCount })}
              </span>
            )}
          </span>
        )}

        <div className="mt-auto flex items-end gap-2 pt-2">
          <p className="min-w-0 flex flex-wrap items-baseline gap-x-1.5">
            {price && <span className="text-[13px] font-extrabold text-gray-900">{price}</span>}
            {oldPrice && <span className="text-[9px] text-gray-400 line-through">{oldPrice}</span>}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Parse the feed's common price shapes and display Dutch Euro currency. */
function formatEuroPrice(raw: unknown): string {
  const source = String(raw ?? "").trim();
  if (!source) return "";

  let numeric = source.replace(/[^\d,.-]/g, "");
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");

  if (lastComma > lastDot) {
    numeric = numeric.replace(/\./g, "").replace(",", ".");
  } else {
    numeric = numeric.replace(/,/g, "");
  }

  const amount = Number(numeric);
  if (!Number.isFinite(amount)) return source;

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
