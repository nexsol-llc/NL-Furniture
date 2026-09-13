"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Plus, Scale, Search, X } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { CompareModal } from "./CompareTray";
import { HomeCard } from "./HomeUi";
import {
  COMPARE_MAX,
  useCompare,
  type CompareItem,
} from "@/providers/compareContext";
import { formatPrice, priceDisplay, shopLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

type CatalogProduct = {
  _id: string;
  product_name?: string;
  brand_name?: string;
  merchant_name?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  aw_thumb_url?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  search_price?: number | string;
  discount_price?: number | string;
  display_price?: string;
};

const toCompareItem = (product: CatalogProduct): CompareItem => {
  const prices = priceDisplay(product);
  return {
    id: product._id,
    title: product.product_name || "",
    image: product.merchant_image_url || product.aw_image_url || product.aw_thumb_url,
    price: prices.price,
    oldPrice: prices.originalPrice,
    brand: product.brand_name || product.merchant_name,
    link: shopLink(product),
  };
};

/** Four-slot homepage product picker backed by the shared comparison context. */
export default function CompareProducts() {
  const { t } = useLanguage();
  const { slots, count, remove } = useCompare();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const canCompare = count >= 2;

  return (
    <>
      <HomeCard className="rounded-[20px] border-gray-200/90 p-5 shadow-soft sm:p-6">
        <div
          id="vergelijken"
          className="scroll-mt-[calc(var(--header-height)+1rem)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                {t("homeCompare.compareProducts.title")}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                {t("homeCompare.compareProducts.description", { max: COMPARE_MAX })}
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <button
                type="button"
                disabled={!canCompare}
                aria-describedby={!canCompare ? "compare-products-hint" : undefined}
                onClick={() => setComparisonOpen(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-cta transition-colors duration-200 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none sm:w-auto"
              >
                <Scale aria-hidden="true" className="h-3.5 w-3.5" />
                {t("homeCompare.compareProducts.compareNow")}
              </button>
              {!canCompare && (
                <p id="compare-products-hint" className="mt-1.5 text-[10px] text-gray-400">
                  {t("homeCompare.compareProducts.selectMinimum")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {slots.map((item, index) =>
              item ? (
                <SelectedProductSlot
                  key={item.id}
                  item={item}
                  removeLabel={t("homeCompare.compareProducts.removeProduct")}
                  onRemove={() => remove(item.id)}
                />
              ) : (
                <button
                  key={`empty-${index}`}
                  type="button"
                  aria-label={t("homeCompare.compareProducts.addProduct")}
                  onClick={() => setPickerOpen(true)}
                  className="group flex min-h-[156px] flex-col items-center justify-center rounded-[13px] border border-dashed border-primary-200 bg-primary-50/45 p-4 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-600 shadow-soft-sm transition-transform duration-200 group-hover:scale-105">
                    <Plus aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="mt-2.5 text-[11px] font-semibold">
                    {t("homeCompare.compareProducts.addProduct")}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </HomeCard>

      {pickerOpen && <ProductPicker onClose={() => setPickerOpen(false)} />}
      {comparisonOpen && <CompareModal onClose={() => setComparisonOpen(false)} />}
    </>
  );
}

function SelectedProductSlot({
  item,
  removeLabel,
  onRemove,
}: {
  item: CompareItem;
  removeLabel: string;
  onRemove: () => void;
}) {
  const price = formatPrice(item.price);

  return (
    <article className="relative flex min-h-[156px] min-w-0 items-center gap-3 rounded-[13px] border border-gray-200 bg-white p-3.5 shadow-soft-sm">
      <button
        type="button"
        aria-label={`${removeLabel}: ${item.title}`}
        title={removeLabel}
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>

      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-gray-50 ring-1 ring-gray-200/80">
        <PlaceholderImage
          src={item.image}
          alt={item.title}
          fill
          sizes="96px"
          className="h-full w-full object-contain p-2"
          iconClassName="h-8 w-8"
        />
      </div>

      <div className="min-w-0 flex-1 pr-3">
        <h3 className="line-clamp-2 text-[12px] font-semibold leading-4 text-gray-900">
          {item.title}
        </h3>
        {item.brand && <p className="mt-1 truncate text-[10px] text-gray-400">{item.brand}</p>}
        {price && <p className="mt-2 text-[13px] font-bold text-gray-900">{price}</p>}
      </div>
    </article>
  );
}

function ProductPicker({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { items, count, isFull, has, add } = useCompare();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchInput.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");

      try {
        const params = new URLSearchParams({ limit: "40" });
        if (query.trim()) params.set("search", query.trim());
        const response = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : { products: [] };
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setProducts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectProduct = (product: CatalogProduct) => {
    if (has(product._id)) {
      setMessage(t("homeCompare.compareProducts.alreadyAdded"));
      return;
    }
    if (isFull || count >= COMPARE_MAX) {
      setMessage(t("homeCompare.compareProducts.maximum", { max: COMPARE_MAX }));
      return;
    }

    add(toCompareItem(product));
    setMessage("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-picker-title"
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-gray-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-depth-4 sm:rounded-[20px]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <h2 id="product-picker-title" className="text-base font-bold text-gray-900">
            {t("homeCompare.compareProducts.searchProducts")}
          </h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-gray-100 p-4 sm:px-5">
          <label className="relative block">
            <span className="sr-only">{t("homeCompare.compareProducts.searchProducts")}</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInput}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("homeCompare.compareProducts.searchProducts")}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </label>
          {message && (
            <p role="status" aria-live="polite" className="mt-2 text-xs font-medium text-primary-700">
              {message}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center text-gray-400" role="status">
              <LoaderCircle aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-xs">{t("common.loading")}</span>
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {t("homeCompare.compareProducts.noProducts")}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {products.map((product) => {
                const item = toCompareItem(product);
                const selected = items.some((selectedItem) => selectedItem.id === item.id);
                const price = formatPrice(item.price);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectProduct(product)}
                      className={`flex w-full min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                        selected
                          ? "border-primary-300 bg-primary-50"
                          : "border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/40"
                      }`}
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-200/80">
                        <PlaceholderImage
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="h-full w-full object-contain p-1.5"
                          iconClassName="h-5 w-5"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[11px] font-semibold leading-4 text-gray-900">
                          {item.title}
                        </span>
                        {item.brand && (
                          <span className="mt-0.5 block truncate text-[9px] text-gray-400">
                            {item.brand}
                          </span>
                        )}
                        {price && (
                          <span className="mt-1 block text-[11px] font-bold text-gray-900">{price}</span>
                        )}
                      </span>
                      {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
