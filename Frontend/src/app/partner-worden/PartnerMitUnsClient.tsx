"use client";

// src/app/partner-worden/PartnerMitUnsClient.tsx

import Link from 'next/link';
import Image from 'next/image';
import PlaceholderImage from '../components/PlaceholderImage';
import { Reveal } from '../components/motion/Reveal';
import { useLanguage } from '@/providers/languageContext';

export default function PartnerMitUnsClient() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Responsive */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 to-gray-900/20" />
        </div>
        <Reveal className="relative max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 md:mb-8 tracking-tight px-2">
            {t('partnerMitUns.heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto px-4">
            {t('partnerMitUns.heroSubtitle')}
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-4">
            {t('partnerMitUns.heroText')}
          </p>
          <Link
            href="#form"
            className="inline-block bg-primary-600 text-white font-bold px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-full text-base sm:text-lg md:text-xl hover:bg-primary-700 transition shadow-soft-lg"
          >
            {t('partnerMitUns.heroCta')}
          </Link>
        </Reveal>
      </section>

      {/* Why Partner Section - Responsive */}
      <section className="section-pattern-1 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            {t('partnerMitUns.whyHeading')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-gray-50 p-5 sm:p-6 md:p-7 lg:p-8 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{t('partnerMitUns.reach1Title')}</h3>
              <p className="text-sm sm:text-base text-gray-700">
                {t('partnerMitUns.reach1Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-5 sm:p-6 md:p-7 lg:p-8 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{t('partnerMitUns.reach2Title')}</h3>
              <p className="text-sm sm:text-base text-gray-700">
                {t('partnerMitUns.reach2Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-5 sm:p-6 md:p-7 lg:p-8 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{t('partnerMitUns.reach3Title')}</h3>
              <p className="text-sm sm:text-base text-gray-700">
                {t('partnerMitUns.reach3Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-5 sm:p-6 md:p-7 lg:p-8 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{t('partnerMitUns.reach4Title')}</h3>
              <p className="text-sm sm:text-base text-gray-700">
                {t('partnerMitUns.reach4Text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Heading - Responsive */}
      <section className="py-12 sm:py-16 md:py-20 bg-black text-white text-center">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 px-4">
            {t('partnerMitUns.ctaHeading')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto px-4">
            {t('partnerMitUns.ctaText')}
          </p>
        </div>
      </section>

      {/* Partnership Inquiry Form - Responsive */}
      <section id="form" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 section-pattern-2">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            {t('partnerMitUns.formHeading')}
          </h2>
          <p className="text-center text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 px-4">
            {t('partnerMitUns.formSubtitle')}
          </p>

          <form className="space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formNameLabel')}
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                placeholder={t('partnerMitUns.formNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formCompanyLabel')}
              </label>
              <input
                type="text"
                id="company"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                placeholder={t('partnerMitUns.formCompanyPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formWebsiteLabel')}
              </label>
              <input
                type="url"
                id="website"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                placeholder="https://ihre-firma.de"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formBusinessTypeLabel')}
              </label>
              <select
                id="businessType"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-base"
              >
                <option value="">{t('partnerMitUns.formSelectPlaceholder')}</option>
                <option value="manufacturer">{t('partnerMitUns.formBusinessManufacturer')}</option>
                <option value="retailer">{t('partnerMitUns.formBusinessRetailer')}</option>
                <option value="designer">{t('partnerMitUns.formBusinessDesigner')}</option>
                <option value="other">{t('partnerMitUns.formBusinessOther')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formMarketLabel')}
              </label>
              <select
                id="market"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-base"
              >
                <option value="">{t('partnerMitUns.formSelectPlaceholder')}</option>
                <option value="germany">{t('partnerMitUns.formMarketGermany')}</option>
                <option value="france">{t('partnerMitUns.formMarketFrance')}</option>
                <option value="europe">{t('partnerMitUns.formMarketEurope')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="feedType" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formFeedTypeLabel')}
              </label>
              <select
                id="feedType"
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-base"
              >
                <option value="">{t('partnerMitUns.formSelectPlaceholder')}</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="api">API</option>
                <option value="affiliate-network">{t('partnerMitUns.formFeedAffiliateNetwork')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {t('partnerMitUns.formMessageLabel')}
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                placeholder={t('partnerMitUns.formMessagePlaceholder')}
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="inline-block bg-primary-600 text-white font-bold px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-full text-base sm:text-lg md:text-xl hover:bg-primary-700 transition shadow-soft-lg disabled:opacity-50"
                disabled
              >
                {t('partnerMitUns.formSubmit')}
              </button>
            </div>

            <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-5 md:mt-6 px-4">
              {t('partnerMitUns.formPrivacyText')}{' '}
              <Link href="/privacybeleid" className="underline hover:no-underline">
                {t('common.learnMoreInDatenschutz')}
              </Link>.
            </p>
          </form>
        </div>
      </section>

      {/* Visual Inspiration Section - Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            {t('partnerMitUns.visualHeading')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* Bild 1 */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-soft-lg transition-shadow">
              <Image
                src="https://www.2010officefurniture.com/wp-content/uploads/2024/03/04-darran-room-divider-screens.jpg"
                alt={t('partnerMitUns.visualAlt1')}
                width={600}
                height={400}
                className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Bild 2 */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-soft-lg transition-shadow">
              <PlaceholderImage
                src={null}
                alt={t('partnerMitUns.visualAlt2')}
                width={600}
                height={400}
                className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Bild 3 */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-soft-lg transition-shadow">
              <Image
                src="https://www.caffelattehome.com/img/inspirations/the-art-of-culinary-elegance-exploring-the-minimalist-luxury-kitchen/the-art-of-culinary-elegance-exploring-the-minimalist-luxury-kitchen.jpg"
                alt={t('partnerMitUns.visualAlt3')}
                width={600}
                height={400}
                className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </div>
          <p className="text-center mt-8 sm:mt-10 md:mt-12 text-base sm:text-lg md:text-xl text-gray-600 px-4">
            {t('partnerMitUns.visualFooter')}
          </p>
        </div>
      </section>

      {/* Final CTA - Responsive */}
      <section className="py-12 sm:py-16 md:py-20 bg-black text-white text-center">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 px-4">
            {t('partnerMitUns.finalCtaHeading')}
          </h2>
          <Link
            href="#form"
            className="inline-block bg-white text-black font-bold px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-full text-base sm:text-lg md:text-xl hover:bg-gray-100 transition shadow-soft-lg"
          >
            {t('partnerMitUns.finalCtaButton')}
          </Link>
        </div>
      </section>
    </main>
  );
}
