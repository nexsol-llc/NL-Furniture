"use client";

// src/app/components/Footer.tsx

import Link from 'next/link';
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useLanguage } from '@/providers/languageContext';
import type { Language } from '@/lib/languageDefaults';

// Social platforms and their icon paths. Rendered in this order; each icon
// only appears when an admin has set a URL for it under Settings → Social Links.
export const SOCIAL_PLATFORMS: { key: string; label: string; path: string }[] = [
  { key: 'facebook', label: 'Facebook', path: 'M14 13.5h2.5l1-3H14v-2c0-.8.2-1.3 1.3-1.3H17V4.5c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5v2.2H6v3h2.5V20h5.5v-6.5z' },
  { key: 'tiktok', label: 'TikTok', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18.96.93 2.26 1.48 3.58 1.6v3.7c-1.28-.15-2.52-.7-3.51-1.55-.26-.22-.49-.47-.7-.73v6.52c0 2.21-.9 4.31-2.52 5.8-1.73 1.66-4.14 2.54-6.53 2.4-2.54-.08-4.98-1.33-6.42-3.41C.84 16.29.62 13.58 1.7 11.16c1.1-2.48 3.56-4.19 6.27-4.4v3.78c-1.32.17-2.5 1.01-3.03 2.22-.57 1.25-.39 2.8.48 3.86.88 1.13 2.3 1.76 3.73 1.67 1.4-.04 2.67-.93 3.19-2.22.19-.53.28-1.1.28-1.67V0h.005z' },
  { key: 'pinterest', label: 'Pinterest', path: 'M12 2C6.48 2 2 6.48 2 12c0 4.27 2.68 7.91 6.46 9.39-.09-.8-.16-2.02.03-2.89.18-.78 1.16-4.93 1.16-4.93s-.3-.59-.3-1.46c0-1.37.79-2.39 1.78-2.39.84 0 1.25.63 1.25 1.39 0 .85-.54 2.11-.82 3.29-.23.97.49 1.77 1.44 1.77 1.73 0 3.06-1.83 3.06-4.47 0-2.34-1.68-3.97-4.08-3.97-2.78 0-4.41 2.08-4.41 4.24 0 .84.32 1.74.73 2.24.08.1.09.19.07.29-.07.31-.24.99-.28 1.12-.05.21-.17.25-.39.15-1.46-.68-2.37-2.81-2.37-4.52 0-3.68 2.67-7.06 7.71-7.06 4.05 0 7.19 2.88 7.19 6.74 0 4.02-2.54 7.26-6.06 7.26-1.18 0-2.3-.61-2.68-1.34l-.73 2.78c-.26 1.01-1 2.28-1.49 3.08C10.02 21.82 11 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z' },
  { key: 'instagram', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { key: 'youtube', label: 'YouTube', path: 'M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.047 0 12 0 12s0 3.953.502 5.837a3.002 3.002 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.002 3.002 0 0 0 2.11-2.107c.502-1.884.502-5.837.502-5.837s0-3.953-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { key: 'linkedin', label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z' },
  { key: 'x', label: 'X (Twitter)', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
];

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.social_links) setSocialLinks(data.social_links);
      })
      .catch(() => {});
  }, []);

  const activeSocials = SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]?.trim());

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#FAF6F0] text-[#333333] pt-16 pb-12 border-t border-[#E8E3DB] font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
        {/* Original Logo Image */}
        {/* We apply a negative top margin here to counter the empty transparent space inside the logo file itself */}
        <div className="text-center mb-6 -mt-4 md:-mt-6 lg:-mt-8 overflow-hidden">
          <Image
            src="/nl-furniture_logo_dark.png"
            alt="NL FURNITURE"
            width={1600}
            height={400}
            priority
            className="
              mx-auto
              h-[90px]
              md:h-[110px]
              lg:h-[130px]
              w-auto
              object-contain
            "
          />
        </div>

        {/* Folge Uns + Social Icons */}
        {activeSocials.length > 0 && (
          <div className="text-center mb-10 -mt-2">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-4 text-[#7A7570]">
              {t('footer.followUs')}
            </p>
            <div className="flex justify-center gap-4">
              {activeSocials.map((platform) => (
                <a
                  key={platform.key}
                  href={socialLinks[platform.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform.label}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111111] text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d={platform.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Links Section */}
        {/* Mobile View: Vertical Stack */}
        <div className="md:hidden text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-5 text-[#7A7570]">
            {t('footer.aboutHeading')}
          </p>
          <div className="flex flex-col items-center gap-3.5">
            <Link
              href="/over-ons"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.aboutUs')}
            </Link>
            <Link
              href="/magazine"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.magazine')}
            </Link>
            <Link
              href="/magazine"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.inspiration')}
            </Link>
            <Link
              href="/contact"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.contact')}
            </Link>
            <Link
              href="/partner-worden"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.cooperations')}
            </Link>
            <Link
              href="/algemene-voorwaarden"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.termsOfUse')}
            </Link>
            <Link
              href="/privacybeleid"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/colofon"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.imprint')}
            </Link>
            <Link
              href="/advertentieverklaring"
              className="text-[14px] text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4"
            >
              {t('footer.advertisingDisclosure')}
            </Link>
          </div>
        </div>

        {/* Desktop View: Multi-column Grid */}
        <div className="hidden md:grid grid-cols-3 gap-16 max-w-4xl w-full mb-10 text-center border-t border-[#E8E3DB] pt-10 px-8">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#7A7570] mb-5">
              {t('footer.aboutHeading')}
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/over-ons" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.magazine')}
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.inspiration')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#7A7570] mb-5">
              {t('footer.partnershipsHeading')}
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/contact" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link href="/partner-worden" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.cooperations')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#7A7570] mb-5">
              {t('footer.legalHeading')}
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/algemene-voorwaarden" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.termsOfUse')}
                </Link>
              </li>
              <li>
                <Link href="/privacybeleid" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/colofon" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.imprint')}
                </Link>
              </li>
              <li>
                <Link href="/advertentieverklaring" className="text-sm text-[#4A4A4A] hover:text-black transition-colors font-medium hover:underline underline-offset-4">
                  {t('footer.advertisingDisclosure')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative inline-block text-left mb-10">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#CCCCCC] text-[12px] font-semibold uppercase tracking-wider bg-white text-[#333333] hover:border-black transition-colors min-w-[120px] justify-between shadow-soft-sm"
          >
            <span className="flex items-center gap-2">
              <span>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </span>
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          
          {langOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white border border-[#E5E5E5] shadow-soft-lg rounded-lg py-2 z-50 text-center">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  onClick={() => {
                    setLanguage(option.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-1.5 hover:bg-gray-50 transition-colors ${
                    option.code === currentLang.code ? 'text-black' : 'text-[#7A7570]'
                  }`}
                >
                  <span>{option.flag}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer / Copyright text */}
        <div className="w-full text-center text-[11px] text-[#7A7570] leading-relaxed max-w-2xl mx-auto px-4 mb-4">
          {t('footer.copyright')}
        </div>
      </div>

      {/* Scroll to top button */}
      <div className="absolute bottom-8 right-6 md:right-12">
        <button
          onClick={scrollToTop}
          className="flex items-center justify-center w-10 h-10 bg-[#333333] hover:bg-black text-white rounded-full shadow-soft-md hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1"
          aria-label={t('footer.scrollToTop')}
        >
          <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
