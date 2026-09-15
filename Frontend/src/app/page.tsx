'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HomeSidebar from './components/home/HomeSidebar';
import CompareHero, { HeroBackdrop, type HeroSlide } from './components/home/CompareHero';
import CompareProducts from './components/home/CompareProducts';
import { type DealItem } from './components/home/TopDealsRail';
import HeroSideCards from './components/home/HeroSideCards';
import CategoryRail, { type CategoryTile } from './components/home/CategoryRail';
import BrandStrip, { type BrandTile } from './components/home/BrandStrip';
import ProductRail, { type RailProduct } from './components/home/ProductRail';
import InspirationRail, { type InspirationItem } from './components/home/InspirationRail';
import ComparisonCta from './components/home/ComparisonCta';
import TestimonialsSection from './components/home/TestimonialsSection';
import TrustStrip from './components/home/TrustStrip';
import HomeTextSection from './components/home/HomeTextSection';
import { RoomsCard, WhyCompareCard } from './components/home/PromoCards';
import { SponsorAdCarousel } from './components/home/SponsorAd';
import FAQSection, { FAQItem } from './components/FAQSection';
import { fetchCatalogList } from '@/lib/categoryCatalog';
import {
  DEFAULT_COMPARE_SECTION,
  normalizeCompareSection,
  type CompareSectionSettings,
} from '@/lib/compareSection';
import { shopLink } from '@/lib/productFormat';
import {
  EMPTY_SPONSOR_ADS,
  normalizeSponsorAds,
  type SponsorAdsByPlacement,
} from '@/lib/sponsorAds';
import { useLanguage } from '@/providers/languageContext';

/**
 * Comparison-style home page: a left navigation rail, a main column, and a
 * right rail carrying the comparison tray, the deal list and the paid slots.
 * Below the fold everything spans the full content width.
 *
 * All content is admin-driven — a module that has no data simply doesn't
 * render, so a fresh install degrades to the sections that are configured.
 */
export default function HomePage() {
  const { t, tList } = useLanguage();

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroActiveId, setHeroActiveId] = useState<string | null>(null);
  const [sponsorAds, setSponsorAds] = useState<SponsorAdsByPlacement>(EMPTY_SPONSOR_ADS);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [brands, setBrands] = useState<BrandTile[]>([]);
  const [bestSellers, setBestSellers] = useState<RailProduct[]>([]);
  const [sponsoredPicks, setSponsoredPicks] = useState<RailProduct[]>([]);
  const [inspiration, setInspiration] = useState<InspirationItem[]>([]);
  const [roomsImage, setRoomsImage] = useState<string | null>(null);
  const [compareSection, setCompareSection] =
    useState<CompareSectionSettings>(DEFAULT_COMPARE_SECTION);
  const [homeSeo, setHomeSeo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hero?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setHeroSlides(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Paid placements — Admin → Sponsor Ads. Active ads only, grouped by slot.
    fetch('/api/sponsor-ads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSponsorAds(normalizeSponsorAds(data)))
      .catch((err) => console.error('Error fetching sponsor ads:', err));

    // Featured parent categories, in their drag-configured order, captioned
    // with how many catalog entries sit under each.
    Promise.all([
      fetch(`/api/parent-categories?t=${Date.now()}`, { cache: 'no-store' }).then((res) =>
        res.ok ? res.json() : []
      ),
      fetchCatalogList(),
    ])
      .then(([data, catalog]: [any, any]) => {
        const list = Array.isArray(data) ? data : [];
        const catalogCounts = new Map<string, number>();
        for (const entry of Array.isArray(catalog) ? catalog : []) {
          const parentId = entry?.parentCategoryId;
          if (parentId) catalogCounts.set(parentId, (catalogCounts.get(parentId) ?? 0) + 1);
        }

        setCategories(
          list
            .filter((p: any) => p?.slug && (p.featured === true || p.featured === 'true'))
            .map((p: any) => ({
              name: p.name || p.slug,
              href: `/${encodeURIComponent(p.slug)}`,
              image: p.image || null,
              imageBgColor: p.imageBgColor || null,
              count: catalogCounts.get(p._id) ?? 0,
            }))
        );
      })
      .catch((err) => console.error('Error fetching home categories:', err));

    fetch('/api/top-angebote-products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching deals:', err));

    fetch('/api/furniture-brands/featured?limit=30')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        if (Array.isArray(data)) setBrands(data.filter((b: any) => b.logo && b.logo.trim() !== ''));
      })
      .catch((err) => console.error('Error fetching featured brands:', err));

    fetch('/api/home-products')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (!data?.success || !Array.isArray(data.products)) return;
        setBestSellers(
          data.products.map((p: any) => ({
            _id: p._id,
            title: p.title,
            image: p.image,
            link: p.link,
            price: p.price,
            oldPrice: p.oldPrice,
            saleValue: p.saleValue,
            // Home products store the brand as `brand`; `brandName` is the
            // Top Deals feed's key, so accept either.
            brandName: p.brandName || p.brand,
          }))
        );
      })
      .catch((err) => console.error('Error fetching home products:', err));

    // Products the admin flagged as sponsored in the catalog feed.
    fetch('/api/sponsored-products')
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const list = Array.isArray(data?.products) ? data.products : [];
        setSponsoredPicks(
          list.map((p: any) => ({
            _id: p._id,
            title: p.product_name,
            image: p.aw_image_url || p.merchant_image_url || p.aw_thumb_url,
            link: shopLink(p),
            price: p.display_price || (p.search_price ? String(p.search_price) : ''),
            brandName: p.brand_name,
          }))
        );
      })
      .catch((err) => console.error('Error fetching sponsored products:', err));

    // Only posts the admin flagged as Featured (Admin → Blog) appear here.
    fetch('/api/blog?summary=true&featured=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInspiration(Array.isArray(data) ? data.slice(0, 12) : []))
      .catch(() => setInspiration([]));

    fetch('/api/home-influencer')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (data?.success && data.data?.mainImage) setRoomsImage(data.data.mainImage);
      })
      .catch((err) => console.error('Error fetching home influencer look:', err));

    // Compare section photo + badges — Admin → Home Page Settings.
    fetch('/api/section-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCompareSection(normalizeCompareSection(data)))
      .catch((err) => console.error('Error fetching compare section settings:', err));

    fetch(`/api/page-seo-settings/official-home?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHomeSeo(data || null))
      .catch((err) => console.error('Error fetching home SEO settings:', err));
  }, []);

  // The top deals rail keeps a compact list; the rest live on /topaanbiedingen.
  const railDeals = deals.slice(0, 3);

  // Fall back to the deal feed when no home products are configured, so the
  // best-seller row is never an empty card on a partly configured site.
  const bestSellerProducts = useMemo<RailProduct[]>(
    () =>
      bestSellers.length
        ? bestSellers
        : deals.map((d) => ({
          _id: d._id,
          title: d.title,
          image: d.productLogo,
          link: d.link,
          price: d.price,
          oldPrice: d.oldPrice,
          saleValue: d.saleValue,
          brandName: d.brandName,
        })),
    [bestSellers, deals]
  );

  const showcase = useMemo(
    () => bestSellerProducts.slice(0, 2).map((p) => p.image),
    [bestSellerProducts]
  );

  const faqItems: FAQItem[] = tList<FAQItem>('home.defaultFaqs');
  const faqs = (
    Array.isArray(homeSeo?.faqs) && homeSeo.faqs.length > 0 ? homeSeo.faqs : faqItems
  ) as FAQItem[];

  if (loading) return <div className="h-[600px] bg-gray-100 animate-pulse" />;

  return (
    <div className="section-pattern-1 relative min-h-screen overflow-clip bg-gray-50">
      <HeroBackdrop
        slides={heroSlides}
        activeId={heroActiveId}
        className="absolute inset-x-0 top-0 h-[560px] rounded-b-[18px]"
      />
      <div className="relative w-full px-3 pb-12 pt-4 sm:px-4 sm:pt-5 lg:px-6 2xl:px-8">
        <div className="flex gap-4 xl:gap-5">
          <HomeSidebar />

          <div className="min-w-0 flex-1 space-y-4">
            {/* flow-root contains the floated rail below, so a rail taller than the
                main column pushes the full-width content down instead of overlapping it. */}
            <div className="relative w-full min-w-0 flow-root">
              <CompareHero slides={heroSlides} onActiveChange={setHeroActiveId} />

              {/* From xl the rail floats right, pulled 104px up over the 390px-tall
                  hero so it starts 286px from the hero's top. */}
              <aside className="relative mt-4 mr-2 w-full min-w-0 xl:float-right xl:z-30 xl:-mt-[104px] xl:w-[310px]">
                <HeroSideCards
                  topAd={sponsorAds.sidebar_1}
                  bottomAd={sponsorAds.sidebar_2}
                  thirdAd={sponsorAds.sidebar_3}
                  fourthAd={sponsorAds.sidebar_4}
                  lastAd={sponsorAds.sidebar_5}
                  deals={railDeals}
                />
              </aside>

              <section className="mt-4 w-full min-w-0 space-y-4 xl:pr-[334px]">
                <SponsorAdCarousel ads={sponsorAds.hero_below} />

                {categories.length > 0 && (
                  <div className="pt-2">
                    <CategoryRail categories={categories} />
                  </div>
                )}

                <ProductRail
                  title={t('homeCompare.bestSellers.title')}
                  href="/topaanbiedingen"
                  linkLabel={t('homeCompare.bestSellers.viewAll')}
                  products={bestSellerProducts}
                  emptyLabel={t('homeCompare.bestSellers.empty')}
                />

                {brands.length > 0 && <BrandStrip brands={brands} />}

                <div className="py-1">
                  <CompareProducts settings={compareSection} />
                </div>

                <SponsorAdCarousel ads={sponsorAds.compare_below} />

                {sponsoredPicks.length > 0 && (
                  <ProductRail
                    title={t('homeCompare.sponsoredPicks.title')}
                    href="/categorie"
                    linkLabel={t('homeCompare.sponsoredPicks.viewAll')}
                    products={sponsoredPicks}
                    sponsored
                    emptyLabel={t('homeCompare.bestSellers.empty')}
                  />
                )}

                <div className="w-full min-w-0">
                  <TrustStrip />
                </div>
                
                {inspiration.length > 0 && <InspirationRail items={inspiration} />}

              </section>
            </div>

            {/* ── Full-width below the fold ─────────────────────────────────── */}


            {/* Home page text — Admin → Home Page Settings (page-SEO longContent). */}
            {homeSeo?.longContent?.trim() && <HomeTextSection html={homeSeo.longContent} />}

            {faqs.length > 0 && (
              <FAQSection
                faqs={faqs}
                title={homeSeo?.pageTitle?.trim() || t('faqSection.defaultTitle')}
                subtitle={homeSeo?.pageSubtitle?.trim() || t('home.faqDefaultSubtitle')}
                sectionClassName="rounded-2xl border border-gray-200/80 bg-white py-8 shadow-soft-sm"
              />
            )}

            <p className="text-center text-xs text-gray-500">
              {t('home.faqFooterText')}{' '}
              <Link href="/contact" className="underline hover:text-black">
                {t('home.faqFooterLink')}
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
