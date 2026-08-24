'use client';

import { useState, useEffect, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import 'swiper/css/autoplay';
import InfiniteSlider from './components/InfiniteSlider';
import CardFanCarousel, { CardItem } from './components/ui/card-fan-carousel';
import HomeHero from './components/HomeHero';
import Image from 'next/image';
import Link from 'next/link';
import CardStack from './components/ui/card-stack';
import CategoryGroupGrid from './components/CategoryGroupGrid';
import IndoorOutdoorToggle from './components/IndoorOutdoorToggle';
import FAQSection, { FAQItem } from './components/FAQSection';
import NewsletterForm from './components/NewsletterForm';
import OfferProductCard from './components/OfferProductCard';
import PlaceholderImage from './components/PlaceholderImage';
import Button from './components/Button';
import { Tilt } from './components/motion/Tilt';
import { Reveal, RevealGroup, RevealItem } from './components/motion/Reveal';
import { normalizeLink } from '@/lib/productFormat';
import { fetchCatalogList } from '@/lib/categoryCatalog';
import { useLanguage } from '@/providers/languageContext';

interface MagazineArticle {
  id: number;
  title: string;
  author: string;
}

interface HeroItem {
  _id: string;
  image: string;
  link: string;
  title?: string;
  subtitle?: string;
  price?: string;
}

interface Sponsor {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  buttonText?: string;
}

interface Gadget {
  image: string;
  title: string;
  desc: string;
  price: string;
  link: string;
}
export default function HomePage() {
  const { t, tList } = useLanguage();
  const faqItems: FAQItem[] = tList<FAQItem>('home.defaultFaqs');
  const [activeTab, setActiveTab] = useState<'indoor' | 'outdoor'>('indoor');
  const [heroData, setHeroData] = useState<HeroItem[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([]);

  // Featured Parent Categories. One flat list — parent categories have no
  // indoor/outdoor type, so there is no tab.
  const [homeParentCats, setHomeParentCats] = useState<any[]>([]);

  // Custom Categories & Products states
  const [dynamicIndoorCats, setDynamicIndoorCats] = useState<any[]>([]);
  const [dynamicOutdoorCats, setDynamicOutdoorCats] = useState<any[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<any[]>([]);

  // Section custom title/slug settings (some sections, e.g. "newsletter", carry extra fields)
  const [sectionSettings, setSectionSettings] = useState<Record<string, any>>({});

  // Home Influencer Look state
  const [homeInfluencer, setHomeInfluencer] = useState<any>(null);

  // Admin-managed SEO content for the home page (Settings → Furniture SEO Content).
  // Holds { pageTitle, pageSubtitle, longContent, faqs, seoTitle, seoDescription, seoKeywords }.
  const [homeSeo, setHomeSeo] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/hero?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setHeroData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/sponsors")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setSponsors(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching sponsors:", err));

    fetch("/api/gadgets")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setGadgets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching gadgets:", err));

    fetch("/api/blog")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBlogs(Array.isArray(data) ? data.slice(0, 7) : []))
      .catch(() => setBlogs([]));

    // Fetch featured furniture brands for the "Vertrauenswürdige Marken" strip
    fetch("/api/furniture-brands/featured?limit=30")
      .then((res) => res.ok ? res.json() : [])
      .then((data: any) => {
        if (Array.isArray(data)) {
          setFeaturedBrands(data.filter((b: any) => b.logo && b.logo.trim() !== ""));
        }
      })
      .catch((err) => console.error("Error fetching featured furniture brands:", err));

    // Fetch Parent Categories and build the home page's tile grid in their
    // drag-configured order. One flat grid — no indoor/outdoor split — so
    // each tile brings its own href rather than sharing a hrefBase.
    Promise.all([
      fetch(`/api/parent-categories?t=${Date.now()}`, { cache: "no-store" }).then((res) => (res.ok ? res.json() : [])),
      fetchCatalogList(),
    ])
      .then(([data, catalog]: [any, any]) => {
        const list = Array.isArray(data) ? data : [];

        // How many Category Catalog entries are assigned to each parent — shown
        // as the caption under a tile's name.
        const catalogCounts = new Map<string, number>();
        for (const entry of Array.isArray(catalog) ? catalog : []) {
          const parentId = entry?.parentCategoryId;
          if (parentId) catalogCounts.set(parentId, (catalogCounts.get(parentId) ?? 0) + 1);
        }

        // Only Featured parent categories show here, in their drag-configured
        // order (the API already returns them sorted by sort_order).
        const parentTiles = list
          .filter((p: any) => p?.slug && (p.featured === true || p.featured === "true"))
          .map((p: any) => ({
            name: p.name || p.slug,
            slug: p.slug,
            image: p.image || null,
            count: catalogCounts.get(p._id) ?? 0,
            href: `/${encodeURIComponent(p.slug)}`,
          }));

        setHomeParentCats(parentTiles);
      })
      .catch((err) => console.error("Error fetching home parent categories:", err));

    // Fetch custom categories
    fetch("/api/home-categories")
      .then((res) => res.ok ? res.json() : { success: false })
      .then((data) => {
        if (data.success && data.categories) {
          const indoor = data.categories.filter((c: any) => c.section === "indoor");
          const outdoor = data.categories.filter((c: any) => c.section === "outdoor");
          setDynamicIndoorCats(indoor);
          setDynamicOutdoorCats(outdoor);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));

    // Fetch section settings (titles/slugs)
    fetch("/api/section-settings")
      .then((res) => res.ok ? res.json() : { success: false })
      .then((data) => {
        if (data.success && data.settings) {
          setSectionSettings(data.settings);
        }
      })
      .catch((err) => console.error("Error fetching section settings:", err));

    // Fetch custom home influencer look
    fetch("/api/home-influencer")
      .then((res) => res.ok ? res.json() : { success: false })
      .then((data) => {
        if (data.success && data.data) {
          setHomeInfluencer(data.data);
        }
      })
      .catch((err) => console.error("Error fetching home influencer look:", err));

    // Fetch admin-managed home page SEO content (FAQs, headings, meta).
    fetch(`/api/page-seo-settings/official-home?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHomeSeo(data || null))
      .catch((err) => console.error("Error fetching home SEO settings:", err));
  }, []);

  // Tiles for the Parent Category grid, with the catalog count translated into
  // a caption. Memoized so a re-render doesn't restart the reveal animation.
  const homeCatTiles = useMemo(
    () =>
      homeParentCats.map((c: any) => ({
        ...c,
        caption:
          typeof c.count === "number" && c.count > 0
            ? t(
                c.count === 1
                  ? "categoryGroupGrid.categoriesCountSingular"
                  : "categoryGroupGrid.categoriesCount",
                { count: c.count }
              )
            : undefined,
      })),
    [homeParentCats, t]
  );

  // Indoor/Outdoor section is fully backend-driven (managed in admin → Indoor/Outdoor).
  const hasDbIndoorCats = dynamicIndoorCats.length > 0;
  const hasDbOutdoorCats = dynamicOutdoorCats.length > 0;
  const hasAnyDynamicCats = hasDbIndoorCats || hasDbOutdoorCats;

  const currentCategories: any[] = activeTab === "indoor" ? dynamicIndoorCats : dynamicOutdoorCats;

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("");

  const activeCategoryName =
    currentCategories.find((c) => c.slug === activeCategorySlug)?.name || "";

  // Default to whichever tab actually has categories (e.g. only Outdoor configured).
  useEffect(() => {
    if (activeTab === "indoor" && !hasDbIndoorCats && hasDbOutdoorCats) setActiveTab("outdoor");
    else if (activeTab === "outdoor" && !hasDbOutdoorCats && hasDbIndoorCats) setActiveTab("indoor");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDbIndoorCats, hasDbOutdoorCats]);

  // Keep the selected category valid whenever the tab or category list changes.
  useEffect(() => {
    if (currentCategories.length > 0) {
      const exists = currentCategories.some((c: any) => c.slug === activeCategorySlug);
      if (!exists) setActiveCategorySlug(currentCategories[0].slug);
    } else {
      setActiveCategorySlug("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dynamicIndoorCats, dynamicOutdoorCats]);

  // Load the selected category's products from the backend.
  useEffect(() => {
    if (!activeCategorySlug) {
      setDynamicProducts([]);
      return;
    }
    fetch(`/api/home-products?categorySlug=${encodeURIComponent(activeCategorySlug)}&section=${activeTab}`)
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (data.success) setDynamicProducts(data.products);
      })
      .catch((err) => console.error("Error loading products:", err));
  }, [activeCategorySlug, activeTab]);

  const displayProducts = dynamicProducts;

  // Gadgets as fan-carousel cards. Memoized: a new array identity on every
  // render would restart the carousel's entry animation.
  const gadgetCards: CardItem[] = useMemo(
    () =>
      gadgets
        .filter((g) => g.image)
        .map((g) => ({ imgUrl: g.image, alt: g.title, linkUrl: g.link })),
    [gadgets]
  );

  if (loading) return <div className="h-[500px] bg-gray-100 animate-pulse" />;

  return (
    <div>

    {/* ================= HERO SECTION ================= */}
<HomeHero items={heroData} />
{/* Featured brands strip — floats over the hero's bottom edge (half inside the
    hero, half outside on the page background), only renders when brands exist.
    Few brands => a compact centered card that hugs its logos; many brands =>
    a full-width auto-playing carousel. */}
{featuredBrands.length > 0 && (
<section className="relative z-30 section-bg-2 flow-root">
  <div className="max-w-content mx-auto px-4 flex justify-center -mt-12 md:-mt-16">
    {featuredBrands.length <= 6 ? (
      // Compact card that shrinks to fit its logos
      <RevealGroup className="bg-white rounded-[26px] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.3)] ring-1 ring-gray-100 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {featuredBrands.map((b: any) => (
          <RevealItem key={b._id}>
          <Tilt rotationFactor={8}>
          <a
            href={b.website ? normalizeLink(b.website) : `/merken/${b.slug}`}
            {...(b.website ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group relative bg-white rounded-xl ring-1 ring-gray-200/80 shadow-soft hover:shadow-depth-3 hover:ring-primary-300 hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center w-[130px] sm:w-[160px] h-[64px] sm:h-[76px] px-5 overflow-hidden"
          >
            <Image
              src={b.logo}
              alt={b.title}
              fill
              sizes="160px"
              className="object-cover rounded-xl transition duration-300"
            />
          </a>
          </Tilt>
          </RevealItem>
        ))}
      </RevealGroup>
    ) : (
      // Full-width auto-scrolling marquee for many brands. A pure CSS marquee
      // (see `.animate-marquee` in globals.css) avoids Swiper's fragile `loop`
      // mode, which left blank cards on the right and stopped on interaction.
      // The list is tripled so the -33.33% keyframe loops seamlessly; pauses on hover.
      <div className="w-full bg-white rounded-[26px] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.3)] ring-1 ring-gray-100 px-4 sm:px-8 py-5 md:py-6 overflow-hidden">
        <div className="flex animate-marquee w-max py-3">
          {[...featuredBrands, ...featuredBrands, ...featuredBrands].map((b: any, i: number) => (
            <a
              key={`${b._id}-${i}`}
              href={b.website ? normalizeLink(b.website) : `/merken/${b.slug}`}
              {...(b.website ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group relative flex-shrink-0 mx-2 bg-white rounded-xl ring-1 ring-gray-200/80 shadow-soft hover:shadow-depth-3 hover:ring-primary-300 hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center w-[150px] sm:w-[180px] h-[64px] sm:h-[76px] px-5 overflow-hidden"
            >
              <Image
                src={b.logo}
                alt={b.title}
                fill
                sizes="180px"
                className="object-cover rounded-xl transition duration-300"
              />
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
</section>
)}
{/* Featured Parent Categories plus a tile per Furniture page, in one flat
    grid — each tile carries its own href. Only renders when non-empty. */}
{homeCatTiles.length > 0 && (
  <CategoryGroupGrid
    variant="photo"
    title={t('categoryGroupGrid.heading')}
    subtitle={t('categoryGroupGrid.subheading')}
    categories={homeCatTiles}
    moreCategoriesHref="/categorie"
    collapsibleRows={2}
  />
)}
{/* ================= INDOOR / OUTDOOR SECTION (admin-managed) ================= */}
{hasAnyDynamicCats && (
<section className="section-bg-1 py-16 md:py-24">
  <div className="max-w-content mx-auto px-4">

    {/* ================= HEADING ================= */}
    <Reveal className="text-center mb-6">
      <h2 className="text-h2 font-display text-gray-900">
        {t('home.indoorOutdoorHeading')}
      </h2>
    </Reveal>

    {/* ================= MAIN TOGGLE BUTTONS ================= */}
    <div className="flex justify-center mb-8 px-4">
      <IndoorOutdoorToggle
        value={activeTab}
        onChange={setActiveTab}
        indoorLabel={t('home.indoorFurnitureLabel')}
        outdoorLabel={t('home.outdoorFurnitureLabel')}
        indoorDisabled={!hasDbIndoorCats}
        outdoorDisabled={!hasDbOutdoorCats}
      />
    </div>

    {/* ================= CATEGORY SWIPER BUTTONS ================= */}
    <div className="mb-8">
      <Swiper
        modules={[Pagination, FreeMode]}
        slidesPerView="auto"
        spaceBetween={10}
        freeMode={true}
        pagination={{ clickable: true, dynamicBullets: true }}
        className="!pb-10"
      >
        {currentCategories.map((cat: any) => {
          const isCatSelected = activeCategorySlug === cat.slug;

          return (
            <SwiperSlide key={cat.slug} style={{ width: "auto" }}>
              <button
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`px-5 py-2.5 my-2 rounded-2xl text-sm font-semibold border whitespace-nowrap transition-all duration-300
                  ${
                    isCatSelected
                      ? "bg-primary-600 text-white border-primary-600 shadow-soft-md shadow-primary-600/25 -translate-y-0.5"
                      : "bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 hover:shadow-soft"
                  }`}
              >
                {cat.name}
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>

    {/* ================= PRODUCT SWIPER ================= */}
    <Swiper
      modules={[Pagination]}
      pagination={{ clickable: true, dynamicBullets: true }}
      slidesPerView={1.2}
      spaceBetween={14}
      breakpoints={{
        480: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 18 },
        1024: { slidesPerView: 4, spaceBetween: 20 },
        1280: { slidesPerView: 5, spaceBetween: 24 },
      }}
      className="!pb-12"
    >
      {displayProducts.length === 0 ? (
        <SwiperSlide>
          <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-soft-lg transition-all duration-300 h-64 flex flex-col items-center justify-center p-4">
            <span className="text-sm text-zinc-400 font-medium">{t('home.noProductsAvailable')}</span>
          </div>
        </SwiperSlide>
      ) : (
        displayProducts.map((item: any, index: number) => (
          <SwiperSlide key={item._id || index}>
            <OfferProductCard
              title={item.title}
              image={item.image}
              link={item.link}
              price={item.price}
              oldPrice={item.oldPrice}
              saleValue={item.saleValue}
              brandName={item.brandName}
              brandLogo={item.brandLogo}
              categoryLabel={activeCategoryName}
              // Home products are picked from the catalog and keep a reference to
              // it; without one there is no id the wishlist could resolve.
              wishlistId={item.sourceProductId}
            />
          </SwiperSlide>
        ))
      )}
    </Swiper>

  </div>
</section>
)}
{/* Only render when sponsors exist in the API — no hardcoded fallback */}
{sponsors.length > 0 && (
<section className="section-bg-2 py-16 md:py-24">
  <div className="max-w-content mx-auto px-4">

    <Reveal className="flex flex-col items-center mb-10">
      <h2 className="text-h2 font-display text-gray-900">
        {sectionSettings.sponsors?.title || t('home.sponsorsDefaultTitle')}
      </h2>
      <p className="text-gray-500 mt-2 text-center">
        {sectionSettings.sponsors?.slug || t('home.sponsorsDefaultSubtitle')}
      </p>
    </Reveal>

    {/* 2-up carousel, 16:7 cards, seamless auto-loop */}
    <InfiniteSlider items={sponsors} perView={{ base: 1, sm: 2, lg: 2 }} aspect="16 / 7" />

  </div>
</section>
)}
{/* Only render when gadgets exist in the API — no hardcoded fallback */}
{gadgetCards.length > 0 && (
<section className="section-bg-1 py-12 md:py-16 overflow-hidden">
  <div className="max-w-content mx-auto px-4">

    <Reveal className="flex flex-col items-center mb-4 md:mb-6">
      <h2 className="text-h2 font-display text-gray-900">
        {sectionSettings.gadgets?.title || t('home.gadgetsDefaultTitle')}
      </h2>
      <p className="text-gray-500 mt-2 text-center">
        {sectionSettings.gadgets?.slug || t('home.gadgetsDefaultSubtitle')}
      </p>
    </Reveal>

    {/* Fanned "hand of cards" — up to 7 on screen, arrows/swipe cycle the rest */}
    <CardFanCarousel cards={gadgetCards} />

  </div>
</section>
)}

{/* ================= INFLUENCER LOOKS SECTION ================= */}
{/* Only render when a look has been configured via the admin/API — no hardcoded fallback */}
{homeInfluencer?.mainImage && (
<section className="section-bg-2 py-16 md:py-24">

  <div className="max-w-content mx-auto px-4">

    {/* Centered Heading */}
    <div className="text-center mb-8">
      <h2 className="text-h3 font-display text-gray-900">
        {t('home.influencerLooksHeading')}
      </h2>
      <p className="text-gray-500 text-sm mt-1">
        {t('home.influencerLooksSubtitle')}
      </p>
      <h3 className="text-h5 text-gray-900 mt-3">
        {t('home.shopThisLook')}
      </h3>
    </div>

    {(() => {
      // Purely API-driven — the section is only rendered when homeInfluencer.mainImage exists
      const influencerMainImage = homeInfluencer.mainImage;
      const influencerTitle = homeInfluencer.mainImageTitle || "";
      const influencerLink = homeInfluencer.mainImageLink || "";
      const influencerProducts = homeInfluencer.products || [];

      return (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">

            {/* LEFT BIG IMAGE */}
            {influencerLink ? (
              <a
                href={influencerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative rounded-xl overflow-hidden shadow-soft-md min-h-[350px] lg:min-h-0 hover:shadow-soft-lg transition-shadow block group"
              >
                <Image
                  src={influencerMainImage}
                  alt={influencerTitle}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />

                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-md text-xs font-medium shadow-soft">
                  {influencerTitle}
                </div>
              </a>
            ) : (
              <div className="relative rounded-xl overflow-hidden shadow-soft-md min-h-[350px] lg:min-h-0 hover:shadow-soft-lg transition-shadow">
                <Image
                  src={influencerMainImage}
                  alt={influencerTitle}
                  fill
                  className="object-cover"
                />

                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-md text-xs font-medium shadow-soft">
                  {influencerTitle}
                </div>
              </div>
            )}

            {/* RIGHT SIDE - 3 Cards per Row */}
            <div className="flex flex-col">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {influencerProducts.map((p: any, i: number) => {
                  const productCard = (
                    <div
                      className="bg-white rounded-xl p-2 sm:p-3 relative hover:shadow-soft-md transition border border-gray-100 flex flex-col overflow-hidden h-full"
                    >
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm z-10">
                        ♡
                      </button>

                      <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden">
                        <Image
                          src={p.image || p.img}
                          alt=""
                          fill
                          className="object-contain p-2"
                        />
                      </div>

                      <p className="text-center font-bold mt-2 sm:mt-3 text-sm text-gray-900">
                        {p.price}
                      </p>
                    </div>
                  );

                  if (p.link) {
                    return (
                      <a
                        key={i}
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                      >
                        {productCard}
                      </a>
                    );
                  }

                  return <div key={i} className="h-full">{productCard}</div>;
                })}
              </div>
            </div>

          </div>

          {influencerLink && (
            <div className="text-center mt-6">
              <Button as="a" href={influencerLink} external variant="ghost" size="md">
                {t('home.discoverLook')}
              </Button>
            </div>
          )}
        </div>
      );
    })()}
  </div>
</section>
)}
     <section className="section-pattern-1 py-16 md:py-24">
  <div className="max-w-content mx-auto px-4">

    {/* Heading */}
    <Reveal className="flex flex-col items-center mb-10">
      <h2 className="text-h2 font-display text-gray-900">
        {t('home.magazineHeading')}
      </h2>
      <p className="text-gray-500 mt-2 text-center">
        {t('home.magazineSubtitle')}
      </p>
    </Reveal>

    {/* Draggable card deck — the article title sits in each card's bottom-left corner. */}
    <CardStack
      items={(Array.isArray(blogs) ? blogs : []).map((blog) => ({
        id: blog._id,
        title: blog.title,
        subtitle: blog.subHeading,
        category: blog.category,
        image: blog.thumbnail || blog.heroImage,
        href: `/blog/${blog._id}`,
      }))}
      emptyLabel={t('home.noMagazinePosts')}
    />

    {Array.isArray(blogs) && blogs.length > 0 && (
      <div className="text-center mt-8">
        <Button as="a" href="/magazine" variant="ghost" size="md">
          {t('common.viewAll')}
        </Button>
      </div>
    )}

  </div>
</section>

{/* ================= LONG CONTENT SECTION ================= */}
{/* Rich-text body — admin-managed via Settings → Furniture SEO Content (official-home). */}
{homeSeo?.longContent?.trim() && (
  <section className="bg-white section-pattern-2 py-10 border-t">
    <div className="max-w-content mx-auto px-4">
      <div className="bg-[var(--section-bg-1)] rounded-3xl p-6 md:p-8 shadow-soft">
        <div
          className="text-gray-600 text-sm md:text-base leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          dangerouslySetInnerHTML={{ __html: homeSeo.longContent }}
        />
      </div>
    </div>
  </section>
)}

{/* ================= FAQ SECTION ================= */}
<FAQSection
  faqs={(Array.isArray(homeSeo?.faqs) && homeSeo.faqs.length > 0 ? homeSeo.faqs : faqItems) as FAQItem[]}
  title={homeSeo?.pageTitle?.trim() || t('faqSection.defaultTitle')}
  subtitle={homeSeo?.pageSubtitle?.trim() || t('home.faqDefaultSubtitle')}
  sectionClassName="section-bg-2 pt-14 md:pt-20 border-t border-gray-100"
/>
<div className="section-bg-2 text-center pt-2 pb-14 md:pb-20">
  <p className="text-xs text-gray-500 pt-4">
    {t('home.faqFooterText')}{" "}
    <Link href="/contact" className="underline hover:text-black">
      {t('home.faqFooterLink')}
    </Link>
  </p>
</div>

{/* ================= NEWSLETTER SECTION ================= */}
{(() => {
  const nl: any = (sectionSettings as any)?.newsletter || {};
  const image = nl.image || null;
  const overlayTitle = nl.overlayTitle ?? t('newsletterSection.overlayTitle');
  const overlaySubtitle = nl.overlaySubtitle ?? t('newsletterSection.overlaySubtitle');
  const formTitle = nl.formTitle ?? t('newsletterSection.formTitle');
  const formSubtitle = nl.formSubtitle ?? t('newsletterSection.formSubtitle');
  const disclaimer = nl.disclaimer ?? t('newsletterSection.disclaimer');
  return (
<section className="bg-white section-pattern-2 py-6 border-t">   {/* ← py-12 ko py-6 kiya */}
  <div className="max-w-content mx-auto px-4">

    <div className="bg-[var(--section-bg-1)] rounded-2xl overflow-hidden shadow-soft">
      <div className="grid md:grid-cols-2">

        {/* IMAGE */}
        <div className="relative h-64 md:h-auto min-h-[16rem]">
          <PlaceholderImage
            src={image}
            alt={overlayTitle || t('newsletterSection.imageAlt')}
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute bottom-6 left-6 text-white">
            {overlayTitle && (
              <h3 className="text-h4 md:text-h3 font-display">
                {overlayTitle}
              </h3>
            )}
            {overlaySubtitle && (
              <p className="mt-2 text-sm opacity-90">
                {overlaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* FORM */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          {formTitle && (
            <h3 className="text-h3 font-display text-gray-900 mb-3">
              {formTitle}
            </h3>
          )}

          {formSubtitle && (
            <p className="text-gray-600 mb-6 text-sm">
              {formSubtitle}
            </p>
          )}

          <NewsletterForm
            {...(nl.buttonText ? { buttonText: nl.buttonText } : {})}
            {...(nl.placeholder ? { placeholder: nl.placeholder } : {})}
          />

          {disclaimer && (
            <p className="mt-5 text-[11px] text-gray-500">
              {disclaimer}{" "}
              <Link href="/privacybeleid" className="underline">
                {t('newsletterSection.privacyLinkText')}
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>

  </div>
</section>
  );
})()}

    </div>
  );
}
