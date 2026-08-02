'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NewsletterForm from '../../components/NewsletterForm';
import PlaceholderImage from '../../components/PlaceholderImage';
import useSWR from 'swr';
import { useLanguage } from '@/providers/languageContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Coupon = {
  _id: string;
  title: string;
  discount?: number;
  discountText?: string;
  featured?: boolean;
  isExpired?: boolean;
  url?: string;
  brandSlug?: string;
};

type Brand = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  featured?: boolean;
  coupons?: Coupon[];
};

type FeaturedCoupon = Coupon & { brandName: string; brandLogo?: string; brandSlug: string };

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => res.json());

const SpringDealsBanner: React.FC = () => {
  const { t } = useLanguage();
  const discountLabel = (c: Coupon) => {
    const text = c.discountText?.trim();
    if (text) return text;
    if (c.discount) return `${c.discount}% ${t('springSavecationPage.discountSuffix')}`;
    return t('springSavecationPage.genericOffer');
  };
  const DEFAULT_FAQS = [
    { question: t('springSavecationPage.faq1Q'), answer: t('springSavecationPage.faq1A') },
    { question: t('springSavecationPage.faq2Q'), answer: t('springSavecationPage.faq2A') },
    { question: t('springSavecationPage.faq3Q'), answer: t('springSavecationPage.faq3A') },
    { question: t('springSavecationPage.faq4Q'), answer: t('springSavecationPage.faq4A') },
    { question: t('springSavecationPage.faq5Q'), answer: t('springSavecationPage.faq5A') },
    { question: t('springSavecationPage.faq6Q'), answer: t('springSavecationPage.faq6A') },
  ];
  const { data: brandsData } = useSWR<{ brands: Brand[] }>('/api/brands', fetcher);
  const { data: settings } = useSWR(`/api/page-seo-settings/sonderangebote`, fetcher);
  // Newsletter content managed from /admin/newsletter (section_settings).
  const { data: nlSettings } = useSWR('/api/section-settings', fetcher);
  const nl: any = nlSettings?.settings?.newsletter || {};
  const newsletterImage = nl.image || null;
  const overlayTitle = nl.overlayTitle ?? t('newsletterSection.overlayTitle');
  const overlaySubtitle = nl.overlaySubtitle ?? t('newsletterSection.overlaySubtitle');
  const formTitle = nl.formTitle ?? t('newsletterSection.formTitle');
  const formSubtitle = nl.formSubtitle ?? t('newsletterSection.formSubtitle');
  const disclaimer = nl.disclaimer ?? t('newsletterSection.disclaimer');

  const brands = brandsData?.brands || [];
  const featuredBrands = brands.filter((b) => b.featured);
  const featuredCoupons: FeaturedCoupon[] = brands.flatMap((b) =>
    (b.coupons || [])
      .filter((c) => c.featured && c.isExpired !== true)
      .map((c) => ({ ...c, brandName: b.name, brandLogo: b.logo, brandSlug: b.slug }))
  );

  const description =
    settings?.longContent && String(settings.longContent).trim()
      ? settings.longContent
      : t('springSavecationPage.defaultDescription');
  const faqs =
    Array.isArray(settings?.faqs) && settings.faqs.length > 0 ? settings.faqs : DEFAULT_FAQS;

  return (
    <>
      {/* Main Purple Banner */}
      <div className="bg-[#d8b4fe] py-4 md:py-6 flex items-center justify-between relative overflow-hidden">
        <div className="ml-6 md:ml-12 hidden sm:block">
          <Image
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop"
            alt={t('springSavecationPage.shoppingBagAlt')}
            width={120}
            height={120}
            className="drop-shadow-lg rounded-2xl object-cover"
            priority
          />
        </div>
        <div className="text-center flex-1 px-4">
          <p className="text-white text-lg md:text-xl font-medium">{t('springSavecationPage.discountBanner')}</p>
          <h1 className="text-[#6b21a8] text-4xl md:text-6xl font-bold tracking-tight">
            {t('springSavecationPage.heading')}
          </h1>
        </div>
        <div className="mr-6 md:mr-12 hidden sm:block">
          <Image
            src="https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=400&fit=crop"
            alt={t('springSavecationPage.modernFurnitureAlt')}
            width={120}
            height={120}
            className="rounded-3xl shadow-soft-lg object-cover"
            priority
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        {/* ── Beste Möbelgeschäfte für den Frühling — Featured stores ── */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {t('springSavecationPage.bestStoresHeading')}
          </h2>

          {featuredBrands.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              {t('springSavecationPage.noStoresFeatured')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand._id}
                  href={`/kortingscodes/view/${brand.slug}`}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-28 h-28 border border-gray-200 rounded-2xl flex items-center justify-center mb-3 bg-white shadow-soft overflow-hidden p-2 group-hover:shadow-soft-md group-hover:-translate-y-0.5 transition">
                    {brand.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{brand.name}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 line-clamp-1">{brand.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Beste Frühlingsangebote & Deals 2026 — Featured coupons ── */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('springSavecationPage.bestDealsHeading')}
          </h2>

          {featuredCoupons.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              {t('springSavecationPage.noOffersActive')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {featuredCoupons.map((coupon) => (
                <Link
                  key={coupon._id}
                  href={`/kortingscodes/view/${coupon.brandSlug}`}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-soft-lg transition flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🔥</span>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded">
                      {discountLabel(coupon)}
                    </span>
                  </div>

                  <div className="h-12 flex items-center mb-4">
                    {coupon.brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coupon.brandLogo}
                        alt={coupon.brandName}
                        className="h-full w-auto max-w-full object-contain"
                      />
                    ) : (
                      <span className="font-bold text-gray-700">{coupon.brandName}</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{coupon.title}</p>

                  <span className="mt-auto w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm transition text-center">
                    {t('springSavecationPage.couponCodeButton')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== SEO LONG DESCRIPTION SECTION ===== */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {t('springSavecationPage.seoHeading')}
          </h2>
          <div
            className="prose prose-gray max-w-none text-gray-600 space-y-4 text-sm md:text-base leading-relaxed
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-5 [&_a]:text-primary-600 [&_a]:underline
              [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="w-full bg-white py-12 md:py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('springSavecationPage.faqHeading')}
          </h2>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {faqs.map((faq: { question: string; answer: string }, index: number) => (
              <div key={index} className="border-b border-gray-200 py-4 sm:py-5 last:border-b-0">
                <h3 className="text-sm md:text-base font-semibold text-gray-950 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NEWSLETTER SECTION ================= */}
      <section className="bg-white py-6 border-t">
        <div className="max-w-content mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-soft">
            <div className="grid md:grid-cols-2">
              <div className="relative h-64 md:h-auto min-h-[16rem]">
                <PlaceholderImage
                  src={newsletterImage}
                  alt={overlayTitle || t('newsletterSection.formTitle')}
                  fill
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-6 left-6 text-white">
                  {overlayTitle && (
                    <h3 className="text-xl md:text-2xl font-bold">
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

              <div className="p-8 md:p-12 flex flex-col justify-center">
                {formTitle && (
                  <h3 className="text-2xl font-bold mb-3">
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
    </>
  );
};

export default SpringDealsBanner;
