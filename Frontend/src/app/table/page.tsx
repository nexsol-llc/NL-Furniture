// app/tische/page.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/providers/languageContext';

export default function TischePage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Einfacher Header (optional – kann entfernt oder ersetzt werden) */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('tischePage.headerTitle')}</h2>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-500 mb-6">
          <ol className="flex items-center flex-wrap gap-2">
            <li>
              <a href="#" className="hover:text-zinc-800 transition-colors">
                {t('tischePage.breadcrumbAll')}
              </a>
            </li>
            <li className="text-zinc-400">›</li>
            <li>
              <a href="#" className="hover:text-zinc-800 transition-colors">
                {t('tischePage.breadcrumbLiving')}
              </a>
            </li>
            <li className="text-zinc-400">›</li>
            <li>
              <a href="#" className="hover:text-zinc-800 transition-colors">
                {t('tischePage.breadcrumbFurniture')}
              </a>
            </li>
            <li className="text-zinc-400">›</li>
            <li className="font-medium text-zinc-900">{t('tischePage.breadcrumbTables')}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10">
          {/* ─── LEFT FILTER SIDEBAR ──────────────────────────────────────── */}
          <aside className="lg:col-span-3 space-y-9 lg:space-y-10">
            {/* Unterkategorien – bleibt gleich */}
            <div>
              <h3 className="text-xl font-medium text-zinc-900 mb-5">{t('tischePage.subcategoriesHeading')}</h3>
              <ul className="space-y-3 text-sm text-zinc-700">
                <li className="flex justify-between">
                  <span>Arbeitstische</span>
                  <span className="text-zinc-500">≥5.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Bartische</span>
                  <span className="text-zinc-500">4</span>
                </li>
                <li className="flex justify-between">
                  <span>Beistelltische</span>
                  <span className="text-zinc-500">≥20.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Eckige Tische</span>
                  <span className="text-zinc-500">3.855</span>
                </li>
                <li className="flex justify-between">
                  <span>Esstische</span>
                  <span className="text-zinc-500">≥4.000</span>
                </li>
                <li className="flex justify-between">
                  <span>Glastische</span>
                  <span className="text-zinc-500">17</span>
                </li>
              </ul>
              <button className="mt-4 text-sm text-zinc-600 hover:text-zinc-900 underline">
                {t('tischePage.showMore')}
              </button>
            </div>

            {/* Preis Range */}
            <div>
              <h3 className="text-xl font-medium text-zinc-900 mb-5">{t('tischePage.priceHeading')}</h3>
              <div className="flex items-center gap-3 text-sm text-zinc-600 mb-4">
                <span>€ 1</span>
                <div className="relative flex-1 h-1 bg-zinc-200 rounded-full">
                  <div className="absolute left-0 top-0 h-full w-[92%] bg-zinc-800 rounded-full" />
                  <div className="absolute -left-2 -top-2 w-5 h-5 bg-white border-2 border-zinc-800 rounded-full shadow-soft" />
                  <div className="absolute -right-2 -top-2 w-5 h-5 bg-white border-2 border-zinc-800 rounded-full shadow-soft" />
                </div>
                <span>€ 5.403</span>
              </div>
              <button className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium rounded-lg transition">
                {t('tischePage.save')}
              </button>
            </div>

            {/* Kostenloser Versand */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-zinc-300 text-black focus:ring-black"
                />
                <span className="font-medium text-zinc-900">{t('tischePage.freeShipping')}</span>
              </label>
            </div>

            {/* Sale */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5">{t('tischePage.saleHeading')}</h3>
              <div className="space-y-2.5 text-sm">
                {[t('tischePage.saleAll'), t('tischePage.saleOver20'), t('tischePage.saleOver40'), t('tischePage.saleOver70')].map(
                  (label) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                      />
                      <span className="text-zinc-700">{label}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Marke */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5">{t('tischePage.brandHeading')}</h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder=""
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 outline-none"
                />
                <svg
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto text-sm pr-1">
                {[
                  { name: 'vidaXL', count: '>7000' },
                  { name: 'Generic', count: '>2000' },
                  { name: 'Vicco', count: '>1000' },
                  { name: 'Dmora', count: '>1000' },
                  { name: 'IKEA', count: '877' },
                  { name: 'Home24', count: '>500' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                    />
                    <span className="text-zinc-700">
                      {item.name} <span className="text-zinc-500">({item.count})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Farbe */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5">{t('tischePage.colorHeading')}</h3>
              <div className="space-y-3.5 text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="h-6 w-6 rounded-full bg-white border border-zinc-400 shadow-soft" />
                  {t('tischePage.colorWhite')}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="h-6 w-6 rounded-full bg-black border border-zinc-400 shadow-soft" />
                  {t('tischePage.colorBlack')}
                </label>
              </div>
            </div>

            {/* ─── NEU: Material ────────────────────────────────────────────── */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5 flex items-center justify-between">
                {t('tischePage.materialHeading')}
                <button className="text-zinc-400 hover:text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2 text-sm pr-1">
                {[
                  { name: 'Akazie', count: '764' },
                  { name: 'Aluminium', count: '807' },
                  { name: 'Bambus', count: '213' },
                  { name: 'Baumwolle', count: '241' },
                  { name: 'Biber', count: '1' },
                  // Füge mehr hinzu, wenn gewünscht
                ].map((item) => (
                  <label key={item.name} className="flex items-center justify-between cursor-pointer hover:bg-zinc-50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                      />
                      <span className="text-zinc-700">{item.name}</span>
                    </div>
                    <span className="text-zinc-500">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─── NEU: Raum ────────────────────────────────────────────────── */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5 flex items-center justify-between">
                {t('tischePage.roomHeading')}
                <button className="text-zinc-400 hover:text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'Arbeitszimmer', count: '>5.000' },
                  { name: 'Badezimmer', count: '10' },
                  { name: 'Esszimmer', count: '>4.000' },
                  { name: 'Flur', count: '10' },
                  { name: 'Garten', count: '9' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center justify-between cursor-pointer hover:bg-zinc-50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                      />
                      <span className="text-zinc-700">{item.name}</span>
                    </div>
                    <span className="text-zinc-500">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─── NEU: Weitere ─────────────────────────────────────────────── */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3.5 flex items-center justify-between">
                {t('tischePage.moreHeading')}
                <button className="text-zinc-400 hover:text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'im Set', count: '160' },
                  { name: 'Kombinierbar', count: '>1000' },
                  { name: 'Mit Ausziehfunkion', count: '899' },
                  { name: 'Mit Bettkasten', count: '9' },
                  { name: 'mit Klappfunkion', count: '>1000' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center justify-between cursor-pointer hover:bg-zinc-50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                      />
                      <span className="text-zinc-700">{item.name}</span>
                    </div>
                    <span className="text-zinc-500">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ─── RIGHT MAIN CONTENT (unverändert) ─────────────────────────── */}
          <div className="lg:col-span-9">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-light text-zinc-900">{t('tischePage.pageTitle')}</h1>
                <p className="mt-2 text-zinc-600 text-sm sm:text-base">
                  {t('tischePage.compareText', { count: '33.963', shops: '20' })}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm whitespace-nowrap">
                <span className="text-zinc-600">{t('tischePage.sortBy')}</span>
                <select className="border border-zinc-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400">
                  <option>{t('tischePage.sortPopular')}</option>
                  <option>{t('tischePage.sortPriceAsc')}</option>
                  <option>{t('tischePage.sortPriceDesc')}</option>
                  <option>{t('tischePage.sortNewest')}</option>
                  <option>{t('tischePage.sortRating')}</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="group bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-soft-md transition-all duration-200 border border-zinc-100"
                >
                  <div className="relative aspect-[4/3] bg-zinc-50">
                    <img
                      src={`https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80&${i}`}
                      alt={t('tischePage.productImageAlt')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-soft hover:bg-white transition">
                      <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>

                    {i % 3 === 1 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                        -34%
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 min-h-[2.75rem]">
                      {i % 2 === 0
                        ? 'home24 Beistelltisch Eiche massiv 60×60 cm'
                        : 'IKEA LAGKAPTEN / ALEX Schreibtisch Weiß 140×65 cm'}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">home24 / IKEA</p>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-zinc-900">
                        {i % 3 === 0 ? '129,90 €' : i % 3 === 1 ? '84,99 €' : '219,00 €'}
                      </span>
                      {i % 3 === 1 && (
                        <span className="text-sm text-zinc-500 line-through">129,90 €</span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-green-700 font-medium">
                      {i % 4 === 0 ? t('tischePage.shippingFree') : t('tischePage.shippingFrom')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 lg:mt-16 text-center">
              <button className="px-10 py-4 border border-zinc-300 rounded-full text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400 transition text-base font-medium">
                {t('tischePage.loadMore')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}