"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { Search, Store, Ticket } from "lucide-react";
import { Reveal } from "../../components/motion/Reveal";
import { useLanguage } from "@/providers/languageContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StoreBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  couponCount?: number;
}

export default function GeschaeftPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<{ brands: StoreBrand[] }>("/api/coupon-stores", fetcher);

  // Only brands that actually have (active) coupons.
  const stores = (data?.brands || []).filter((b) => (b.couponCount ?? 0) > 0);

  const filtered = search.trim()
    ? stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : stores;

  return (
    <main className="min-h-screen pt-[12px] sm:pt-[12px] pb-16">
      {/* Header band */}
      <section className="bg-primary-700/90 backdrop-blur-xl text-white">
        <Reveal className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-2">
            <Store size={26} />
            <h1 className="text-2xl md:text-3xl font-bold">{t('geschaeftPage.heading')}</h1>
          </div>
          <p className="text-primary-100 text-sm md:text-base max-w-2xl">
            {t('geschaeftPage.subtitle')}
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('geschaeftPage.searchPlaceholder')}
              className="w-full bg-white text-black placeholder:text-gray-400 rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </Reveal>
      </section>

      {/* Grid */}
      <section className="coupon-section-pattern-1 max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Store size={44} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">
              {stores.length === 0
                ? t('geschaeftPage.noStoresAvailable')
                : t('geschaeftPage.noStoreFound')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((store) => (
              <Link
                key={store._id}
                href={`/kortingscodes/view/${store.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all p-5 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full border-2 border-gray-100 bg-white flex items-center justify-center overflow-hidden mb-3">
                  {store.logo ? (
                    <Image
                      src={store.logo}
                      alt={store.name}
                      width={64}
                      height={64}
                      className="object-contain w-16 h-16 p-1"
                    />
                  ) : (
                    <Store size={26} className="text-gray-300" />
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate w-full group-hover:text-primary-700 transition-colors">
                  {store.name}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                  <Ticket size={13} />
                  {store.couponCount} {store.couponCount === 1 ? t('geschaeftPage.couponSingular') : t('geschaeftPage.couponPlural')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
