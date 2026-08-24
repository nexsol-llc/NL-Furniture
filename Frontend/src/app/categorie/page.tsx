"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import FAQSection from "../components/FAQSection";
import NewsletterSection from "../components/NewsletterSection";
import CategoryTabsSection from "../components/CategoryTabsSection";
import CategoryImage from "../components/CategoryImage";
import PlaceholderImage from "../components/PlaceholderImage";
import ShopLink from "../components/ShopLink";
import { shopLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";
// ── Shimmer skeletons that mirror the real layout ─────────────────────────────
function CategoryGridSkeleton() {
  return (
    <section className="py-8">
      <div className="max-w-content mx-auto px-4">
        <div className="flex flex-col items-center mb-6">
          <div className="h-7 w-40 rounded-lg skeleton" />
          <div className="h-3 w-56 rounded skeleton mt-2.5" />
          <div className="h-12 w-64 rounded-full skeleton mt-5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white">
              <div className="aspect-[4/3] w-full skeleton" />
              <div className="px-3 py-2.5 space-y-2">
                <div className="h-3.5 w-3/4 rounded skeleton" />
                <div className="h-2.5 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSectionSkeleton() {
  return (
    <section className="max-w-content mx-auto px-4 py-8 md:py-10">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2.5">
            <div className="h-7 w-40 rounded-lg skeleton" />
            <div className="h-3 w-64 rounded skeleton" />
          </div>
          <div className="h-4 w-24 rounded skeleton" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200/80 overflow-hidden">
              <div className="h-44 skeleton" />
              <div className="p-4 space-y-2.5">
                <div className="h-3 w-1/3 rounded skeleton" />
                <div className="h-4 w-full rounded skeleton" />
                <div className="h-5 w-1/2 rounded skeleton mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Horizontal product scroller with hover arrows, hidden scrollbar and edge
// fades. Replaces the raw native `overflow-x-auto` scroller (which showed an
// ugly full-width scrollbar and had no navigation controls).
function HScroller({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: -1 | 1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  };

  // Fade only the edge that still has content to scroll toward. Uses a mask so
  // it works over the section's dynamic background color.
  const mask = `linear-gradient(to right, ${canLeft ? "transparent" : "#000"} 0, #000 3rem, #000 calc(100% - 3rem), ${canRight ? "transparent" : "#000"} 100%)`;

  const arrowBase =
    "hidden md:flex absolute top-[38%] -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-soft-lg ring-1 ring-gray-200 backdrop-blur transition-all hover:bg-white hover:scale-105";

  return (
    <div className="group/scroller relative">
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-4 snap-x scroll-smooth hide-scrollbar"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label={t('kategoriePage.scrollBack')}
        className={`${arrowBase} left-2 ${
          canLeft ? "opacity-0 group-hover/scroller:opacity-100" : "pointer-events-none !opacity-0"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label={t('kategoriePage.scrollForward')}
        className={`${arrowBase} right-2 ${
          canRight ? "opacity-0 group-hover/scroller:opacity-100" : "pointer-events-none !opacity-0"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function CategorySection({
  title,
  desc,
  products,
  categoryKey,
  loading,
  backgroundClassName = "",
}: {
  title: string;
  desc: string;
  products: any[];
  categoryKey: string;
  loading?: boolean;
  /** Section surface class — carries the admin color *and* its pattern. */
  backgroundClassName?: string;
}) {
  const { t } = useLanguage();
  return (
    <section className={`${backgroundClassName} py-8 md:py-10`}>
      <div className="max-w-content mx-auto px-4">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 text-sm mt-1">{desc}</p>
          </div>
          <Link
            href={`/${categoryKey}`}
            className="text-primary-600 font-semibold text-sm hover:underline flex items-center gap-1"
          >
            {t('kategoriePage.viewAll')}
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[190px] sm:w-[220px] rounded-2xl border border-gray-200/80 bg-white overflow-hidden">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 w-1/3 rounded skeleton" />
                  <div className="h-4 w-full rounded skeleton" />
                  <div className="h-5 w-1/2 rounded skeleton mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          // Horizontal scroller — cards keep a fixed width and overflow to the
          // side, so a section can show more than four products.
          <HScroller>
            {products.map((product) => {
              const img =
                product.merchant_image_url ||
                product.aw_image_url ||
                product.image ||
                null;
              const price = product.display_price || (product.price ? `€${product.price}` : "");

              return (
                <ShopLink
                  key={product._id}
                  href={shopLink(product)}
                  className="group my-2 flex-shrink-0 w-[190px] sm:w-[220px] snap-start bg-white rounded-2xl border border-gray-200/80 shadow-soft overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* IMAGE */}
                  <div className="relative h-44 flex items-center justify-center p-3 bg-white">
                    <button className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 z-10 transition-colors">
                      ♡
                    </button>
                    <PlaceholderImage
                      src={img}
                      alt={product.product_name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 flex flex-col flex-grow">
                    {(product.brand_name || "NL Furniture").toLowerCase() !== "nl furniture" && (
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        {product.brand_name || "NL Furniture"}
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem] text-sm leading-snug group-hover:text-primary-600 transition-colors">
                      {product.product_name}
                    </h3>
                    <div className="mt-auto pt-4 flex flex-col gap-1">
                      <span className="font-bold text-base text-gray-900">
                        {(() => {
                          const clean = price.replace(/€/g, "").replace(/EUR/i, "").trim();
                          return `€ ${clean}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </ShopLink>
              );
            })}
          </HScroller>
        ) : (
          <p className="text-gray-500 text-center py-12 text-sm">{t('kategoriePage.noProductsInCategory')}</p>
        )}
      </div>
    </section>
  );
}

export default function KategoriePage() {
  const { t } = useLanguage();
  // No hardcoded defaults — everything comes from the API. Skeletons show until loaded.
  const [sections, setSections] = useState<any[]>([]);
  const [parentCats, setParentCats] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [seoTitle, setSeoTitle] = useState(t('kategoriePage.defaultSeoTitle'));
  const [seoDescription, setSeoDescription] = useState(t('kategoriePage.defaultSeoDescription'));
  const [longContent, setLongContent] = useState("");

  const [sectionData, setSectionData] = useState<Record<string, any[]>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogs, setCatalogs] = useState<any[]>([]);

  // 1️⃣ Fetch DB settings for this page
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/kategorie-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            const s = data.settings;
            if (s.seoTitle) setSeoTitle(s.seoTitle);
            if (s.seoDescription) setSeoDescription(s.seoDescription);
            if (s.longContent) setLongContent(s.longContent);
            if (Array.isArray(s.faqs)) setFaqs(s.faqs);
            if (Array.isArray(s.sections)) setSections(s.sections);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Kategorie settings:", err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Featured Parent Categories drive the tile grid. One flat list — parent
  // categories have no indoor/outdoor type — each tile linking to its own
  // flat /[slug] page.
  useEffect(() => {
    fetch(`/api/parent-categories?t=${Date.now()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        // Only Featured parent categories show here, in their drag-configured
        // order (the API already returns them sorted by sort_order).
        const list = (Array.isArray(data) ? data : []).filter((p: any) => p?.slug && (p.featured === true || p.featured === "true"));
        setParentCats(
          list.map((p: any) => ({
            id: p._id,
            name: p.name || p.slug,
            slug: p.slug,
            image: p.image || null,
            href: `/${encodeURIComponent(p.slug)}`,
          }))
        );
      })
      .catch((err) => console.error("Failed to fetch parent categories:", err));
  }, []);

  // Fetch category catalogs (each with its childCategories) for the nested display
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const res = await fetch(`/api/category-catalog?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setCatalogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch category catalogs:", err);
      }
    };
    fetchCatalogs();
  }, []);

  // Tiles for the Parent Category grid, captioned with how many Category
  // Catalog entries hang off each parent. Memoized so the reveal animation
  // doesn't restart on every render.
  const parentTiles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of catalogs) {
      const parentId = entry?.parentCategoryId;
      if (parentId) counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
    }
    return parentCats.map((c) => {
      const count = counts.get(c.id) ?? 0;
      return {
        ...c,
        caption:
          count > 0
            ? t(
                count === 1
                  ? "categoryGroupGrid.categoriesCountSingular"
                  : "categoryGroupGrid.categoriesCount",
                { count }
              )
            : undefined,
      };
    });
  }, [catalogs, parentCats, t]);

  // 2️⃣ Apply SEO headers dynamically
  useEffect(() => {
    if (seoTitle) {
      document.title = seoTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && seoDescription) {
      metaDesc.setAttribute("content", seoDescription);
    }
  }, [seoTitle, seoDescription]);

  // 3️⃣ Fetch products for sections
  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        setLoadingProducts(true);
        const results: Record<string, any[]> = {};
        await Promise.all(
          sections.map(async (sec) => {
            // Only show "featured" (sponsored) products. We filter client-side on
            // `is_sponsored` — the same approach CategoryListingPage uses for its
            // Topseller strip — so it works against the live backend regardless of
            // the `featured` query param. Sponsored products are ordered first, so
            // a larger fetch window ensures we capture them all before filtering.
            const res = await fetch(`/api/products-by-category?category=${sec.key}&limit=40&featured=true`);
            if (res.ok) {
              const data = await res.json();
              const all = Array.isArray(data.products) ? data.products : [];
              results[sec.key] = all.filter((p: any) => p.is_sponsored);
            }
          })
        );
        setSectionData(results);
      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    if (sections && sections.length > 0) {
      fetchAllSections();
    } else {
      setLoadingProducts(false);
    }
  }, [sections]);

  // While the page config loads, show shimmer skeletons that mirror the layout.
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans pb-10">
        <CategoryGridSkeleton />
        <ProductSectionSkeleton />
        <ProductSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans pb-10">
      {/* Featured Parent Categories (only when configured) */}
      {parentTiles.length > 0 && <CategoryTabsSection categories={parentTiles} />}

      {/* Category product sections — horizontal scrollers on the 2nd admin
          section color. Each shows shimmer cards until its products arrive. */}
      <div>
        {sections.map((sec) => (
          <CategorySection
            key={sec.key}
            categoryKey={sec.key}
            title={sec.title}
            desc={sec.desc}
            products={sectionData[sec.key] || []}
            loading={loadingProducts}
            backgroundClassName="section-bg-2"
          />
        ))}
      </div>

      {/* Long Content / SEO Section */}
      {longContent && (
        <section className="max-w-content mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 uppercase tracking-tight">
              {t('kategoriePage.aboutCategoriesHeading')}
            </h2>
            <div
              className="text-gray-600 text-sm md:text-base leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
              dangerouslySetInnerHTML={{ __html: longContent }}
            />
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterSection
        sectionClassName="bg-white section-pattern-1 py-12 border-t mt-10"
        cardClassName="bg-gray-50 rounded-3xl overflow-hidden shadow-soft"
        privacyHref="/privacy"
        buttonClassName="bg-primary-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-600 transition"
      />

      {/* FAQs */}
      {faqs.length > 0 && (
        <FAQSection faqs={faqs} title={t('kategoriePage.faqTitle')} />
      )}
    </div>
  );
}