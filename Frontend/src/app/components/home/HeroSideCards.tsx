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
  /** "Right sidebar — Ad 3": between the "why advertise" card and the newsletter. */
  thirdAd?: SponsorAd | null;
  /** "Right sidebar — Ad 4": under the newsletter. */
  fourthAd?: SponsorAd | null;
  /** "Right sidebar — Ad 5 (tall)": the rail's last card, a 1:2 skyscraper. */
  lastAd?: SponsorAd | null;
  deals: DealItem[];
};

/** Floating right rail paired with the hero: five paid slots spread around the
    top deals, the advertising cards and the newsletter. Empty slots collapse. */
export default function HeroSideCards({
  topAd,
  bottomAd,
  thirdAd,
  fourthAd,
  lastAd,
  deals,
}: HeroSideCardsProps) {
  return (
    <div className="rounded-[20px] border border-gray-200/90 bg-white p-2.5 shadow-[0_14px_40px_-20px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-22px_rgba(15,23,42,0.34)] sm:p-3">
      {topAd && <SponsorAdCard ad={topAd} className="rounded-[14px]" />}
      <TopDealsRail deals={deals} />
      <AdvertiseWithUsCard />
      {bottomAd && <SponsorAdCard ad={bottomAd} className="mt-2.5 rounded-[14px]" />}
      <WhyAdvertiseCard />
      {thirdAd && <SponsorAdCard ad={thirdAd} className="mt-2.5 rounded-[14px]" />}
      <CompactNewsletterCard />
      {fourthAd && <SponsorAdCard ad={fourthAd} className="mt-2.5 rounded-[14px]" />}
      {lastAd && <SponsorAdCard ad={lastAd} className="mt-2.5 rounded-[14px]" />}
    </div>
  );
}
