"use client";

import { AdChip, HomeCard, Rail, SectionHeader, StarRating } from "./HomeUi";
import PlaceholderImage from "../PlaceholderImage";
import { useCompare, COMPARE_MAX, type CompareItem } from "@/providers/compareContext";
import { formatPrice, normalizeLink } from "@/lib/productFormat";
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
          contentClassName="pb-1"
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
  const { has, toggle, isFull } = useCompare();

  const price = formatPrice(product.price);
  const oldPrice = formatPrice(product.oldPrice);
  const href = normalizeLink(product.link);
  const selected = has(product._id);
  const blocked = !selected && isFull;

  const compareItem: CompareItem = {
    id: product._id,
    title: product.title,
    image: product.image,
    price: product.price,
    oldPrice: product.oldPrice,
    brand: product.brandName,
    link: product.link,
  };

  return (
    <article className="flex w-[160px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-depth-3 hover:ring-primary-300 sm:w-[176px]">
      <a
        href={href}
        {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="relative block aspect-square bg-gray-50"
      >
        <PlaceholderImage
          src={product.image}
          alt={product.title}
          fill
          className="h-full w-full object-contain p-3"
          iconClassName="w-1/4 h-1/4"
        />
        {sponsored && (
          <AdChip label={t("homeCompare.sponsoredLabel")} className="absolute left-2 top-2" />
        )}
        {product.saleValue && (
          <span className="absolute right-2 top-2 rounded-md bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-soft-sm">
            {product.saleValue}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <a
          href={href}
          {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="line-clamp-1 text-[11px] font-semibold text-gray-900 transition-colors hover:text-primary-700"
        >
          {product.title}
        </a>

        {typeof product.rating === "number" ? (
          <span className="flex items-center gap-1">
            <StarRating rating={product.rating} />
            {product.ratingCount && (
              <span className="text-[9px] text-gray-400">
                {t("homeCompare.ratingCount", { count: product.ratingCount })}
              </span>
            )}
          </span>
        ) : (
          product.brandName && (
            <span className="truncate text-[9px] text-gray-400">{product.brandName}</span>
          )
        )}

        <p className="mt-auto flex items-baseline gap-1.5 pt-0.5">
          {price && <span className="text-xs font-bold text-primary-600">{price}</span>}
          {oldPrice && <span className="text-[10px] text-gray-400 line-through">{oldPrice}</span>}
        </p>
      </div>

      <label
        className={`flex items-center gap-1.5 border-t border-gray-100 px-2.5 py-2 text-[10px] font-semibold transition-colors ${
          blocked
            ? "cursor-not-allowed text-gray-300"
            : "cursor-pointer text-gray-500 hover:text-primary-700"
        }`}
        title={blocked ? t("homeCompare.compareTray.full", { max: COMPARE_MAX }) : undefined}
      >
        <input
          type="checkbox"
          checked={selected}
          disabled={blocked}
          onChange={() => toggle(compareItem)}
          className="h-3 w-3 rounded border-gray-300 text-primary-600 accent-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
        />
        {t("homeCompare.compareLabel")}
      </label>
    </article>
  );
}
