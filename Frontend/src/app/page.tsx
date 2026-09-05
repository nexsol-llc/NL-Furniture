'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HomeSidebar from './components/home/HomeSidebar';
import CompareHero, { type HeroSlide } from './components/home/CompareHero';
import CompareTray from './components/home/CompareTray';
import TopDealsRail, { type DealItem } from './components/home/TopDealsRail';
import CategoryRail, { type CategoryTile } from './components/home/CategoryRail';
import BrandStrip, { type BrandTile } from './components/home/BrandStrip';
import ProductRail, { type RailProduct } from './components/home/ProductRail';
import InspirationRail, { type InspirationItem } from './components/home/InspirationRail';
import ComparisonCta from './components/home/ComparisonCta';
import TestimonialsSection from './components/home/TestimonialsSection';
import TrustStrip from './components/home/TrustStrip';
import NewsletterBand from './components/home/NewsletterBand';
import {
  FeaturedBrandCard,
  PromoBanner,
  RailNewsletterCard,
  RoomsCard,
  WhyCompareCard,
  type PromoSlide,
} from './components/home/PromoCards';
import FAQSection, { FAQItem } from './components/FAQSection';
import { fetchCatalogList } from '@/lib/categoryCatalog';
import { shopLink } from '@/lib/productFormat';
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
  const [sponsors, setSponsors] = useState<PromoSlide[]>([]);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [brands, setBrands] = useState<BrandTile[]>([]);
  const [bestSellers, setBestSellers] = useState<RailProduct[]>([]);
  const [sponsoredPicks, setSponsoredPicks] = useState<RailProduct[]>([]);
  const [inspiration, setInspiration] = useState<InspirationItem[]>([]);
  const [roomsImage, setRoomsImage] = useState<string | null>(null);
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

    fetch('/api/sponsors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSponsors(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching sponsors:', err));

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
            brandName: p.brandName,
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

    fetch('/api/blog?summary=true')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInspiration(Array.isArray(data) ? data.slice(0, 12) : []))
      .catch(() => setInspiration([]));

    fetch('/api/home-influencer')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (data?.success && data.data?.mainImage) setRoomsImage(data.data.mainImage);
      })
      .catch((err) => console.error('Error fetching home influencer look:', err));

    fetch(`/api/page-seo-settings/official-home?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHomeSeo(data || null))
      .catch((err) => console.error('Error fetching home SEO settings:', err));
  }, []);

  /**
   * Paid slots draw from the sponsor pool by index and wrap around, so a site
   * with a single sponsor still fills every placement instead of leaving holes.
   */
  const slot = useMemo(() => {
    return (index: number): PromoSlide | undefined =>
      sponsors.length ? sponsors[index % sponsors.length] : undefined;
  }, [sponsors]);

  const spotlight = slot(0);
  const railBrand = slot(1);
  // The dark banner gets its own slice once there are enough sponsors to spare;
  // below that it rotates the whole pool rather than rendering nothing.
  const megaBanner = sponsors.length > 2 ? sponsors.slice(2, 5) : sponsors;
  const midSpotlight = slot(5);
  const reviewAd = slot(6);

  // The top deals rail keeps a compact list; the rest live on /topaanbiedingen.
  const railDeals = deals.slice(0, 4);

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
    <div className="section-pattern-1 bg-gray-50">
      <div className="max-w-content mx-auto px-3 pb-12 pt-4 sm:px-4">
        <div className="flex gap-4 xl:gap-5">
          <HomeSidebar />

          <div className="min-w-0 flex-1 space-y-4">
            {/* ── Above the fold: main column + right rail ─────────────────── */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0 space-y-4">
                <CompareHero slides={heroSlides} />

                {spotlight && (
                  <PromoBanner slides={[spotlight]} tone="light" label={t('homeCompare.adLabel')} />
                )}

                {categories.length > 0 && <CategoryRail categories={categories} />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <RoomsCard image={roomsImage || heroSlides[0]?.image} />
                  <WhyCompareCard />
                </div>

                {brands.length > 0 && <BrandStrip brands={brands} />}

                {megaBanner.length > 0 && (
                  <PromoBanner slides={megaBanner} tone="dark" label={t('homeCompare.adLabel')} />
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <CompareTray />
                <TopDealsRail deals={railDeals} />
                {railBrand && <FeaturedBrandCard slide={railBrand} />}
                <RailNewsletterCard />
              </div>
            </div>

            {/* ── Full-width below the fold ─────────────────────────────────── */}
            <TrustStrip />

            <ProductRail
              title={t('homeCompare.bestSellers.title')}
              href="/topaanbiedingen"
              linkLabel={t('homeCompare.bestSellers.viewAll')}
              products={bestSellerProducts}
              emptyLabel={t('homeCompare.bestSellers.empty')}
            />

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

            {midSpotlight && (
              <PromoBanner slides={[midSpotlight]} tone="light" label={t('homeCompare.adLabel')} />
            )}

            <ComparisonCta showcase={showcase} />

            {inspiration.length > 0 && <InspirationRail items={inspiration} />}

            <TestimonialsSection ad={reviewAd} />

            {/* Admin-managed SEO body — Settings → Furniture SEO Content. */}
            {homeSeo?.longContent?.trim() && (
              <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-soft-sm md:p-7">
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-600 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: homeSeo.longContent }}
                />
              </section>
            )}

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

            <NewsletterBand />
          </div>
        </div>
      </div>
    </div>
  );
}
