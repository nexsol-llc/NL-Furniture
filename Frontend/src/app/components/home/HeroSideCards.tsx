"use client";

import AdvertiseWithUsCard from "./AdvertiseWithUsCard";
import SponsorAdCard from "./SponsorAd";
import TopDealsRail, { type DealItem } from "./TopDealsRail";
import WhyAdvertiseCard from "./WhyAdvertiseCard";
import CompactNewsletterCard from "./CompactNewsletterCard";
import type { SponsorAd } from "@/lib/sponsorAds";

type HeroSideCardsProps = {
  /** Admin → Sponsor Ads, "Right sidebar — Ad 1": above the deal list. */
  topAd?: SponsorAd | null;
  /** "Right sidebar — Ad 2": below the deal list. */
  bottomAd?: SponsorAd | null;
  deals: DealItem[];
};

/** Floating right rail paired with the hero: two paid slots around the top deals. */
export default function HeroSideCards({ topAd, bottomAd, deals }: HeroSideCardsProps) {
  return (
    <div className="rounded-[20px] border border-gray-200/90 bg-white p-2.5 shadow-[0_14px_40px_-20px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-22px_rgba(15,23,42,0.34)] sm:p-3">
      {topAd && <SponsorAdCard ad={topAd} className="rounded-[14px]" />}
      <TopDealsRail deals={deals} />
      <AdvertiseWithUsCard />
      {bottomAd && <SponsorAdCard ad={bottomAd} className="mt-2.5 rounded-[14px]" />}
      <WhyAdvertiseCard />
      <CompactNewsletterCard />
    </div>
  );
}
