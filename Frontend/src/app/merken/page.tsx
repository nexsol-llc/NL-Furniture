"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import FAQSection from "../components/FAQSection";
import { useLanguage } from "@/providers/languageContext";

// Fallback if logo fails to load
function BrandLogo({ logo, name }: { logo: string; name: string }) {
  const [imgError, setImgError] = useState(false);

  if (!logo || imgError) {
    return (
      <span className="text-3xl font-extrabold text-gray-200 group-hover:text-primary-600 transition-colors duration-300">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      className="max-h-[65px] max-w-[120px] object-contain p-3 group-hover:scale-105 transition-transform duration-300"
      onError={() => setImgError(true)}
    />
  );
}

interface Merchant {
  name: string;
  slug: string;
  logo: string;
}

export default function MarkenPage() {
  const { t } = useLanguage();
  const markenFAQs = [
    { question: t('markenPage.faq1Q'), answer: t('markenPage.faq1A') },
    { question: t('markenPage.faq2Q'), answer: t('markenPage.faq2A') },
    { question: t('markenPage.faq3Q'), answer: t('markenPage.faq3A') },
    { question: t('markenPage.faq4Q'), answer: t('markenPage.faq4A') },
    { question: t('markenPage.faq5Q'), answer: t('markenPage.faq5A') },
  ];
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    // New API: furniture-brands directory (bare array, ordered by sort order then title)
    fetch("/api/furniture-brands")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMerchants(
          list
            .map((b: any) => ({
              name: b.title || b.name || "",
              slug: b.slug,
              logo: b.logo || "",
            }))
            .filter((b: Merchant) => b.name && b.slug)
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter by search (ignore entries without a name)
  const filtered = merchants.filter(
    (m) => m.name && m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group A-Z
  const grouped: Record<string, Merchant[]> = {};
  filtered.forEach((m) => {
    const letter = m.name.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(m);
  });
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <>
      {/* ─── HERO ─── */}
      <section
        className="bg-white pb-8 border-b"
        style={{ paddingTop: "calc(var(--header-height) + 2.5rem)" }}
      >
        <div className="max-w-content mx-auto px-4 text-center">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            {t('markenPage.heroTitle1')}
            <br />
            <span className="text-primary-600">{t('markenPage.heroTitle2')}</span>
          </h1>

          <p className="text-xs md:text-base text-gray-700 max-w-xl mx-auto mb-4">
            {t('markenPage.heroText')}
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center border-2 border-primary-600 rounded-full overflow-hidden bg-white shadow-soft">
              <input
                type="text"
                placeholder={t('markenPage.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 outline-none text-sm placeholder-gray-500"
              />
              <button className="bg-primary-600 text-white px-4 md:px-6 py-2.5 font-medium text-sm hover:bg-primary-700 transition-colors flex items-center gap-2">
                <Search size={15} />
                {t('markenPage.search')}
              </button>
            </div>
          </div>

          {/* Total count */}
          {!loading && (
            <p className="mt-3 text-xs text-gray-400">
              {t('markenPage.totalCount', { count: merchants.length })}
            </p>
          )}
        </div>
      </section>

      {/* ─── LOADING ─── */}
      {loading && (
        <div className="flex items-center justify-center py-32 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="text-sm">{t('markenPage.loadingBrands')}</p>
          </div>
        </div>
      )}

      {/* ─── A-Z LIST ─── */}
      {!loading && (
        <div className="bg-white">
          {filtered.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-medium text-gray-600">
                {t('markenPage.noBrandFound', { search })}
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-4 text-sm text-primary-600 underline hover:text-primary-700"
              >
                {t('markenPage.resetSearch')}
              </button>
            </div>
          ) : (
            sortedLetters.map((letter) => (
              <section
                key={letter}
                className="max-w-content mx-auto px-4 py-10 border-t border-gray-100 first:border-t-0"
              >
                {/* Letter heading */}
                <h3 className="text-3xl font-bold text-gray-900 mb-7">
                  {letter}
                </h3>

                {/* Brand cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-7">
                  {grouped[letter].map((merchant) => (
                    <Link
                      key={merchant.slug}
                      href={`/merken/${merchant.slug}`}
                      className="group flex flex-col items-center text-center transition"
                    >
                      {/* Logo / Initial box */}
                      <div className="w-full aspect-[3/2] flex items-center justify-center bg-white rounded-2xl shadow-soft border border-gray-100 group-hover:shadow-soft-md group-hover:border-primary-600/30 transition duration-300 overflow-hidden">
                        <BrandLogo logo={merchant.logo} name={merchant.name} />
                      </div>

                      {/* Name */}
                      <span className="mt-3 text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                        {merchant.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* ─── FOOTER CTA ─── */}
      {!loading && (
        <section className="max-w-content mx-auto px-4 py-12 text-center border-t bg-white">
          <p className="text-gray-600 mb-4">
            {t('markenPage.footerCtaText')}
          </p>
          <button className="bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition">
            {t('markenPage.suggestRetailer')}
          </button>
        </section>
      )}

      {/* ─── APPLY TO SELL ─── */}
      <section className="bg-white py-20 md:py-28 border-t">
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
              {t('markenPage.applyHeading')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              {t('markenPage.applyText')}
            </p>
          </div>

          <form className="space-y-9 max-w-3xl mx-auto">
            {[
              { label: t('markenPage.fieldCompanyName'), type: "text", placeholder: t('markenPage.fieldCompanyName') },
              { label: t('markenPage.fieldCompanyWebsite'), type: "url", placeholder: "https://deinefirma.de/" },
              { label: t('markenPage.fieldContactPerson'), type: "text", placeholder: t('markenPage.fieldContactPersonPlaceholder') },
              { label: t('markenPage.fieldEmail'), type: "email", placeholder: "kontakt@deinefirma.com" },
              { label: t('markenPage.fieldPhone'), type: "tel", placeholder: "+49 123 456789" },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  {field.label} <span className="text-red-600">*</span>
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                />
              </div>
            ))}

            <div className="pt-4 text-center">
              <button
                type="submit"
                className="bg-primary-600 text-white px-12 py-5 rounded-xl font-medium text-lg hover:bg-primary-700 transition w-full md:w-auto"
              >
                {t('markenPage.submitApplication')}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              {t('markenPage.privacyNote')}
            </p>
          </form>
        </div>
      </section>

      <FAQSection faqs={markenFAQs} />
    </>
  );
}