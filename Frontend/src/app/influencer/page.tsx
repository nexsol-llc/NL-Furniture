"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import FAQSection from "../components/FAQSection";
import { Reveal } from "../components/motion/Reveal";
import { useLanguage } from "@/providers/languageContext";

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
      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
      onError={() => setImgError(true)}
    />
  );
}

interface InfluencerBrand {
  username: string;
  name: string;
  displayName: string;
  logo: string;
  lookCount: number;
}

export default function InfluencerPage() {
  const { t } = useLanguage();
  const influencerFAQs = [
    { question: t('influencerListPage.faq1Q'), answer: t('influencerListPage.faq1A') },
    { question: t('influencerListPage.faq2Q'), answer: t('influencerListPage.faq2A') },
    { question: t('influencerListPage.faq3Q'), answer: t('influencerListPage.faq3A') },
    { question: t('influencerListPage.faq4Q'), answer: t('influencerListPage.faq4A') },
  ];
  const [brands, setBrands] = useState<InfluencerBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/influencer-brands")
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.brands || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.username.toLowerCase().includes(search.toLowerCase()) ||
      b.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, InfluencerBrand[]> = {};
  filtered.forEach((b) => {
    const letter = b.name.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(b);
  });
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <>
      {/* HERO */}
      <section className="bg-white section-pattern-1 py-6 md:py-8 border-b" style={{ paddingTop: "calc(var(--header-height) + 2.5rem)" }}>

        <div className="max-w-content mx-auto px-4 text-center">
          <Reveal>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            {t('influencerListPage.heroTitle1')}
            <br />
            <span className="text-primary-600">{t('influencerListPage.heroTitle2')}</span>
          </h1>

          <p className="text-xs md:text-base text-gray-700 max-w-xl mx-auto mb-4">
            {t('influencerListPage.heroText')}
          </p>
          </Reveal>

          <div className="max-w-xl mx-auto">
            <div className="flex items-center border-2 border-primary-600 rounded-full overflow-hidden bg-white shadow-soft">
              <input
                type="text"
                placeholder={t('influencerListPage.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 outline-none text-sm placeholder-gray-500"
              />
              <button className="bg-primary-600 text-white px-4 md:px-6 py-2.5 font-medium text-sm hover:bg-primary-700 transition-colors flex items-center gap-2">
                <Search size={15} />
                {t('influencerListPage.search')}
              </button>
            </div>
          </div>

          {!loading && (
            <p className="mt-3 text-xs text-gray-400">
              {t('influencerListPage.totalCount', { count: brands.length })}
            </p>
          )}
        </div>
      </section>

      {loading && (
        <div className="flex items-center justify-center py-32 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="text-sm">{t('influencerListPage.loadingInfluencers')}</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="bg-white">
          {filtered.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-medium text-gray-600">
                {t('influencerListPage.noInfluencerFound', { search })}
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-4 text-sm text-primary-600 underline hover:text-primary-700"
              >
                {t('influencerListPage.resetSearch')}
              </button>
            </div>
          ) : (
            sortedLetters.map((letter) => (
              <section
                key={letter}
                className="max-w-content mx-auto px-4 py-10 border-t border-gray-100 first:border-t-0"
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-7">{letter}</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-7">
                  {grouped[letter].map((brand) => (
                    <Link
                      key={brand.username}
                      href={`/influencer/${brand.username}`}
                      className="group flex flex-col items-center text-center transition"
                    >
                      <div className="w-full aspect-[3/2] flex items-center justify-center bg-white rounded-2xl shadow-soft border border-gray-100 group-hover:shadow-soft-md group-hover:border-primary-600/30 transition duration-300 overflow-hidden">
                        <BrandLogo logo={brand.logo} name={brand.name} />
                      </div>

                      <span className="mt-3 text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                        {brand.displayName}
                      </span>

                      <span className="mt-0.5 text-[11px] text-gray-400">
                        @{brand.username}
                      </span>

                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Sparkles size={10} />
                        {t('influencerListPage.looksCount', { count: brand.lookCount })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {!loading && (
        <section className="max-w-content mx-auto px-4 py-12 text-center border-t bg-white section-pattern-2">
          <p className="text-gray-600 mb-4">
            {t('influencerListPage.footerCtaText')}
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition"
          >
            {t('influencerListPage.becomeInfluencer')}
          </Link>
        </section>
      )}

      <FAQSection faqs={influencerFAQs} title={t('influencerListPage.faqTitle')} />
    </>
  );
}
