"use client";

// src/app/magazine/verkopen-op-nl-furniture/SellOnNLFurnitureMagazineClient.tsx

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/providers/languageContext';

export default function SellOnNLFurnitureMagazineClient() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section mit Hintergrundbild */}
      <section className="relative -mt-[var(--header-height)] py-20 sm:py-32 bg-gray-50 overflow-hidden min-h-[85vh] flex items-center">
        {/* Hintergrundbild */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1618221195710-dd5b8f4d1e8f"
            alt={t('sellOnNlFurniture.heroImageAlt')}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-900/50 to-transparent" />
        </div>

        <div className="relative max-w-content mx-auto px-6 sm:px-12 text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tight">
            {t('sellOnNlFurniture.heroTitle')}
          </h1>
          <p className="text-2xl sm:text-3xl font-light mb-10 max-w-4xl mx-auto">
            {t('sellOnNlFurniture.heroSubtitle')}
          </p>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-12 opacity-90">
            {t('sellOnNlFurniture.heroText')}
          </p>
          <Link
            href="#form"
            className="inline-block bg-white text-black font-bold px-10 py-5 rounded-full text-xl hover:bg-gray-100 transition shadow-soft-lg"
          >
            {t('sellOnNlFurniture.heroCta')}
          </Link>
        </div>
      </section>

      {/* Why List Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-content mx-auto px-6 sm:px-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            {t('sellOnNlFurniture.whyHeading')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">{t('sellOnNlFurniture.reach1Title')}</h3>
              <p className="text-gray-700">
                {t('sellOnNlFurniture.reach1Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">{t('sellOnNlFurniture.reach2Title')}</h3>
              <p className="text-gray-700">
                {t('sellOnNlFurniture.reach2Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">{t('sellOnNlFurniture.reach3Title')}</h3>
              <p className="text-gray-700">
                {t('sellOnNlFurniture.reach3Text')}
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">{t('sellOnNlFurniture.reach4Title')}</h3>
              <p className="text-gray-700">
                {t('sellOnNlFurniture.reach4Text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Process */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-content mx-auto px-6 sm:px-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            {t('sellOnNlFurniture.onboardingHeading')}
          </h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-8 bg-white rounded-3xl shadow-soft-md border border-gray-200">
              <div className="text-5xl font-bold text-black mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">{t('sellOnNlFurniture.step1Title')}</h3>
              <p className="text-gray-600">{t('sellOnNlFurniture.step1Text')}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-soft-md border border-gray-200">
              <div className="text-5xl font-bold text-black mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">{t('sellOnNlFurniture.step2Title')}</h3>
              <p className="text-gray-600">{t('sellOnNlFurniture.step2Text')}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-soft-md border border-gray-200">
              <div className="text-5xl font-bold text-black mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">{t('sellOnNlFurniture.step3Title')}</h3>
              <p className="text-gray-600">{t('sellOnNlFurniture.step3Text')}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-soft-md border border-gray-200">
              <div className="text-5xl font-bold text-black mb-4">4</div>
              <h3 className="text-xl font-bold mb-3">{t('sellOnNlFurniture.step4Title')}</h3>
              <p className="text-gray-600">{t('sellOnNlFurniture.step4Text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Retailer Application Form */}
      <section id="form" className="py-20 sm:py-24 bg-white">
        <div className="max-w-[900px] mx-auto px-6 sm:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            {t('sellOnNlFurniture.formHeading')}
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12">
            {t('sellOnNlFurniture.formSubtitle')}
          </p>

          <form className="space-y-8">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formBrandLabel')}
              </label>
              <input
                type="text"
                id="brand"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder={t('sellOnNlFurniture.formBrandPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formWebsiteLabel')}
              </label>
              <input
                type="url"
                id="website"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="https://mein-shop.de"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formContactLabel')}
              </label>
              <input
                type="text"
                id="contact"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder={t('sellOnNlFurniture.formContactPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formEmailLabel')}
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="name@mein-shop.de"
              />
            </div>

            <div>
              <label htmlFor="productCount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formProductCountLabel')}
              </label>
              <select
                id="productCount"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              >
                <option value="">{t('partnerMitUns.formSelectPlaceholder')}</option>
                <option value="100+">100+</option>
                <option value="1000+">1.000+</option>
                <option value="10000+">10.000+</option>
                <option value="other">{t('sellOnNlFurniture.formProductCountOther')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="affiliateNetwork" className="block text-sm font-medium text-gray-700 mb-2">
                {t('sellOnNlFurniture.formAffiliateNetworkLabel')}
              </label>
              <select
                id="affiliateNetwork"
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              >
                <option value="">{t('sellOnNlFurniture.formAffiliateNetworkNone')}</option>
                <option value="awin">Awin</option>
                <option value="daisycon">Daisycon</option>
                <option value="tradedoubler">Tradedoubler</option>
                <option value="in-house">{t('sellOnNlFurniture.formAffiliateNetworkInHouse')}</option>
                <option value="other">{t('partnerMitUns.formBusinessOther')}</option>
              </select>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="inline-block bg-primary-600 text-white font-bold px-12 py-6 rounded-full text-xl hover:bg-primary-700 transition shadow-soft-lg disabled:opacity-50"
                disabled
              >
                {t('sellOnNlFurniture.formSubmit')}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              {t('sellOnNlFurniture.formPrivacyText')}{' '}
              <Link href="/privacybeleid" className="underline hover:no-underline">
                {t('common.learnMoreInDatenschutz')}
              </Link>.
            </p>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-black text-white text-center">
        <div className="max-w-content mx-auto px-6 sm:px-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8">
            {t('sellOnNlFurniture.finalCtaHeading')}
          </h2>
          <Link
            href="#form"
            className="inline-block bg-white text-black font-bold px-12 py-6 rounded-full text-xl hover:bg-gray-100 transition shadow-soft-lg"
          >
            {t('sellOnNlFurniture.finalCtaButton')}
          </Link>
        </div>
      </section>
    </main>
  );
}
