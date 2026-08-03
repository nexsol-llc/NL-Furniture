'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import useSWR from 'swr';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/languageContext";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

function DSearchIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-md bg-primary-600 text-white shadow-soft shadow-primary-500/30"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        <path d="M12 2a.75.75 0 0 1 .75.75c0 4.14 3.36 7.5 7.5 7.5a.75.75 0 0 1 0 1.5c-4.14 0-7.5 3.36-7.5 7.5a.75.75 0 0 1-1.5 0c0-4.14-3.36-7.5-7.5-7.5a.75.75 0 0 1 0-1.5c4.14 0 7.5-3.36 7.5-7.5A.75.75 0 0 1 12 2z" />
      </svg>
    </span>
  );
}

export default function CoupanHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [search, setSearch] = useState("");

  const { data } = useSWR<{ brands: Brand[] }>("/api/brands", fetcher);
  const storesToShow: Brand[] = data?.brands || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const filteredStores = search.trim().length > 0
    ? storesToShow.filter((store) =>
        store.name.toLowerCase().includes(search.toLowerCase())
      )
    : storesToShow;

  const isActiveLink = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!search.trim()) return;

    const match = storesToShow.find((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );

    if (match) {
      router.push(`/kortingscodes/view/${match.slug}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
    setSearch("");
  };

  return (
    <header className="sticky top-0 z-[999] flex flex-col px-3 pt-3 transition-all duration-300 md:px-6">

      {/* MAIN HEADER */}
      <div className={`relative bg-primary-700/85 backdrop-blur-xl text-white border border-primary-500/40 transition-all duration-300 rounded-2xl ${scrolled ? 'shadow-depth-2 shadow-primary-900/20' : 'shadow-depth-2 shadow-primary-900/10'}`}>

        <div className="max-w-[1450px] mx-auto px-3 sm:px-4 md:px-6 h-14 md:h-16 flex items-center gap-2">

          {/* Logo */}
          <Link href="/" className="relative flex h-full w-[145px] shrink-0 items-center md:w-[215px] ml-1 md:ml-4" aria-label={t('coupanHeader.homeAriaLabel')}>
            <Image 
              src="/nl-furniture_logo_light.png" 
              alt="NL FURNITURE" 
              width={1000} 
              height={249}
              priority 
              className="h-auto w-full object-contain transition-all duration-300"
            />
          </Link>

          {/* Mobile Search Bar — fills space between logo and hamburger */}
          <form onSubmit={handleSearchSubmit} className="flex md:hidden flex-1 max-w-[160px] min-w-[108px] ml-auto relative rounded-full p-[1px] bg-white/35 shadow-soft shadow-primary-900/20 transition focus-within:bg-white/60 focus-within:shadow-soft-md focus-within:shadow-primary-900/25">
            <div className="relative w-full bg-gray-50 rounded-full flex items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('coupanHeader.mobileSearchPlaceholder')}
                className="w-full bg-transparent border-none py-2.5 pl-10 pr-8 text-xs text-gray-900 placeholder:text-gray-500 outline-none focus:ring-0"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80" aria-label={t('coupanHeader.searchAriaLabel')}>
                <DSearchIcon size={18} />
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* CENTER NAV - Desktop */}
          <nav className="hidden lg:flex items-center gap-x-6 xl:gap-x-8 text-sm whitespace-nowrap shrink-0 ml-2 xl:ml-6">
            <Link href="/kortingscodes/lente-deals" className={`rounded-full px-3 py-2 transition font-semibold ${isActiveLink("/kortingscodes/lente-deals") ? "bg-white text-primary-700 shadow-soft" : "text-white/90 hover:bg-white/15 hover:text-white"}`}>
              {t('coupanHeader.navSpecialOffers')}
            </Link>

            <Link href="/kortingscodes/winkels" className={`rounded-full px-3 py-2 transition font-semibold ${isActiveLink("/kortingscodes/winkels") ? "bg-white text-primary-700 shadow-soft" : "text-white/90 hover:bg-white/15 hover:text-white"}`}>
              {t('coupanHeader.navShop')}
            </Link>

            <Link href="/categorie" className={`rounded-full px-3 py-2 transition font-semibold ${isActiveLink("/categorie") ? "bg-white text-primary-700 shadow-soft" : "text-white/90 hover:bg-white/15 hover:text-white"}`}>{t('coupanHeader.navCategories')}</Link>
            <Link href="/magazine" className={`rounded-full px-3 py-2 transition font-semibold ${isActiveLink("/magazine") ? "bg-white text-primary-700 shadow-soft" : "text-white/90 hover:bg-white/15 hover:text-white"}`}>{t('coupanHeader.navMagazine')}</Link>
          </nav>

          {/* RIGHT - Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-6 relative group rounded-full p-[1px] bg-white/35 shadow-soft-md shadow-primary-900/20 transition duration-300 focus-within:bg-white/60 focus-within:shadow-soft-lg focus-within:shadow-primary-900/25">
            <form onSubmit={handleSearchSubmit} className="relative w-full bg-gray-50 rounded-full flex items-center">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('coupanHeader.desktopSearchPlaceholder')}
                  className="w-full bg-transparent border-none py-3.5 pl-14 pr-11 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-0"
                />
                <button type="submit" className="absolute left-5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80 flex items-center justify-center" aria-label={t('coupanHeader.searchAriaLabel')}>
                  <DSearchIcon size={22} />
                </button>
                
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {search && (
                <div className="absolute top-full mt-3 w-full bg-white text-black shadow-soft-lg shadow-gray-900/15 rounded-2xl max-h-72 overflow-auto z-50 py-2 border border-gray-100">
                  {storesToShow
                    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 8)
                    .map((b) => (
                      <div
                        key={b._id}
                        onClick={() => { router.push(`/kortingscodes/view/${b.slug}`); setSearch(""); }}
                        className="px-5 py-3 hover:bg-primary-50 cursor-pointer flex items-center gap-3 text-sm transition"
                      >
                        {b.logo && (
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-white border border-gray-200 overflow-hidden p-1">
                            <Image src={b.logo} alt={b.name} width={32} height={32} className="object-contain w-full h-full" />
                          </div>
                        )}
                        <span className="font-medium">{b.name}</span>
                      </div>
                    ))}
                  {filteredStores.length === 0 && (
                    <div className="px-5 py-8 text-center text-gray-500">{t('coupanHeader.noBrandFound')}</div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-white/15 rounded-full transition text-white shrink-0 flex items-center justify-center"
            aria-label={t('coupanHeader.openMenuAriaLabel')}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>

        {search && (
          <div className="absolute left-3 right-3 top-full z-[1000] mt-2 max-h-64 overflow-auto rounded-2xl border border-gray-100 bg-white py-2 text-black shadow-soft-lg shadow-gray-900/20 md:hidden">
            {filteredStores.slice(0, 6).map((b) => (
              <div
                key={b._id}
                onClick={() => { router.push(`/kortingscodes/view/${b.slug}`); setSearch(""); }}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition hover:bg-primary-50"
              >
                {b.logo && (
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white p-1">
                    <Image src={b.logo} alt={b.name} width={32} height={32} className="h-full w-full object-contain" />
                  </div>
                )}
                <span className="truncate font-medium">{b.name}</span>
              </div>
            ))}
            {filteredStores.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400">{t('coupanHeader.noBrandFound')}</div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-white z-[999] transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto text-black bg-gradient-to-b from-white via-white to-primary-50/40">
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition" aria-label={t('coupanHeader.closeMenuAriaLabel')}>
              <X size={28} className="text-gray-800" />
            </button>
          </div>

          <div className="text-center">
            <Image
              src="/nl-furniture_logo_dark.png"
              alt="NL FURNITURE"
              width={1600}
              height={400}
              priority
              className="mx-auto h-[130px] w-auto object-contain"
            />
          </div>

          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-bold text-lg mb-4">{t('coupanHeader.menuHeading')}</h3>
              <div className="flex flex-col gap-2 text-base">
                <Link href="/kortingscodes/lente-deals" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-xl px-4 py-3 transition font-semibold ${isActiveLink("/kortingscodes/lente-deals") ? "bg-primary-600 text-white shadow-soft-md shadow-primary-500/25" : "bg-white/80 text-gray-800 hover:bg-gray-100"}`}>
                  {t('coupanHeader.navSpecialOffers')}
                </Link>
                <Link href="/kortingscodes/winkels" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-xl px-4 py-3 transition font-semibold ${isActiveLink("/kortingscodes/winkels") ? "bg-primary-600 text-white shadow-soft-md shadow-primary-500/25" : "bg-white/80 text-gray-800 hover:bg-gray-100"}`}>
                  {t('coupanHeader.navShop')}
                </Link>
                <Link href="/categorie" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-xl px-4 py-3 transition font-semibold ${isActiveLink("/categorie") ? "bg-primary-600 text-white shadow-soft-md shadow-primary-500/25" : "bg-white/80 text-gray-800 hover:bg-gray-100"}`}>
                  {t('coupanHeader.navCategories')}
                </Link>
                <Link href="/magazine" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-xl px-4 py-3 transition font-semibold ${isActiveLink("/magazine") ? "bg-primary-600 text-white shadow-soft-md shadow-primary-500/25" : "bg-white/80 text-gray-800 hover:bg-gray-100"}`}>
                  {t('coupanHeader.navMagazine')}
                </Link>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-bold text-lg mb-4">{t('coupanHeader.shopsHeading')}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-base">
                {storesToShow.slice(0, 12).map((store) => (
                  <Link
                    key={store._id}
                    href={`/kortingscodes/view/${store.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="truncate rounded-lg bg-white/75 px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700"
                  >
                    {store.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/kortingscodes/winkels"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-5 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-900"
              >
                {t('coupanHeader.viewAllShops')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
