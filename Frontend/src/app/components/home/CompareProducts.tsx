"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Coins,
  Heart,
  Info,
  List,
  LoaderCircle,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { CompareModal } from "./CompareTray";
import { HomeCard } from "./HomeUi";
import {
  COMPARE_MAX,
  useCompare,
  type CompareItem,
} from "@/providers/compareContext";
import {
  DEFAULT_COMPARE_SECTION,
  type CompareSectionSettings,
} from "@/lib/compareSection";
import { formatPrice, priceDisplay, shopLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

type Icon = LucideIcon;

const HIGHLIGHTS: { key: string; icon: Icon }[] = [
  { key: "prices", icon: Tag },
  { key: "features", icon: List },
  { key: "reviews", icon: Star },
  { key: "warranty", icon: ShieldCheck },
];

/** Floating chips either side of the VS badge — decorative, over the photo. */
const BADGES_LEFT: { key: string; icon: Icon }[] = [
  { key: "price", icon: Coins },
  { key: "features", icon: List },
  { key: "reviews", icon: Star },
];
const BADGES_RIGHT: { key: string; icon: Icon }[] = [
  { key: "shipping", icon: Truck },
  { key: "warranty", icon: ShieldCheck },
  { key: "popular", icon: Heart },
];

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

/**
 * Four-slot homepage product picker backed by the shared comparison context.
 * The header pairs the copy with an admin-set photo (Admin → Home Page
 * Settings) that fades into the card on its left edge; without one the copy
 * spans the full width. The admin preview mirrors this geometry.
 */
export default function CompareProducts({
  settings = DEFAULT_COMPARE_SECTION,
}: {
  settings?: CompareSectionSettings;
}) {
  const { t } = useLanguage();
  const { slots, count, remove } = useCompare();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  // Keyed by src so a newly configured image gets a fresh chance to load.
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const canCompare = count >= 2;

  const image = settings.backgroundImage;
  const hasImage = image !== "" && failedImage !== image;

  return (
    <>
      <HomeCard className="overflow-hidden rounded-[20px] border-gray-200/90 shadow-soft">
        <div
          id="vergelijken"
          className="scroll-mt-[calc(var(--header-height)+1rem)]"
        >
          <div className="relative lg:min-h-[320px]">
            {hasImage && (
              <CompareBackdrop
                image={image}
                showBadges={settings.showBadges}
                onError={() => setFailedImage(image)}
              />
            )}

            <div
              className={`relative z-10 px-5 pb-6 pt-6 sm:px-7 sm:pt-8 ${
                hasImage ? "lg:w-1/2 lg:pr-0" : ""
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 sm:text-[11px]">
                {t("homeCompare.compareProducts.eyebrowLead")}{" "}
                <span className="text-primary-600">
                  {t("homeCompare.compareProducts.eyebrowAccent")}
                </span>
              </p>
              <h2 className="mt-2 max-w-[440px] text-[1.625rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-gray-900 sm:text-[2rem] xl:text-[2.25rem]">
                {t("homeCompare.compareProducts.title")}
              </h2>
              <p className="mt-3 max-w-[460px] text-[13px] leading-relaxed text-gray-500 sm:text-sm">
                {t("homeCompare.compareProducts.description", { max: COMPARE_MAX })}
              </p>

              <ul
                className={`mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 ${
                  hasImage ? "lg:grid-cols-2 lg:max-w-[400px]" : ""
                }`}
              >
                {HIGHLIGHTS.map(({ key, icon: Icon }) => (
                  <li key={key} className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold text-gray-900">
                        {t(`homeCompare.compareProducts.highlights.${key}.title`)}
                      </span>
                      <span className="block truncate text-[10px] text-gray-500 sm:text-[11px]">
                        {t(`homeCompare.compareProducts.highlights.${key}.text`)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-3 px-5 sm:grid-cols-2 sm:px-7 xl:grid-cols-4">
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
                  className="group flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300/80 bg-white/90 p-4 text-gray-500 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:min-h-[168px]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary-600 shadow-soft-md ring-1 ring-gray-200/80 transition-transform duration-200 group-hover:scale-105 group-hover:ring-primary-200">
                    <Plus aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="mt-3 text-[13px] font-semibold">
                    {t("homeCompare.compareProducts.addProduct")}
                  </span>
                </button>
              )
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 px-5 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-6">
            <p
              id="compare-products-hint"
              aria-live="polite"
              className="flex items-center gap-2 text-[12px] text-gray-500 sm:text-[13px]"
            >
              <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
              {canCompare
                ? t("homeCompare.compareProducts.selectedCount", { count, max: COMPARE_MAX })
                : t("homeCompare.compareProducts.selectMinimum")}
            </p>
            <button
              type="button"
              disabled={!canCompare}
              aria-describedby="compare-products-hint"
              onClick={() => setComparisonOpen(true)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-cta transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
            >
              <Scale aria-hidden="true" className="h-4 w-4" />
              {t("homeCompare.compareProducts.compareNow")}
            </button>
          </div>
        </div>
      </HomeCard>

      {pickerOpen && <ProductPicker onClose={() => setPickerOpen(false)} />}
      {comparisonOpen && <CompareModal onClose={() => setComparisonOpen(false)} />}
    </>
  );
}

/**
 * The admin photo: a full-width band above the copy on small screens, the
 * right 56% of the header from `lg` up. White fades melt its edges into the
 * card, and the optional badges float over it.
 */
function CompareBackdrop({
  image,
  showBadges,
  onError,
}: {
  image: string;
  showBadges: boolean;
  onError: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="relative h-52 sm:h-64 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[56%]">
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={onError}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-white via-white/70 to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent lg:h-16"
      />

      {showBadges && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-sm font-extrabold tracking-wide text-white shadow-cta ring-4 ring-white/70 sm:h-14 sm:w-14 sm:text-base">
            {t("homeCompare.compareProducts.vs")}
          </span>
          <BadgeColumn badges={BADGES_LEFT} className="left-[16%] items-start" />
          <BadgeColumn badges={BADGES_RIGHT} className="right-[4%] items-end" />
        </div>
      )}
    </div>
  );
}

function BadgeColumn({
  badges,
  className,
}: {
  badges: { key: string; icon: Icon }[];
  className: string;
}) {
  const { t } = useLanguage();

  return (
    <ul
      className={`absolute top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex ${className}`}
    >
      {badges.map(({ key, icon: Icon }) => (
        <li
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-gray-800 shadow-soft-md ring-1 ring-white backdrop-blur-sm xl:text-[11px]"
        >
          <Icon aria-hidden className="h-3.5 w-3.5 text-primary-600" />
          {t(`homeCompare.compareProducts.badges.${key}`)}
        </li>
      ))}
    </ul>
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
