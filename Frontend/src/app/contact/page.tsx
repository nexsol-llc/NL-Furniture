'use client';

import Link from 'next/link';
import { Reveal } from '../components/motion/Reveal';
import { useLanguage } from '@/providers/languageContext';

export default function KontaktPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-gray-50 section-pattern-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 to-transparent" />
        <Reveal className="relative max-w-content mx-auto px-6 sm:px-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tight">
            {t('kontakt.heroTitle')}
          </h1>
          <p className="text-2xl sm:text-3xl font-light mb-10 max-w-4xl mx-auto">
            {t('kontakt.heroSubtitle')}
          </p>
          <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto mb-12">
            {t('kontakt.heroText')}
          </p>
        </Reveal>
      </section>

      {/* Kontakt-Infos + Form Grid */}
      <section className="section-pattern-2 py-16 sm:py-24">
        <div className="max-w-content mx-auto px-6 sm:px-12">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Kontakt-Details */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-10">
                {t('kontakt.reachUsHeading')}
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('kontakt.emailHeading')}</h3>
                  <p className="text-lg">
                    <a
                      href="mailto:info@nl-furniture.nl"
                      className="text-black hover:underline transition"
                    >
                      info@nl-furniture.nl
                    </a>
                  </p>
                  <p className="text-gray-600 mt-1">
                    {t('kontakt.emailResponseTime')}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('kontakt.phoneHeading')}</h3>
                  <p className="text-lg">
                    <a
                      href="tel:+13034340950"
                      className="text-black hover:underline transition"
                    >
                      +1 (303) 434-0950
                    </a>
                  </p>
                  <p className="text-gray-600 mt-1">
                    {t('kontakt.phoneNote')}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('kontakt.addressHeading')}</h3>
                  <address className="not-italic text-lg">
                    Nexsol LLC<br />
                    1500 N Grant St Ste R<br />
                    Denver, CO 80203<br />
                    United States of America
                  </address>
                  <p className="text-gray-600 mt-2 text-sm">
                    {t('kontakt.addressNote')}
                  </p>
                </div>

                <div className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">{t('kontakt.moreLinksHeading')}</h3>
                  <ul className="space-y-3 text-lg">
                    <li>
                      <Link href="/colofon" className="text-black hover:underline">
                        {t('footer.imprint')}
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacybeleid" className="text-black hover:underline">
                        {t('common.learnMoreInDatenschutz')}
                      </Link>
                    </li>
                    <li>
                      <Link href="/algemene-voorwaarden" className="text-black hover:underline">
                        {t('footer.termsOfUse')}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: Kontaktformular */}
            <div className="bg-gray-50 p-8 sm:p-12 rounded-3xl shadow-soft-lg border border-gray-200">
              <h2 className="text-3xl font-bold mb-10 text-center md:text-left">
                {t('kontakt.formHeading')}
              </h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('kontakt.formNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder={t('kontakt.formNamePlaceholder')}
                  />
                </div>
                {/* ... rest of form fields unchanged ... */}
                <div className="text-center md:text-left">
                  <button
                    type="submit"
                    className="inline-block bg-primary-600 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-primary-700 transition shadow-soft-lg disabled:opacity-50"
                    disabled
                  >
                    {t('kontakt.formSubmit')}
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-6">
                  {t('kontakt.formPrivacyText')}{' '}
                  <Link href="/privacybeleid" className="underline hover:no-underline">
                    {t('newsletterSection.privacyLinkText')}
                  </Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-black text-white text-center">
        <div className="max-w-content mx-auto px-6 sm:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            {t('kontakt.finalCtaHeading')}
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            {t('kontakt.finalCtaText')}
          </p>
          <Link
            href="#"
            className="inline-block bg-white text-black font-bold px-10 py-5 rounded-full text-xl hover:bg-gray-100 transition shadow-soft-lg"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = 'mailto:info@nl-furniture.nl';
            }}
          >
            {t('kontakt.finalCtaButton')}
          </Link>
        </div>
      </section>
    </main>
  );
}