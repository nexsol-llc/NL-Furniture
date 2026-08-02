"use client";

// src/app/algemene-voorwaarden/NutzungsbedingungenClient.tsx

import Link from 'next/link';
import { useLanguage } from '@/providers/languageContext';
import { LOCALE_TAG } from "@/lib/languageDefaults";

export default function NutzungsbedingungenClient() {
  const { t, language } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header / Hero-Bereich - Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 border-b border-gray-200">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 tracking-tight px-2">
            {t('agb.heroTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto px-4">
            {t('agb.heroSubtitle')}
          </p>
          <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg text-gray-500">
            {t('impressum.lastUpdated')} {new Date().toLocaleDateString(LOCALE_TAG[language])}
          </p>
        </div>
      </section>

      {/* Hauptinhalt - Responsive Typografie */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-8 sm:mb-10 md:mb-12">
            {t('agb.intro1')}{' '}
            <strong className="break-words">https://www.nl-furniture.nl/</strong> {t('agb.intro2')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-10 sm:mt-12 md:mt-14 lg:mt-16 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s1Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s1Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s2Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s2Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s3Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s3Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s4Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s4Text1')}{' '}
            <strong>
              {t('agb.s4Text2')}
            </strong>{' '}
            {t('agb.s4Text3')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s5Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s5Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s6Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s6Text1')} <strong>{t('agb.s6Text2')}</strong> {t('agb.s6Text3')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s7Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s7Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s8Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s8Text1')}{' '}
            <strong>{t('agb.s8Text2')}</strong>. {t('agb.s8Text3')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s9Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
            {t('agb.s9Text')}
          </p>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-4 sm:mb-5 md:mb-6">
            {t('agb.s10Heading')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-8 sm:mb-10 md:mb-12">
            {t('agb.s10Text1')}{' '}
            <strong>{t('agb.s10Text2')}</strong>. {t('agb.s10Text3')}
          </p>

          {/* Kurzfassung Box - Responsive */}
          <div className="mt-10 sm:mt-12 md:mt-14 lg:mt-16 p-5 sm:p-6 md:p-7 lg:p-8 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
              {t('impressum.summaryHeading')}
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
              {t('agb.summaryText')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA / Zurück - Responsive */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white font-bold px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-full text-base sm:text-lg md:text-xl hover:bg-primary-700 transition shadow-soft-lg"
          >
            {t('common.backToHome')}
          </Link>
          <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg text-gray-600 px-4">
            {t('common.haveQuestions')}{' '}
            <Link href="/contact" className="text-black underline hover:no-underline font-medium">
              {t('common.contactUs')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
