"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Check,
} from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import TopsellerCarousel from "@/app/components/TopsellerCarousel";
import { Reveal } from "@/app/components/motion/Reveal";
import { useLanguage } from "@/providers/languageContext";

// Raw product shape returned by /api/brands/:slug/products
interface RawProduct {
  _id: string;
  slug?: string;
  product_name?: string;
  aw_image_url?: string;
  merchant_image_url?: string;
  aw_thumb_url?: string;
  image?: string;
  search_price?: number;
  display_price?: string;
  price?: string;
  brand_name?: string;
  brand?: string;
  is_sponsored?: boolean;
  delivery_cost?: string;
}

// Normalized shape consumed by the shared ProductCard / TopsellerCarousel
type Product = {
  id: string;
  slug?: string;
  name: string;
  price: string;
  image: string;
  brand: string;
  is_sponsored?: boolean;
  deliveryCost?: string;
};

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  verifiedCoupons?: string;
  avgSavings?: string;
  totalOffers?: string;
  lastUpdated?: string;
}

type SortOption = "popular" | "price-asc" | "price-desc";

// Map a raw API product to the shape the shared card components expect.
// Mirrors the mapping used on the category listing page so both look identical.
const mapProduct = (item: RawProduct, t: (key: string) => string): Product => ({
  id: item._id,
  slug: item.slug || "",
  name: item.product_name || t('common.unnamedProduct'),
  price:
    item.display_price ||
    item.price ||
    (item.search_price && item.search_price > 0 ? String(item.search_price) : "0"),
  image:
    item.merchant_image_url || item.aw_image_url || item.aw_thumb_url || item.image || "",
  brand: item.brand_name || item.brand || "",
  is_sponsored: Boolean(item.is_sponsored),
  deliveryCost: item.delivery_cost || "",
});

export default function BrandProductsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t } = useLanguage();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  // Sponsored/featured products for the "Topseller" strip (page 1 only).
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortOption>("popular");
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  // Mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState<
    null | "sort" | "price" | "category"
  >(null);

  // URL sync: don't fetch/write until the initial filters are parsed from the URL.
  const [filtersReady, setFiltersReady] = useState(false);
  const prevFilterKey = useRef<string | null>(null);

  const fetchBrandProducts = async (pageNum: number) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.append("page", pageNum.toString());
      qs.append("limit", "24");
      qs.append("sort", sort);
      if (onSaleOnly) qs.append("onSale", "true");
      if (minPrice) qs.append("minPrice", minPrice);
      if (maxPrice) qs.append("maxPrice", maxPrice);
      if (selectedCategories.length > 0) qs.append("categories", selectedCategories.join(","));

      const res = await fetch(`/api/brands/${slug}/products?${qs.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('brandDetailPage.brandNotFoundError'));
        setLoading(false);
        return;
      }

      const mapped: Product[] = (Array.isArray(data.products) ? data.products : []).map(
        (item: RawProduct) => mapProduct(item, t)
      );

      setBrand(data.brand);
      setProducts(mapped);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(pageNum);

      // Keep the category list stable (backend returns it brand-scoped only).
      if (Array.isArray(data.availableCategories) && data.availableCategories.length > 0) {
        setAvailableCategories(data.availableCategories);
      }
    } catch {
      setError(t('brandDetailPage.loadProductsFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Parse filters + page from the URL once (and again if the brand slug changes)
  // so a shared link reproduces the exact view.
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
    setSelectedCategories((qp.get("categories") || "").split(",").filter(Boolean));
    setPage(Math.max(Number(qp.get("page")) || 1, 1));
    prevFilterKey.current = null; // treat the next fetch as an initial load (honor the URL page)
    setFiltersReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Signature of the active filters; a change means "jump back to page 1".
  const filterKey = `${sort}|${minPrice}|${maxPrice}|${onSaleOnly}|${selectedCategories
    .slice()
    .sort()
    .join(",")}`;

  // Single fetch driver: refetch on filter/page change. On a filter change (not
  // the initial load) reset to page 1; pagination changes fetch the chosen page.
  useEffect(() => {
    if (!slug || !filtersReady) return;
    if (prevFilterKey.current !== null && prevFilterKey.current !== filterKey && page !== 1) {
      setPage(1); // re-triggers this effect with page = 1
      return;
    }
    prevFilterKey.current = filterKey;
    fetchBrandProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filtersReady, filterKey, page]);

  // Persist the current filters + page to the URL (no history spam, no reload).
  useEffect(() => {
    if (!filtersReady) return;
    const qp = new URLSearchParams();
    if (sort !== "popular") qp.set("sort", sort);
    if (minPrice) qp.set("minPrice", minPrice);
    if (maxPrice) qp.set("maxPrice", maxPrice);
    if (onSaleOnly) qp.set("sale", "1");
    if (selectedCategories.length > 0) qp.set("categories", selectedCategories.join(","));
    if (page > 1) qp.set("page", String(page));
    const qs = qp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, sort, minPrice, maxPrice, onSaleOnly, selectedCategories.join(","), page]);

  // The featured strip always shows the brand's sponsored products, independent
  // of the active filters — so fetch them once per brand (unfiltered).
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/brands/${slug}/products?page=1&limit=24`);
        if (!res.ok) return;
        const data = await res.json();
        const sponsored: Product[] = (Array.isArray(data.products) ? data.products : [])
          .map((item: RawProduct) => mapProduct(item, t))
          .filter((p: Product) => p.is_sponsored);
        if (!cancelled) setFeaturedProducts(sponsored);
      } catch {
        /* strip is non-critical — ignore fetch errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePriceApply = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setMobileFilterOpen(null);
  };

  const resetFilters = () => {
    setSort("popular");
    setSelectedCategories([]);
    setCategorySearch("");
    setOnSaleOnly(false);
    setTempMinPrice("");
    setTempMaxPrice("");
    setMinPrice("");
    setMaxPrice("");
    setMobileFilterOpen(null);
  };

  // Change page (the fetch effect does the actual request). Scrolls to top.
  const goToPage = (n: number) => {
    const target = Math.min(Math.max(n, 1), totalPages);
    if (target === page) return;
    setPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCategoryList = availableCategories
    .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort();

  // The Topseller strip always shows the brand's sponsored products (independent
  // of filters) at the top of the first page.
  const showFeaturedStrip = page === 1 && featuredProducts.length > 0;

  // Sponsored products live in the strip, so keep them out of the grid to avoid
  // showing them twice whenever the strip is visible.
  const gridProducts = showFeaturedStrip
    ? products.filter((p) => !p.is_sponsored)
    : products;

  /* ---- ERROR ---- */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-gray-800">{error}</h1>
        <p className="text-gray-500">{t('brandDetailPage.brandNotFoundText')}</p>
        <Link
          href="/merken"
          className="mt-4 flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-700 transition"
        >
          <ArrowLeft size={16} />
          {t('brandDetailPage.backToAllBrands')}
        </Link>
      </div>
    );
  }

  // Fallback for instant render of the header
  const safeBrand = brand || { name: slug, logo: "" };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "popular", label: t('listingPage.sortPopular') },
    { value: "price-asc", label: t('listingPage.sortPriceAsc') },
    { value: "price-desc", label: t('listingPage.sortPriceDesc') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── BRAND HEADER ─── */}
      <div className="bg-white border-b shadow-soft">
        <div className="max-w-content mx-auto px-4 py-6">
          {/* Back link */}
          <Link
            href="/merken"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition mb-5"
          >
            <ArrowLeft size={15} />
            {t('brandDetailPage.allBrands')}
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo */}
            <div className="w-24 h-24 flex-shrink-0 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
              {safeBrand?.logo ? (
                <Image
                  src={safeBrand.logo}
                  alt={safeBrand?.name || "Brand"}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-bold text-gray-300 uppercase">
                  {safeBrand?.name?.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <Reveal className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
                {safeBrand?.name}
              </h1>
              {brand?.description && (
                <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                  {brand.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Package size={13} />
                  {t('brandDetailPage.productsCount', { count: total })}
                </span>
                {brand?.verifiedCoupons && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    ✓ {t('brandDetailPage.verifiedCoupons', { count: brand.verifiedCoupons })}
                  </span>
                )}
                {brand?.avgSavings && (
                  <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    🏷 {t('brandDetailPage.avgSavings', { value: brand.avgSavings })}
                  </span>
                )}
              </div>
            </Reveal>
          </div>

          {/* Mobile filter pills */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pt-4 hide-scrollbar select-none -mx-4 px-4">
            <button
              onClick={() => setMobileFilterOpen("sort")}
              className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                sort !== "popular"
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
              }`}
            >
              <span>{t('listingPage.sortHeading')}</span>
              <ChevronDown size={12} />
            </button>
            <button
              onClick={() => setMobileFilterOpen("price")}
              className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                minPrice || maxPrice
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
              }`}
            >
              <span>
                {minPrice || maxPrice
                  ? t('listingPage.priceRangePillLabel', { min: minPrice || "0", max: maxPrice || "∞" })
                  : t('listingPage.priceRangeHeading')}
              </span>
              <ChevronDown size={12} />
            </button>
            {availableCategories.length > 0 && (
              <button
                onClick={() => setMobileFilterOpen("category")}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategories.length > 0
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                <span>
                  {selectedCategories.length > 0
                    ? t('brandDetailPage.categoryCountLabel', { count: selectedCategories.length })
                    : t('brandDetailPage.categoryHeading')}
                </span>
                <ChevronDown size={12} />
              </button>
            )}
            <button
              onClick={() => setOnSaleOnly(!onSaleOnly)}
              className={`flex items-center gap-1 px-4 py-2 border rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                onSaleOnly
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
              }`}
            >
              <span>{t('listingPage.offers')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN: sidebar + products ─── */}
      <div className="max-w-content mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Desktop Filter Sidebar ── */}
          <aside className="hidden w-64 flex-shrink-0 lg:block max-h-[calc(100vh-160px)] overflow-y-auto sticky top-24 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-soft space-y-6">
              {/* Sort */}
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4">
                  {t('listingPage.sortHeading')}
                </h3>
                <div className="space-y-3">
                  {sortOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`h-[16px] w-[16px] rounded-full border flex items-center justify-center transition-all ${
                          sort === opt.value
                            ? "bg-primary-600 border-primary-600"
                            : "border-gray-400 group-hover:border-gray-900"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sort"
                          value={opt.value}
                          checked={sort === opt.value}
                          onChange={() => setSort(opt.value)}
                          className="hidden"
                        />
                        {sort === opt.value && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          sort === opt.value
                            ? "text-gray-900 font-extrabold"
                            : "text-gray-500 group-hover:text-black"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4">
                  {t('listingPage.priceRangeHeading')}
                </h3>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-xs">€</span>
                    <input
                      type="number"
                      placeholder={t('listingPage.minPlaceholder')}
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-6 pr-1 text-xs focus:border-primary-600 outline-none transition-colors"
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
                      className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-6 pr-1 text-xs focus:border-primary-600 outline-none transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePriceApply}
                  className="w-full py-2 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-primary-700 transition-colors"
                >
                  {t('listingPage.apply')}
                </button>
              </div>

              {/* Offers */}
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4">
                  {t('listingPage.offers')}
                </h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`h-[16px] w-[16px] rounded-[3px] border flex items-center justify-center transition-all ${
                      onSaleOnly ? "bg-primary-600 border-primary-600" : "border-gray-400 group-hover:border-gray-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={() => setOnSaleOnly(!onSaleOnly)}
                      className="hidden"
                    />
                    {onSaleOnly && <div className="h-2.5 w-2.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 group-hover:text-black uppercase tracking-wider">
                    {t('listingPage.onSaleOnly')}
                  </span>
                </label>
              </div>

              {/* Category */}
              {availableCategories.length > 0 && (
                <div className="border-b border-gray-100 pb-5">
                  <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-wider mb-4">
                    {t('brandDetailPage.categoryHeading')}
                  </h3>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('listingPage.brandSearchPlaceholder')}
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-xs focus:border-primary-600 outline-none transition-all"
                    />
                  </div>
                  <div className="max-h-[180px] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredCategoryList.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <label key={cat} className="group flex cursor-pointer items-center gap-3 py-0.5">
                          <div
                            className={`h-[16px] w-[16px] rounded-[3px] border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected ? "bg-primary-600 border-primary-600" : "border-gray-400 group-hover:border-gray-900"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCategory(cat)}
                              className="hidden"
                            />
                            {isSelected && <div className="h-2 w-2 bg-white rounded-[1px]" />}
                          </div>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isSelected ? "font-bold text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {cat}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={resetFilters}
                className="w-full py-2 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('listingPage.resetFilters')}
              </button>
            </div>
          </aside>

          {/* ── Products ── */}
          <div className="flex-grow">
            {/* Featured / sponsored products for this brand — same strip as the category page.
                Hidden while filtering so sponsored products stay in the grid (sorted first). */}
            {!loading && showFeaturedStrip && (
              <TopsellerCarousel products={featuredProducts} />
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
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
              <div className="text-center py-24">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  {t('brandDetailPage.noProductsHeading')}
                </h2>
                <p className="text-gray-400 text-sm">
                  {t('brandDetailPage.noProductsText')}
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 bg-primary-600 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-primary-700 transition"
                >
                  {t('listingPage.resetFilters')}
                </button>
              </div>
            ) : (
              <>
                {/* Result count */}
                <p className="text-sm text-gray-500 mb-5">
                  {t('brandDetailPage.resultsCount', { count: total })}{" "}
                  <span className="font-semibold text-gray-800">{brand?.name}</span>
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                  {gridProducts.map((product, index) => (
                    <ProductCard
                      key={`${product.id}-${index}`}
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      brand={product.brand}
                      is_sponsored={product.is_sponsored}
                      deliveryCost={product.deliveryCost}
                    />
                  ))}
                </div>

                {/* ─── PAGINATION ─── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      {t('brandDetailPage.back')}
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (page <= 4) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                              page === pageNum
                                ? "bg-primary-600 text-white shadow-soft"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {t('brandDetailPage.next')}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile filter drawers ─── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[300] flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setMobileFilterOpen(null)}
          />
          <div className="relative mt-auto w-full bg-white rounded-t-2xl shadow-soft-lg p-6 z-[301] max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-md font-bold uppercase tracking-wider text-gray-900">
                {mobileFilterOpen === "sort" && t('listingPage.sortHeading')}
                {mobileFilterOpen === "price" && t('listingPage.priceRangeHeading')}
                {mobileFilterOpen === "category" && t('brandDetailPage.categoryHeading')}
              </h2>
              <button
                onClick={() => setMobileFilterOpen(null)}
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Sort */}
            {mobileFilterOpen === "sort" && (
              <div className="space-y-4">
                {sortOptions.map((opt) => {
                  const isChecked = sort === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSort(opt.value);
                        setMobileFilterOpen(null);
                      }}
                      className={`flex items-center justify-between w-full py-3 px-4 border rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                        isChecked
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isChecked && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Price */}
            {mobileFilterOpen === "price" && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900 font-extrabold text-xs">€</span>
                    <input
                      type="number"
                      placeholder={t('listingPage.minPlaceholder')}
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-2 text-xs focus:border-primary-600 outline-none transition-colors"
                    />
                  </div>
                  <span className="text-gray-400 font-bold">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900 font-extrabold text-xs">€</span>
                    <input
                      type="number"
                      placeholder={t('listingPage.maxPlaceholder')}
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-2 text-xs focus:border-primary-600 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
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
                  <button
                    onClick={handlePriceApply}
                    className="flex-1 py-3 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    {t('listingPage.apply')}
                  </button>
                </div>
              </div>
            )}

            {/* Category */}
            {mobileFilterOpen === "category" && (
              <div>
                <div className="relative mb-4">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('brandDetailPage.categorySearchPlaceholder')}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-xs focus:border-primary-600 outline-none transition-all"
                  />
                </div>
                <div className="max-h-[35vh] space-y-2.5 overflow-y-auto pr-1">
                  {filteredCategoryList.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center justify-between w-full py-2.5 px-4 border rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-50 text-gray-950 font-black"
                            : "border-gray-150 bg-white text-gray-500"
                        }`}
                      >
                        <span>{cat}</span>
                        <div
                          className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition-all ${
                            isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                      setMobileFilterOpen(null);
                    }}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {t('listingPage.clearAll')}
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(null)}
                    className="flex-1 py-3.5 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    {t('listingPage.apply')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
