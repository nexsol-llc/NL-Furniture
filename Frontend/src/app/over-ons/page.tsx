'use client';

import Link from 'next/link';
import PlaceholderImage from '../components/PlaceholderImage';
import { useLanguage } from '@/providers/languageContext';

export default function AboutNLFurniture() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Responsive with proper mobile sizing */}
      <section className="relative -mt-[var(--header-height)] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0">
          <PlaceholderImage
            src={null}
            alt={t('over-ons.heroImageAlt')}
            fill
            className="object-cover brightness-90 contrast-110"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 max-w-5xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-3 sm:mb-4 md:mb-6 tracking-tight text-white drop-shadow-lg">
            {t('over-ons.heroTitle')}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6 md:mb-8 font-light text-white drop-shadow-md px-2">
            {t('over-ons.heroSubtitle')}
          </p>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 text-white drop-shadow-md px-4">
            {t('over-ons.heroText')}
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white font-bold px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full text-base sm:text-lg md:text-xl hover:bg-primary-700 transition shadow-soft-lg"
          >
            {t('over-ons.heroCta')}
          </Link>
        </div>
      </section>

      {/* Willkommen & Einleitung */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-10">
              {t('over-ons.welcomeHeading')}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700 mb-6 sm:mb-8 md:mb-10 px-2">
              {t('over-ons.welcomeText1')}
            </p>
            <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 px-2">
              {t('over-ons.welcomeText2')}
            </p>
          </div>
        </div>
      </section>

      {/* Was wir tun */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            {t('over-ons.whatWeDoHeading')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-black">
                {t('over-ons.smartDiscoveryTitle')}
              </h3>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                {t('over-ons.smartDiscoveryText')}
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-soft-lg hover:shadow-soft-lg transition border border-gray-200">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-black">
                {t('over-ons.wholeMarketTitle')}
              </h3>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                {t('over-ons.wholeMarketText')}
              </p>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 md:mt-16 grid sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 text-center max-w-5xl mx-auto">
            <div className="p-5 sm:p-6 md:p-7 lg:p-8 bg-white rounded-xl sm:rounded-2xl shadow-soft-md">
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">{t('over-ons.browseCompareTitle')}</h4>
              <p className="text-sm sm:text-base text-gray-600">{t('over-ons.browseCompareText')}</p>
            </div>
            <div className="p-5 sm:p-6 md:p-7 lg:p-8 bg-white rounded-xl sm:rounded-2xl shadow-soft-md">
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">{t('over-ons.bestValueTitle')}</h4>
              <p className="text-sm sm:text-base text-gray-600">{t('over-ons.bestValueText')}</p>
            </div>
            <div className="p-5 sm:p-6 md:p-7 lg:p-8 bg-white rounded-xl sm:rounded-2xl shadow-soft-md">
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">{t('over-ons.curatedInspirationTitle')}</h4>
              <p className="text-sm sm:text-base text-gray-600">{t('over-ons.curatedInspirationText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Warum NL Furniture? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 md:mb-10 lg:mb-16">
            {t('over-ons.whyHeading')}
          </h2>
          <p className="text-center text-base sm:text-lg md:text-xl text-gray-700 max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-16 px-4">
            {t('over-ons.whyText')}
          </p>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <div className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-gray-200 text-center hover:shadow-soft-lg transition">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6">{t('over-ons.varietyTitle')}</h3>
              <p className="text-gray-700 text-base sm:text-lg">
                {t('over-ons.varietyText')}
              </p>
            </div>
            <div className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-gray-200 text-center hover:shadow-soft-lg transition">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6">{t('over-ons.easySearchTitle')}</h3>
              <p className="text-gray-700 text-base sm:text-lg">
                {t('over-ons.easySearchText')}
              </p>
            </div>
            <div className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-gray-200 text-center hover:shadow-soft-lg transition">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6">{t('over-ons.localExpertiseTitle')}</h3>
              <p className="text-gray-700 text-base sm:text-lg">
                {t('over-ons.localExpertiseText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unsere Mission */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 text-center">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-12 uppercase tracking-wider">
            {t('over-ons.missionHeading')}
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-5xl mx-auto leading-relaxed text-gray-800 px-4">
            {t('over-ons.missionText')}
          </p>
        </div>
      </section>

      {/* So funktioniert es + CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            {t('over-ons.howItWorksHeading')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 px-4">
            {t('over-ons.howItWorksText')}
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white font-bold px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-full text-lg sm:text-xl md:text-2xl hover:bg-primary-700 transition shadow-soft-lg"
          >
            {t('over-ons.finalCta')}
          </Link>
          <p className="mt-6 sm:mt-8 md:mt-10 text-base sm:text-lg md:text-xl text-gray-600 px-4">
            {t('over-ons.finalText')}
          </p>
        </div>
      </section>
    </div>
  );
}