"use client";

// src/app/components/FurnitureListingPage.tsx
//
// Generic listing page for a group of Category Catalog entries — currently
// used for a Parent Category's page (`app/[parentslug]/page.tsx`), showing
// those categories in a horizontal scroll row at the top, each linking to its
// own page. Structurally mirrors CategoryListingPage (filters, infinite
// scroll, sponsored strip, SEO/FAQ section) since the two pages are meant to
// feel the same.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import CategoryLinkSlider from "@/app/components/CategoryLinkSlider";
import CategorySeoSections from "@/app/components/CategorySeoSections";
import TopsellerCarousel from "@/app/components/TopsellerCarousel";
import { X, Search, ChevronDown, Check } from "lucide-react";
import {
  fetchCatalogList,
  fetchParentCategories,
  type CategoryDef,
  type ParentCategoryDef,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";
import { shopLink, priceDisplay } from "@/lib/productFormat";
import { LOCALE_TAG } from "@/lib/languageDefaults";

type Product = {
  id: string;
  /** Merchant/affiliate target, resolved once here so the cards stay dumb. */
  link?: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  brand: string;
  is_sponsored?: boolean;
  deliveryCost?: string;
};

type RawProduct = {
  _id: string;
  slug?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  product_name?: string;
  display_price?: string;
  price?: string;
  search_price?: number;
  discount_price?: number;
  merchant_image_url?: string;
  aw_image_url?: string;
  image?: string;
  brand_name?: string;
  brand?: string;
  is_sponsored?: boolean;
  delivery_cost?: string;
};

const mapProduct = (item: RawProduct, t: (key: string) => string): Product => ({
  id: item._id,
  link: shopLink(item),
  name: item.product_name || t('common.unnamedProduct'),
  ...priceDisplay(item),
  image: item.merchant_image_url || item.aw_image_url || item.image || "",
  brand: item.brand_name || item.brand || t('common.unknownBrand'),
  is_sponsored: Boolean(item.is_sponsored),
  deliveryCost: item.delivery_cost || "",
});

// Every search term a category catalog entry can be matched by (name, slug,
// aliases, childCategory names/slugs/search terms) — same set the Backend uses
// to resolve a single category's products, just computed client-side here
// since the Furniture page has no single category_catalogs row of its own.
const termsForCategory = (cat: CategoryDef): string[] => {
  const terms = new Set<string>();
  if (cat.name) terms.add(cat.name);
  if (cat.slug) terms.add(cat.slug);
  for (const a of cat.aliases ?? []) terms.add(a);
  for (const s of cat.childCategories ?? []) {
    if (s.name) terms.add(s.name);
    if (s.slug) terms.add(s.slug);
    for (const t of s.searchTerms ?? []) terms.add(t);
  }
  return Array.from(terms);
};

type FurnitureSettings = {
  slug: string;
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  longContent: string;
  faqs: { question: string; answer: string }[];
};

type FurnitureListingPageProps = {
  settings: FurnitureSettings;
  // Decides which Category Catalog entries belong on this page — e.g.
  // `(c) => c.parentCategoryId === parent._id` for a Parent Category page.
  filterCategories: (cat: CategoryDef) => boolean;
  // Extra breadcrumb crumb between Home and the page title, so visitors can
  // navigate back to a page this one sits under.
  furnitureCrumb?: { label: string; href: string } | null;
};

export default function FurnitureListingPage({
  settings,
  filterCategories,
  furnitureCrumb,
}: FurnitureListingPageProps) {
  const { t, language } = useLanguage();
  const pageTitle = settings.pageTitle || t('listingPage.breadcrumbFurniture');

  const [furnitureCategories, setFurnitureCategories] = useState<CategoryDef[]>([]);
  // Needed to build each tile's canonical /<parentSlug>/<categorySlug> href.
  const [parentCategories, setParentCategories] = useState<ParentCategoryDef[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [catalog, parents] = await Promise.all([
        fetchCatalogList(),
        fetchParentCategories(),
      ]);
      if (cancelled) return;
      setFurnitureCategories(catalog.filter(filterCategories));
      setParentCategories(parents);
      setConfigLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategories]);

  // Selecting categories in the sidebar narrows the grid in place — it's
  // a multi-select filter, not a link to /<parent>/<category>.
  const [activeCategorySlugs, setActiveCategorySlugs] = useState<string[]>([]);

  const visibleCategories = furnitureCategories;

  // Drop selections that are no longer in view.
  useEffect(() => {
    setActiveCategorySlugs((prev) => {
      const next = prev.filter((slug) => visibleCategories.some((c) => c.slug === slug));
      return next.length === prev.length ? prev : next;
    });
  }, [visibleCategories]);

  const toggleActiveCategory = (slug: string) => {
    setActiveCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const scopedCategories = useMemo(
    () =>
      activeCategorySlugs.length > 0
        ? visibleCategories.filter((c) => activeCategorySlugs.includes(c.slug))
        : visibleCategories,
    [visibleCategories, activeCategorySlugs]
  );

  const activeSearchTerms = useMemo(() => {
    const terms = new Set<string>();
    for (const cat of scopedCategories) {
      for (const t of termsForCategory(cat)) terms.add(t);
    }
    return Array.from(terms);
  }, [scopedCategories]);

  const activeCategoryNames = scopedCategories.map((c) => c.name);
  const activeTitle =
    activeCategorySlugs.length === 1
      ? `${pageTitle} · ${activeCategoryNames[0]}`
      : activeCategorySlugs.length > 1
      ? `${pageTitle} · ${t('listingPage.categoriesCountSuffix', { count: activeCategorySlugs.length })}`
      : pageTitle;

  // Apply SEO headers dynamically.
  useEffect(() => {
    if (settings.seoTitle) document.title = settings.seoTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && settings.seoDescription) {
      metaDesc.setAttribute("content", settings.seoDescription);
    }
  }, [settings.seoTitle, settings.seoDescription]);

  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc">("popular");

  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [filtersReady, setFiltersReady] = useState(false);

  const [mobileFilterOpen, setMobileFilterOpen] = useState<null | "sort" | "price" | "brand">(null);
  const [brandSearch, setBrandSearch] = useState("");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const buildScopeParams = useCallback(() => {
    const p = new URLSearchParams();
    if (activeSearchTerms.length > 0) p.append("searchTerms", activeSearchTerms.join(","));
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearchTerms.join(",")]);

  const fetchProducts = async (pageNum: number, isInitial: boolean = false) => {
    // No categories configured (or none under the selected parent) — nothing
    // to fetch; an unscoped call would return the entire product catalog.
    if (activeSearchTerms.length === 0) {
      setProducts([]);
      setHasMore(false);
      setTotalCount(0);
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = buildScopeParams();
      params.append("page", pageNum.toString());
      params.append("limit", "20");
      params.append("sort", sort);
      if (selectedBrands.length > 0) params.append("brands", selectedBrands.join(","));
      if (onSaleOnly) params.append("onSale", "true");
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await fetch(`/api/products-by-category?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const raw = Array.isArray(data.products) ? data.products : [];
      const mapped: Product[] = raw.map((item: RawProduct) => mapProduct(item, t));

      if (isInitial) setProducts(mapped);
      else setProducts((prev) => [...prev, ...mapped]);

      setHasMore(pageNum < (data.pages || 1));
      setTotalCount(data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Parse filters from the URL once so a shared link auto-applies them.
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const s = qp.get("sort");
    setSort(s === "price-asc" || s === "price-desc" ? s : "popular");
    const mn = qp.get("minPrice") || "";
    const mx = qp.get("maxPrice") || "";
    setMinPrice(mn);
    setTempMinPrice(mn);
    setMaxPrice(mx);
    setTempMaxPrice(mx);
    setOnSaleOnly(qp.get("sale") === "1");
    setSelectedBrands((qp.get("brands") || "").split(",").filter(Boolean));
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady || !configLoaded) return;
    setPage(1);
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, configLoaded, sort, selectedBrands, onSaleOnly, minPrice, maxPrice, activeSearchTerms.join(",")]);

  // Persist active filters to the URL (no history spam, no reload).
  useEffect(() => {
    if (!filtersReady) return;
    const qp = new URLSearchParams();
    if (sort !== "popular") qp.set("sort", sort);
    if (minPrice) qp.set("minPrice", minPrice);
    if (maxPrice) qp.set("maxPrice", maxPrice);
    if (onSaleOnly) qp.set("sale", "1");
    if (selectedBrands.length > 0) qp.set("brands", selectedBrands.join(","));
    const qs = qp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, sort, minPrice, maxPrice, onSaleOnly, selectedBrands.join(",")]);

  useEffect(() => {
    if (page > 1) fetchProducts(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Featured "Gesponsert" strip — sponsored products within the current scope
  // (all furniture categories, or just the selected parent's).
  useEffect(() => {
    if (!configLoaded || activeSearchTerms.length === 0) {
      setFeaturedProducts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.append("searchTerms", activeSearchTerms.join(","));
        params.append("featured", "true");
        params.append("page", "1");
        params.append("limit", "20");
        const res = await fetch(`/api/products-by-category?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFeaturedProducts(
          (Array.isArray(data.products) ? data.products : []).map((item: RawProduct) => mapProduct(item, t))
        );
      } catch {
        /* strip is non-critical — ignore fetch errors */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoaded, activeSearchTerms.join(",")]);

  // Brand list for the Marken filter, scoped to the current view.
  useEffect(() => {
    if (!configLoaded || activeSearchTerms.length === 0) {
      setAvailableBrands([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = buildScopeParams();
        params.append("page", "1");
        params.append("limit", "1");
        const res = await fetch(`/api/products-by-category?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setAvailableBrands(Array.isArray(data.availableBrands) ? data.availableBrands : []);
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoaded, activeSearchTerms.join(",")]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const handlePriceApply = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setMobileFilterOpen(null);
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedBrands([]);
    setSort("popular");
    setBrandSearch("");
    setOnSaleOnly(false);
    setTempMinPrice("");
    setTempMaxPrice("");
    setMinPrice("");
    setMaxPrice("");
    setMobileFilterOpen(null);
    setPage(1);
  };

  const filteredBrandsList = availableBrands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase())).sort();

  const gridProducts = featuredProducts.length > 0 ? products.filter((p) => !p.is_sponsored) : products;

  return (
    <div className="min-h-screen section-bg-1 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-150 py-4">
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            <Link href="/" className="hover:text-black transition-colors">
              {t('listingPage.breadcrumbHome')}
            </Link>
            {furnitureCrumb && (
              <>
                <span className="text-gray-200">/</span>
                <Link href={furnitureCrumb.href} className="hover:text-black transition-colors">
                  {furnitureCrumb.label}
                </Link>
              </>
            )}
            <span className="text-gray-200">/</span>
            <span className="text-gray-900 font-bold">{pageTitle}</span>
          </nav>

          <p className="text-xs text-gray-400">
            {t('listingPage.affiliateNotice')}{" "}
            <Link href="/advertentieverklaring" className="underline underline-offset-2 hover:text-gray-600 transition-colors">
              {t('listingPage.learnMore')}
            </Link>
          </p>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
            <div className="min-w-0 flex flex-col gap-1.5 lg:w-[360px] lg:flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight uppercase break-words [overflow-wrap:anywhere]">
                {activeTitle}
              </h1>
              <div className="flex min-w-0 items-start gap-1.5 text-[12px] text-gray-500 font-bold uppercase tracking-wider">
                <svg className="w-4 h-4 text-gray-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span className="min-w-0 leading-snug">
                  {t('listingPage.productsFromPartners', { count: totalCount.toLocaleString(LOCALE_TAG[language]) })}
                </span>
              </div>
            </div>

            {/* Top horizontal slider — only this scrolls horizontally. Shows
                this page's own categories, each linking straight to its
                /[parentSlug]/[categorySlug] page (same interaction as the childCategory
                row on a normal category page). */}
            <div className="flex-1 min-w-0">
              {!configLoaded ? (
                <div className="relative w-full overflow-hidden">
                  <div className="flex items-stretch gap-3 py-2 px-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 flex items-center gap-3.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-soft min-w-[170px] sm:min-w-[190px]">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg skeleton flex-shrink-0" />
                        <div className="h-3.5 w-24 rounded skeleton" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <CategoryLinkSlider categories={furnitureCategories} parents={parentCategories} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex lg:hidden overflow-x-auto gap-2 py-3 hide-scrollbar select-none -mx-4 px-4">
              <button
                onClick={() => setMobileFilterOpen("sort")}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  sort !== "popular" ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                <span>{t('listingPage.sortHeading')}</span>
                <ChevronDown size={12} />
              </button>

              <button
                onClick={() => setMobileFilterOpen("price")}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  minPrice || maxPrice ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                <span>{minPrice || maxPrice ? t('listingPage.priceRangePillLabel', { min: minPrice || "0", max: maxPrice || "∞" }) : t('listingPage.priceRangeHeading')}</span>
                <ChevronDown size={12} />
              </button>

              <button
                onClick={() => setMobileFilterOpen("brand")}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedBrands.length > 0 ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                <span>{selectedBrands.length > 0 ? t('listingPage.brandsCountLabel', { count: selectedBrands.length }) : t('listingPage.brandsHeading')}</span>
                <ChevronDown size={12} />
              </button>

              <button
                onClick={() => setOnSaleOnly(!onSaleOnly)}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  onSaleOnly ? "border-red-600 bg-red-600 text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                <span>{t('listingPage.offers')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-content px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block h-full max-h-[calc(100vh-160px)] overflow-y-auto sticky top-24 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="glass-panel p-6 rounded-2xl shadow-depth-2 space-y-6 h-full">
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  {t('listingPage.sortHeading')}
                  <ChevronDown size={14} className="text-gray-500" />
                </h3>
                <div className="space-y-3">
                  {[
                    { value: "popular", label: t('listingPage.sortPopular') },
                    { value: "price-asc", label: t('listingPage.sortPriceAsc') },
                    { value: "price-desc", label: t('listingPage.sortPriceDesc') },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`h-[16px] w-[16px] rounded-full border flex items-center justify-center transition-all ${
                          sort === opt.value ? "bg-black border-black" : "border-gray-400 group-hover:border-gray-900"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sort"
                          value={opt.value}
                          checked={sort === opt.value}
                          onChange={() => setSort(opt.value as typeof sort)}
                          className="hidden"
                        />
                        {sort === opt.value && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${sort === opt.value ? "text-gray-900 font-extrabold" : "text-gray-500 group-hover:text-black"}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {!configLoaded ? (
                <div className="border-b border-gray-100 pb-5">
                  <div className="h-3.5 w-32 rounded skeleton mb-4" />
                  <div className="space-y-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-3 rounded skeleton" style={{ width: `${75 - i * 6}%` }} />
                    ))}
                  </div>
                </div>
              ) : visibleCategories.length > 0 ? (
                <div className="border-b border-gray-100 pb-5">
                  <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                    {t('listingPage.categoriesHeading')}
                    <ChevronDown size={14} className="text-gray-500" />
                  </h3>
                  <div className="space-y-2">
                    {visibleCategories.map((cat) => {
                      const isActive = activeCategorySlugs.includes(cat.slug);
                      return (
                        <label key={cat.slug} className="group flex cursor-pointer items-center gap-3 py-0.5">
                          <div
                            className={`h-[16px] w-[16px] rounded-[3px] border flex items-center justify-center transition-all flex-shrink-0 ${
                              isActive ? "bg-black border-black" : "border-gray-400 group-hover:border-gray-900"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {
                                toggleActiveCategory(cat.slug);
                                setPage(1);
                              }}
                              className="hidden"
                            />
                            {isActive && <div className="h-2 w-2 bg-white rounded-[1px]" />}
                          </div>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isActive ? "font-bold text-gray-900" : "text-gray-500 group-hover:text-black"
                            }`}
                          >
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  {t('listingPage.priceRangeHeading')}
                  <ChevronDown size={14} className="text-gray-500" />
                </h3>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-xs">€</span>
                    <input
                      type="number"
                      placeholder={t('listingPage.minPlaceholder')}
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg py-1.5 pl-6 pr-1 text-xs focus:border-primary-500 outline-none transition-colors"
                    />
                  </div>
                  <span className="text-gray-400 text-xs">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-xs">€</span>
                    <input
                      type="number"
                      placeholder={t('listingPage.maxPlaceholder')}
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg py-1.5 pl-6 pr-1 text-xs focus:border-primary-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <button onClick={handlePriceApply} className="w-full py-2 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-cta hover:bg-primary-700 transition-colors">
                  {t('listingPage.apply')}
                </button>
              </div>

              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  {t('listingPage.offers')}
                  <ChevronDown size={14} className="text-gray-500" />
                </h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`h-[16px] w-[16px] rounded-[3px] border flex items-center justify-center transition-all ${
                      onSaleOnly ? "bg-black border-black" : "border-gray-400 group-hover:border-gray-900"
                    }`}
                  >
                    <input type="checkbox" checked={onSaleOnly} onChange={() => setOnSaleOnly(!onSaleOnly)} className="hidden" />
                    {onSaleOnly && <div className="h-2.5 w-2.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 group-hover:text-black uppercase tracking-wider">{t('listingPage.onSaleOnly')}</span>
                </label>
              </div>

              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  {t('listingPage.brandsHeading')}
                  <ChevronDown size={14} className="text-gray-500" />
                </h3>
                <div className="relative mb-3">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('listingPage.brandSearchPlaceholder')}
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-1.5 pl-3 pr-8 text-xs focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div className="max-h-[180px] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredBrandsList.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);
                    return (
                      <label key={brand} className="group flex cursor-pointer items-center justify-between py-0.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-[16px] w-[16px] rounded-[3px] border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected ? "bg-black border-black" : "border-gray-400 group-hover:border-gray-900"
                            }`}
                          >
                            <input type="checkbox" checked={isSelected} onChange={() => toggleBrand(brand)} className="hidden" />
                            {isSelected && <div className="h-2 w-2 bg-white rounded-[1px]" />}
                          </div>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? "font-bold text-gray-900" : "text-gray-500"}`}>{brand}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button onClick={resetFilters} className="w-full py-2 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-gray-200 transition-colors">
                {t('listingPage.resetFilters')}
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          {/* min-w-0: without it a wide flex child (the sponsored carousel)
              stretches this column past the viewport instead of scrolling
              within its own overflow-x-auto. */}
          <div className="min-w-0 flex-grow">
            {featuredProducts.length > 0 && <TopsellerCarousel products={featuredProducts} />}

            {configLoaded && furnitureCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200/80 shadow-soft p-8">
                <X size={36} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{t('listingPage.noCategoriesHeading')}</h2>
                <p className="mt-2 text-xs text-gray-500 font-medium max-w-xs">
                  {t('listingPage.noCategoriesText')}
                </p>
              </div>
            ) : loading && page === 1 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-square bg-gray-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-2 w-1/4 bg-gray-200 rounded" />
                      <div className="h-4 w-full bg-gray-200 rounded" />
                      <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200/80 shadow-soft p-8">
                <X size={36} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{t('listingPage.noResultsHeading')}</h2>
                <p className="mt-2 text-xs text-gray-500 font-medium max-w-xs">{t('listingPage.noResultsText')}</p>
                <button onClick={resetFilters} className="mt-6 bg-primary-600 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-cta hover:bg-primary-700 transition-colors">
                  {t('listingPage.resetFilters')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                  {gridProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} ref={index === gridProducts.length - 1 ? lastProductRef : null}>
                      <ProductCard
                        id={product.id}
                        link={product.link}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        image={product.image}
                        brand={product.brand}
                        is_sponsored={product.is_sponsored}
                        deliveryCost={product.deliveryCost}
                      />
                    </div>
                  ))}
                </div>

                {loadingMore && (
                  <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-4">
                        <div className="aspect-square bg-gray-200 rounded-xl" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="mt-16 border-t border-gray-200/80 py-8 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">{t('listingPage.endOfResults', { count: totalCount })}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CategorySeoSections title={activeTitle} description={settings.longContent} faqs={settings.faqs} loading={!configLoaded} />

      {/* Mobile Bottom Sheets */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[300] flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity" onClick={() => setMobileFilterOpen(null)} />
          <div className="relative mt-auto w-full bg-white rounded-t-2xl shadow-soft-lg p-6 z-[301] max-h-[85vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <h2 className="text-md font-bold uppercase tracking-wider text-gray-900">
                  {mobileFilterOpen === "sort" && t('listingPage.sortHeading')}
                  {mobileFilterOpen === "price" && t('listingPage.priceRangeHeading')}
                  {mobileFilterOpen === "brand" && t('listingPage.brandsFilterMobileHeading')}
                </h2>
                <button onClick={() => setMobileFilterOpen(null)} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {mobileFilterOpen === "sort" && (
                <div className="space-y-4">
                  {[
                    { value: "popular", label: t('listingPage.sortPopular') },
                    { value: "price-asc", label: t('listingPage.sortPriceAsc') },
                    { value: "price-desc", label: t('listingPage.sortPriceDesc') },
                  ].map((opt) => {
                    const isChecked = sort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value as typeof sort);
                          setMobileFilterOpen(null);
                        }}
                        className={`flex items-center justify-between w-full py-3 px-4 border rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                          isChecked ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isChecked && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {mobileFilterOpen === "price" && (
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900 font-extrabold text-xs">€</span>
                      <input
                        type="number"
                        placeholder={t('listingPage.minPricePlaceholder')}
                        value={tempMinPrice}
                        onChange={(e) => setTempMinPrice(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-2 text-xs focus:border-black outline-none transition-colors"
                      />
                    </div>
                    <span className="text-gray-400 font-bold">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900 font-extrabold text-xs">€</span>
                      <input
                        type="number"
                        placeholder={t('listingPage.maxPricePlaceholder')}
                        value={tempMaxPrice}
                        onChange={(e) => setTempMaxPrice(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-2 text-xs focus:border-black outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setTempMinPrice("");
                        setTempMaxPrice("");
                        setMinPrice("");
                        setMaxPrice("");
                        setMobileFilterOpen(null);
                      }}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      {t('listingPage.clear')}
                    </button>
                    <button onClick={handlePriceApply} className="flex-1 py-3 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-cta hover:bg-primary-700 transition-colors">
                      {t('listingPage.apply')}
                    </button>
                  </div>
                </div>
              )}

              {mobileFilterOpen === "brand" && (
                <div>
                  <div className="relative mb-4">
                    <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('listingPage.brandSearchPlaceholderMobile')}
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-xs focus:border-black outline-none transition-all"
                    />
                  </div>

                  <div className="max-h-[35vh] space-y-2.5 overflow-y-auto pr-1">
                    {filteredBrandsList.map((brand) => {
                      const isSelected = selectedBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`flex items-center justify-between w-full py-2.5 px-4 border rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                            isSelected ? "border-black bg-[#FAF8F5] text-gray-950 font-black" : "border-gray-150 bg-white text-gray-500"
                          }`}
                        >
                          <span>{brand}</span>
                          <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition-all ${isSelected ? "bg-black border-black text-white" : "border-gray-300"}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSelectedBrands([]);
                        setMobileFilterOpen(null);
                      }}
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      {t('listingPage.clearAll')}
                    </button>
                    <button onClick={() => setMobileFilterOpen(null)} className="flex-1 py-3.5 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-cta hover:bg-primary-700 transition-colors">
                      {t('listingPage.apply')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
