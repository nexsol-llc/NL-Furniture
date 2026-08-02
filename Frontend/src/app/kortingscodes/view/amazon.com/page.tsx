"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AmazonHeroAndOffers() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SWR for live auto-refresh
  const { data } = useSWR(
    "/api/coupons?page=amazon.com",
    fetcher,
    { refreshInterval: 3000 }
  );

  const displayCoupons = data?.coupons || coupons;

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/coupons");
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero / Banner Section - unchanged */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[116px] sm:pt-[120px] md:pt-[130px] lg:pt-[140px] pb-8 sm:pb-10 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 md:gap-12">
          {/* Amazon logo circle */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-52 xl:h-52 rounded-full bg-[#131921] flex items-center justify-center shadow-soft-lg relative overflow-hidden border-2 sm:border-3 md:border-4 border-[#ff9900]/40">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-none">
                  amazon
                </div>
                <div className="mt-1 sm:mt-1.5 md:mt-2">
                  <svg
                    className="w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 mx-auto"
                    viewBox="0 0 148 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M74 0L0 32H148L74 0Z" fill="#FF9900" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-2 sm:mb-2.5 md:mb-3">
              Amazon Promo Codes & coupons
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-700 font-medium">
              50 VERIFIED OFFERS ON FEBRUARY 27TH, 2026
            </p>

            <p className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 text-xs sm:text-sm text-gray-600 max-w-2xl">
            </p>
          </div>
        </div>
      </div>

      {/* Main content – left sidebar + right offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8 lg:gap-12">
          {/* LEFT SIDE – unchanged */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-7 md:space-y-8 lg:space-y-10">
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                TODAY'S TOP AMAZON OFFERS:
              </h3>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-xs sm:text-sm md:text-base text-gray-700">
                <li>• 10% Cash Back on Amazon Devices</li>
                <li>• Today's Deals! Up to $50 Off Select Items w/ Coupon</li>
                <li>• Free Shipping on Orders Over $35</li>
                <li>• Prime Exclusive: Extra 15% Off Select Brands</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg border border-gray-200 text-xs sm:text-sm">
              <dl className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between">
                  <dt>Total Offers</dt>
                  <dd className="font-medium">50</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Coupon Codes</dt>
                  <dd className="font-medium">1</dd>
                </div>
                <div className="flex justify-between">
                  <dt>In-Store coupons</dt>
                  <dd className="font-medium">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Free Shipping Deals</dt>
                  <dd className="font-medium">1</dd>
                </div>
              </dl>
            </div>

            {/* Contributor box */}
            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6">
              <h4 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 sm:mb-4 md:mb-5">
                THIS PAGE HAS BEEN UPDATED BY
              </h4>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-gray-300 shadow-soft">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
                      alt="Ben Whitehead"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <h5 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Ben Whitehead</h5>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2 sm:mb-3 md:mb-4">Content Writer</p>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3 sm:mb-4">
                    Ben is a writer and editor with more than 25 years of insider shopping experience in retail and e-commerce. He thanks his deal-spotting ability to a grandfather who would buy anything at a good price, a mother who would buy everything just to own it, and his dogs, Pugly and Dorbs, who simply cost too much.
                  </p>

                  <a href="#" className="text-primary-600 hover:underline text-xs sm:text-sm font-medium">
                    See Bio
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – COUPON CARDS (Fancy design same rakha) */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8">
            {loading ? (
              <p className="text-center py-10 text-gray-500">Loading offers...</p>
            ) : displayCoupons.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No offers available right now.</p>
            ) : (
              displayCoupons.map((coupon: any) => (
                <div
                  key={coupon._id}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-soft hover:shadow-soft-md transition-all duration-200"
                >
                  {/* Top Bar - unchanged */}
                  <div className="flex items-center justify-between bg-white px-5 sm:px-6 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-5">
                      {/* Discount */}
                      <div className="text-center">
                        <div className="text-[42px] sm:text-[48px] leading-none font-black text-primary-600 tracking-tighter">
                          {coupon.discount || "$20"}
                        </div>
                        <div className="text-[22px] sm:text-2xl font-bold text-primary-600 -mt-1">
                          {coupon.discountType || "OFF"}
                        </div>
                      </div>

                      {/* Badges */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded font-semibold">
                            Code
                          </span>
                          {coupon.cashback && (
                            <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              +{coupon.cashback} Cash Back
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Show Code Button - unchanged */}
                    <button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 transition-colors text-white font-semibold px-8 py-3 rounded-full text-base flex items-center gap-2 shadow-soft">
                      Show Code
                      <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                    </button>
                  </div>

                  {/* Bottom Content - yahan Get Deal button add kiya */}
                  <div className="px-5 sm:px-6 py-4">
                    <h3 className="font-semibold text-lg sm:text-xl text-gray-900 leading-tight mb-2">
                      {coupon.title || "Member Exclusive! $20 Off $49+ Orders"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                      <div>
                        <span className="text-emerald-600 font-medium">
                          {coupon.validatedThisWeek || "11"} validated this week
                        </span>
                      </div>
                      <div>
                        User saved{" "}
                        <span className="font-semibold text-gray-900">
                          {coupon.userSaved || "$20"}
                        </span>
                      </div>
                      <div>
                        Average savings:{" "}
                        <span className="font-semibold text-gray-900">
                          {coupon.avgSavings || "$14"}
                        </span>
                      </div>
                    </div>

                    {/* 🔥 Get Deal Redirect Button - simple aur clean */}
                    <div className="mt-6 flex justify-end">
                      <a href={coupon.url} target="_blank" rel="noopener noreferrer">
                        <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                          Get Deal
                        </button>
                      </a>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors">
                        See Details <span className="text-xl leading-none">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Baaki sections unchanged */}
      {/* AMAZON FEATURED ARTICLES SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 border-t border-gray-200">
        {/* ... same as before ... */}
      </div>

      {/* NEW SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 border-t border-gray-200">
        {/* Paste your original code here if needed */}
      </div>
    </div>
  );
}