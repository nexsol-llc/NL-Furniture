"use client";

// src/app/colofon/ImpressumClient.tsx

import Link from 'next/link';
import { useLanguage } from '@/providers/languageContext';
import { LOCALE_TAG } from "@/lib/languageDefaults";
import { Reveal } from '../components/motion/Reveal';

export default function ImpressumClient() {
  const { t, language } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header / Hero-Bereich */}
      <section className="py-16 sm:py-24 bg-gray-50 section-pattern-1 border-b border-gray-200">
        <Reveal className="max-w-content mx-auto px-6 sm:px-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {t('impressum.heroTitle')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('impressum.heroSubtitle')}
          </p>
          <p className="mt-6 text-lg text-gray-500">
            {t('impressum.lastUpdated')} {new Date().toLocaleDateString(LOCALE_TAG[language])}
          </p>
        </Reveal>
      </section>

      {/* Hauptinhalt */}
      <section className="section-pattern-2 py-16 sm:py-24">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-12 prose prose-lg prose-gray max-w-none">
          <h2 className="text-3xl font-bold mt-8 mb-6">{t('impressum.s1Heading')}</h2>
          <p className="mb-6">
            {t('impressum.s1Text')}
          </p>
          <address className="not-italic mb-8">
            <strong>Nexsol LLC</strong><br />
            1500 N Grant St Ste R<br />
            Denver, CO 80203<br />
            United States of America
          </address>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s2Heading')}</h2>
          <p>
            {t('impressum.s2Text')}
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s3Heading')}</h2>
          <ul className="list-none space-y-3 mb-8">
            <li>
              <strong>{t('impressum.phoneLabel')}</strong> +1 (303) 434-0950
            </li>
            <li>
              <strong>{t('impressum.emailLabel')}</strong> <a href="mailto:info@nl-furniture.nl" className="text-black underline hover:no-underline">info@nl-furniture.nl</a>
            </li>
            <li>
              <strong>{t('impressum.websiteLabel')}</strong> <a href="https://www.nl-furniture.nl" className="text-black underline hover:no-underline">https://www.nl-furniture.nl</a>
            </li>
          </ul>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s4Heading')}</h2>
          <p>
            {t('impressum.s4Text1')}{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black underline hover:no-underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p className="mt-4">
            {t('impressum.s4Text2')}
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s5Heading')}</h2>
          <p>
            {t('impressum.s5Text1')}
          </p>
          <p className="mt-4">
            {t('impressum.s5Text2')}
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s6Heading')}</h2>
          <p>
            {t('impressum.s6Text1')}
          </p>
          <p className="mt-4">
            {t('impressum.s6Text2')}
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">{t('impressum.s7Heading')}</h2>
          <p>
            {t('impressum.s7Text')}
          </p>

          {/* Kurzfassung / Footer-Box */}
          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-4">{t('impressum.summaryHeading')}</h3>
            <p className="text-gray-700">
              {t('impressum.summaryText')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA / Zurück */}
      <section className="py-16 bg-gray-50 section-pattern-1 border-t border-gray-200">
        <div className="max-w-content mx-auto px-6 sm:px-12 text-center">
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-primary-700 transition shadow-soft-lg"
          >
            {t('common.backToHome')}
          </Link>
          <p className="mt-6 text-gray-600">
            {t('common.moreQuestions')}{' '}
            <Link href="/contact" className="text-black underline hover:no-underline">
              {t('common.contactUs')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
