'use client';

import Image from 'next/image';
import { Reveal } from '../../components/motion/Reveal';
import { useLanguage } from '@/providers/languageContext';

function HeroCashbackBanner() {
  const { t } = useLanguage();
  return (
    <section className="relative w-full bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 py-8 md:py-12 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="relative container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 max-w-7xl">
        
        {/* Left Coin Badge */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400/80 via-purple-300/60 to-white/30 backdrop-blur-sm shadow-soft-lg border border-white/20 animate-pulse-slow" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-t from-purple-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs md:text-sm font-bold text-pink-200 tracking-wide">RetailMeNot</p>
              <p className="text-[10px] md:text-xs text-white/90">Cashback</p>
            </div>
          </div>
          <div className="absolute -top-3 -right-3 w-8 h-8 md:w-10 md:h-10 bg-yellow-300/70 rounded-full blur-xl animate-twinkle" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-cyan-300/60 rounded-full blur-lg animate-twinkle delay-1000" />
        </div>

        {/* Center Text */}
        <Reveal className="text-center text-white">
          <p className="text-base md:text-lg font-semibold tracking-wide opacity-90 mb-2 md:mb-3">
            {t('cashbackPage.bannerTagline')}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
            {t('cashbackPage.bannerHeading')}
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-bold mt-2 md:mt-3 drop-shadow-md">
            {t('cashbackPage.bannerFromBrands')} <span className="text-yellow-300">4.000+</span> {t('cashbackPage.bannerBrandsSuffix')}
          </p>
          <p className="text-sm md:text-base mt-3 opacity-90 font-medium">
            {t('cashbackPage.bannerYearsSaving')}
          </p>
        </Reveal>

        {/* Right Coin Badge */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0 hidden md:flex">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400/80 via-purple-300/60 to-white/30 backdrop-blur-sm shadow-soft-lg border border-white/20 animate-pulse-slow" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-t from-purple-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <p className="text-xs md:text-sm font-bold text-pink-200 tracking-wide">4.000+</p>
            <p className="text-[10px] md:text-xs text-white/90 font-semibold">MARKEN</p>
          </div>
          <div className="absolute -top-4 -left-3 w-9 h-9 bg-yellow-300/70 rounded-full blur-xl animate-twinkle delay-500" />
          <div className="absolute -bottom-3 -right-2 w-7 h-7 bg-cyan-300/60 rounded-full blur-lg animate-twinkle delay-1500" />
        </div>
      </div>

      <div className="md:hidden flex justify-center mt-6">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400/80 via-purple-300/60 to-white/30 backdrop-blur-sm shadow-soft-lg border border-white/20" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-t from-purple-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <p className="text-xs font-bold text-pink-200 tracking-wide">4.000+</p>
            <p className="text-[10px] text-white/90 font-semibold">MARKEN</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CashbackPage() {
  const { t } = useLanguage();
  const featuredOffers = [
    { logo: "https://images.unsplash.com/photo-1583846783213-7a5f6f7b5b1a?w=100&h=100&fit=crop", brand: "IKEA", cashback: "10% Cashback" },
    { logo: "https://images.unsplash.com/photo-1616486338812-3bade4dd0d6d?w=100&h=100&fit=crop", brand: "WAYFAIR", cashback: "12% Cashback" },
    { logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop", brand: "ASHLEY FURNITURE", cashback: "8% Cashback" },
    { logo: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=100&h=100&fit=crop", brand: "POTTERY BARN", cashback: "15% Cashback" },
    { logo: "https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=100&h=100&fit=crop", brand: "WEST ELM", cashback: "7% Cashback" },
    { logo: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=100&h=100&fit=crop", brand: "CRATE & BARREL", cashback: "8% Cashback" },
    { logo: "https://images.unsplash.com/photo-1583846783213-7a5f6f7b5b1a?w=100&h=100&fit=crop", brand: "HOME DEPOT", cashback: "5% Cashback" },
    { logo: "https://images.unsplash.com/photo-1616486338812-3bade4dd0d6d?w=100&h=100&fit=crop", brand: "AMAZON FURNITURE", cashback: "10% Cashback" },
  ];

  const topCashback = [
    { brand: "IKEA", rate: "Bis zu 10%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/IKEA_Logo.svg/2560px-IKEA_Logo.svg.png", bg: "bg-blue-600" },
    { brand: "Wayfair", rate: "12%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Wayfair_logo.svg/2560px-Wayfair_logo.svg.png", bg: "bg-purple-600" },
    { brand: "Ashley", rate: "8%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ashley_Furniture_Logo.svg/2560px-Ashley_Furniture_Logo.svg.png", bg: "bg-red-700" },
    { brand: "Pottery Barn", rate: "15%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Pottery_Barn_logo.svg/2560px-Pottery_Barn_logo.svg.png", bg: "bg-green-700" },
    { brand: "West Elm", rate: "7%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/West_Elm_logo.svg/2560px-West_Elm_logo.svg.png", bg: "bg-amber-700" },
    { brand: "Crate & Barrel", rate: "8%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Crate_%26_Barrel_logo.svg/2560px-Crate_%26_Barrel_logo.svg.png", bg: "bg-stone-600" },
    { brand: "Home Depot", rate: "5%", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/The_Home_Depot_logo.svg/2560px-The_Home_Depot_logo.svg.png", bg: "bg-orange-600" },
    { brand: "Target", rate: "2%", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Target_Corporation_logo.svg", bg: "bg-red-600" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. Hero Section */}
      <HeroCashbackBanner />

      {/* 2. Today's Featured Cash Back - Furniture Edition */}
      <section className="coupon-section-pattern-1 max-w-7xl mx-auto px-4 py-10">
        <p className="text-center text-sm mb-6 text-gray-600">
          {t('cashbackPage.affiliateNoticePrefix')}{' '}
          <a href="#" className="underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">
            {t('cashbackPage.affiliateNoticeLink')}
          </a>.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left mb-6 text-gray-900">
          {t('cashbackPage.todaysOffersHeading')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
          {featuredOffers.map((offer, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-soft-md overflow-hidden cursor-pointer hover:shadow-soft-lg transition-shadow duration-200 border border-gray-200"
            >
              <div className="p-5 flex justify-center items-center bg-white h-28 md:h-32">
                <Image
                  src={offer.logo}
                  alt={offer.brand}
                  width={80}
                  height={80}
                  className="max-h-20 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <div className="p-4 border-t border-gray-200 text-center">
                <p className="uppercase text-xs font-semibold text-gray-600 mb-1 tracking-wide">
                  {offer.brand}
                </p>
                <p className="font-bold text-base flex items-center justify-center gap-2 text-gray-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {offer.cashback}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Top Cash Back + Banner */}
      <section className="w-full bg-white coupon-section-pattern-2 py-8 md:py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-2">
            {t('cashbackPage.topCashbackHeading')}
          </h2>

          <div className="flex items-start justify-start md:justify-center gap-5 md:gap-8 overflow-x-auto py-8 snap-x snap-mandatory scrollbar-hide">
            {topCashback.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[110px] md:min-w-[130px] snap-center text-center"
              >
                <div
                  className={`relative w-20 h-20 md:w-24 md:h-24 ${item.bg} rounded-full flex items-center justify-center shadow-soft-lg border-4 border-white overflow-hidden`}
                >
                  <Image
                    src={item.logo}
                    alt={`${item.brand} logo`}
                    width={56}
                    height={56}
                    className="w-11 h-11 md:w-14 md:h-14 object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="mt-3 font-bold text-gray-800 text-sm md:text-base uppercase tracking-tight">
                  {item.brand}
                </p>
                <p className="mt-1 text-green-600 font-semibold text-xs md:text-sm">
                  {item.rate} {t('cashbackPage.cashbackSuffix')}
                </p>
              </div>
            ))}
          </div>

          {/* Yellow Banner - Furniture Edition */}
          <div className="mt-6 w-full bg-yellow-400 rounded-xl overflow-hidden shadow-soft-lg border-4 border-yellow-500/40">
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8 px-5 lg:px-10 py-6 lg:py-7 text-black font-black uppercase tracking-wider text-base lg:text-xl xl:text-2xl">
              
              {/* Left: TAKING OFF + UP TO 70% OFF */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 bg-black text-yellow-300 px-6 py-4 rounded-lg shadow-inner border border-yellow-400/50 min-w-[260px] lg:min-w-[340px]">
                <div className="text-center sm:text-left">
                  <div className="text-sm lg:text-base font-extrabold opacity-90">{t('cashbackPage.startsOn')}</div>
                  <div className="text-3xl lg:text-4xl font-black leading-none">3/5</div>
                </div>
                <div className="hidden sm:block border-l border-yellow-400/60 h-14 self-center" />
                <div className="text-center sm:text-left">
                  <div className="text-sm lg:text-base font-bold">{t('cashbackPage.upTo')}</div>
                  <div className="text-2xl lg:text-3xl font-black tracking-[0.1em]">{t('cashbackPage.discountLabel')}</div>
                </div>
              </div>

              {/* Center: Stamps + Flip-style text */}
              <div className="flex items-center gap-6 lg:gap-10 flex-1 justify-center flex-wrap lg:flex-nowrap">
                {/* Furniture stamp */}
                <div className="relative w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-white/30 border-4 border-white/50 flex items-center justify-center shadow-soft-lg rotate-[-6deg]">
                  <div className="text-center text-xs lg:text-sm font-bold text-black/90 leading-tight">
                    {t('cashbackPage.furnitureStampLabel')}
                    <br />
                    <span className="text-[9px] lg:text-xs opacity-80">{t('cashbackPage.saleStampLabel')}</span>
                  </div>
                </div>

                {/* Main flip-board text */}
                <div className="relative text-center lg:text-left">
                  <div className="text-black drop-shadow-[6px_6px_0_black] lg:drop-shadow-[10px_10px_0_black] tracking-[0.25em] lg:tracking-[0.4em]">
                    {t('cashbackPage.springFurniture')}
                  </div>
                  <div className="absolute inset-0 text-black/20 blur-sm translate-x-2 translate-y-2 pointer-events-none">
                    {t('cashbackPage.springFurniture')}
                  </div>
                </div>

                {/* Living Room stamp */}
                <div className="relative w-16 h-16 lg:w-24 lg:h-24 rounded-[40%] bg-white/25 border-4 border-dashed border-white/60 flex items-center justify-center shadow-soft-lg rotate-[5deg] overflow-hidden">
                  <div className="text-center text-xs lg:text-sm font-bold text-black/90 leading-tight px-2">
                    {t('cashbackPage.livingRoomStampLabel')}
                    <br />
                    <span className="text-[9px] lg:text-xs opacity-80">{t('cashbackPage.offersStampLabel')}</span>
                  </div>
                </div>
              </div>

              {/* Right: Explore More */}
              <button className="bg-black text-yellow-300 hover:bg-gray-900 px-7 py-4 rounded-lg font-bold text-lg lg:text-xl shadow-soft-lg border border-yellow-400/40 transition transform hover:scale-105 min-w-[180px] whitespace-nowrap">
                {t('cashbackPage.exploreMore')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. All Cash Back Offers - Furniture Focus */}
      <section className="coupon-section-pattern-1 max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('cashbackPage.allOffersHeading')}
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            {t('cashbackPage.offersAvailable')}
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 text-sm font-semibold text-gray-700 border-b border-gray-200">
          {[
            t('cashbackPage.categoryAll'),
            t('cashbackPage.categoryLivingRoom'),
            t('cashbackPage.categoryBedroom'),
            t('cashbackPage.categoryDiningRoom'),
            t('cashbackPage.categoryOfficeFurniture'),
            t('cashbackPage.categoryGardenFurniture'),
            t('cashbackPage.categoryMattresses'),
            t('cashbackPage.categorySofas'),
            t('cashbackPage.categoryWardrobes'),
            t('cashbackPage.categoryTables'),
            t('cashbackPage.categoryDecor'),
            t('cashbackPage.categoryLighting'),
          ].map((cat, i) => (
            <button
              key={i}
              className={`whitespace-nowrap pb-2 transition ${
                i === 0
                  ? "border-b-2 border-black text-black"
                  : "hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            { brand: "IKEA WOHNZIMMER", rate: "20% Cashback", logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop" },
            { brand: "WAYFAIR ESSZIMMER", rate: "18% Cashback", logo: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=100&h=100&fit=crop" },
            { brand: "ASHLEY SCHLAFZIMMER", rate: "16% Cashback", logo: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=100&h=100&fit=crop" },
            { brand: "POTTERY BARN", rate: "16% Cashback", logo: "https://images.unsplash.com/photo-1583846783213-7a5f6f7b5b1a?w=100&h=100&fit=crop" },
            { brand: "WEST ELM", rate: "16% Cashback", logo: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=100&h=100&fit=crop" },
            { brand: "CRATE & BARREL", rate: "15% Cashback", logo: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=100&h=100&fit=crop" },
            { brand: "HOME DEPOT", rate: "15% Cashback", logo: "https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=100&h=100&fit=crop" },
            { brand: "AMAZON MÖBEL", rate: "15% Cashback", logo: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=100&h=100&fit=crop" },
            { brand: "TARGET FURNITURE", rate: "14% Cashback", logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop" },
            { brand: "BOB'S DISCOUNT", rate: "14% Cashback", logo: "https://images.unsplash.com/photo-1616486338812-3bade4dd0d6d?w=100&h=100&fit=crop" },
            { brand: "ROOMS TO GO", rate: "14% Cashback", logo: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=100&h=100&fit=crop" },
            { brand: "VALUE CITY", rate: "14% Cashback", logo: "https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=100&h=100&fit=crop" },
          ].map((offer, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-soft-md hover:shadow-soft-lg transition p-5 flex items-center gap-5 border border-gray-200"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
                <Image
                  src={offer.logo}
                  alt={offer.brand}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500">
                  {offer.brand}
                </p>
                <p className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {offer.rate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How Cash Back Works */}
      <section className="py-12 md:py-16 bg-white coupon-section-pattern-2 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            {t('cashbackPage.howItWorksHeading')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-soft-lg mb-5">
                <span className="text-white text-4xl md:text-5xl">⚡</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                {t('cashbackPage.step1Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('cashbackPage.step1Text')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-soft-lg mb-5">
                <span className="text-white text-4xl md:text-5xl">🛒</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                {t('cashbackPage.step2Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('cashbackPage.step2Text')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-soft-lg mb-5">
                <span className="text-white text-4xl md:text-5xl">💰</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                {t('cashbackPage.step3Title')}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {t('cashbackPage.step3Text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THE REAL DEAL – Furniture Edition */}
      <section className="w-full bg-[#e8f0f2] py-14">
        <div className="max-w-7xl mx-auto px-4">

          {/* Top Title */}
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-purple-700 tracking-tight">
              {t('cashbackPage.realDealHeading')}
            </h2>
            <p className="text-purple-500 font-semibold mt-2">
              {t('cashbackPage.realDealSubtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">

            {/* LEFT LARGE BANNER */}
            <div className="lg:col-span-2 relative bg-[#4056a1] rounded-3xl p-10 md:p-14 overflow-hidden text-white">

              {/* Floating Coins */}
              <div className="absolute top-10 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center shadow-soft-lg">
                <span className="text-sm font-bold text-center">
                  {t('cashbackPage.yearsSavingBadge')}
                </span>
              </div>

              <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center shadow-soft-lg">
                <span className="text-sm font-bold text-center">
                  {t('cashbackPage.brandsBadge')}
                </span>
              </div>

              {/* Main Text */}
              <div className="relative z-10 max-w-xl">
                <p className="uppercase tracking-[0.3em] text-sm text-purple-200 mb-4">
                  {t('cashbackPage.avoidDisappointment')}
                </p>

                <h3 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  {t('cashbackPage.guaranteeText1')}
                  <br />
                  <span className="italic font-light">
                    {t('cashbackPage.guaranteeText2')}
                  </span>
                </h3>
              </div>

            </div>

            {/* RIGHT SIDE CARDS - Furniture Related */}
            <div className="space-y-6">

              {/* Card 1 - Living Room */}
              <div className="flex gap-4 bg-white rounded-2xl shadow-soft-md p-4 items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop"
                    alt={t('cashbackPage.livingRoomImageAlt')}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {t('cashbackPage.livingRoomTrendsTitle')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('cashbackPage.livingRoomTrendsText')}
                  </p>
                </div>
              </div>

              {/* Card 2 - Bedroom */}
              <div className="flex gap-4 bg-white rounded-2xl shadow-soft-md p-4 items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=200&fit=crop"
                    alt={t('cashbackPage.bedroomImageAlt')}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {t('cashbackPage.luxuryBedroomTitle')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('cashbackPage.luxuryBedroomText')}
                  </p>
                </div>
              </div>

              {/* Card 3 - Office */}
              <div className="flex gap-4 bg-white rounded-2xl shadow-soft-md p-4 items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=200&h=200&fit=crop"
                    alt={t('cashbackPage.officeImageAlt')}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {t('cashbackPage.homeOfficeTitle')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('cashbackPage.homeOfficeText')}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 