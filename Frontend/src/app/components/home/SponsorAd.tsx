"use client";

import { useEffect, useState } from "react";
import PlaceholderImage from "../PlaceholderImage";
import { AdChip, SlideDots } from "./HomeUi";
import { normalizeLink } from "@/lib/productFormat";
import { AD_ROTATE_SECONDS, placementSpec, type SponsorAd } from "@/lib/sponsorAds";
import { useLanguage } from "@/providers/languageContext";

/**
 * One paid creative (Admin → Sponsor Ads). The artwork carries its own copy
 * and call to action, so this only frames it at the placement's aspect ratio
 * — a creative uploaded at the recommended size is never cropped — links it
 * out, and adds the ad marker every paid placement carries.
 */
export default function SponsorAdCard({
  ad,
  className = "rounded-2xl",
  offscreen = false,
}: {
  ad: SponsorAd;
  /** Include the corner radius — callers match it to the surface around them. */
  className?: string;
  /** A carousel slide that isn't showing — kept out of the tab order and away
      from screen readers. */
  offscreen?: boolean;
}) {
  const { t } = useLanguage();
  const label = t("homeCompare.adLabel");
  const href = normalizeLink(ad.link);
  const linked = href !== "#";
  const external = /^https?:\/\//i.test(href);
  const Wrapper = linked ? "a" : "div";

  return (
    <Wrapper
      {...(linked ? { href } : {})}
      {...(external ? { target: "_blank", rel: "sponsored noopener noreferrer" } : {})}
      {...(offscreen ? { "aria-hidden": true, tabIndex: -1 } : {})}
      style={{ aspectRatio: placementSpec(ad.placement).aspect }}
      className={`group relative block w-full overflow-hidden bg-gray-100 ring-1 ring-black/5 ${className}`}
    >
      <PlaceholderImage
        src={ad.image}
        alt={ad.title || label}
        fill
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <AdChip label={label} className="absolute bottom-2 left-2" />
    </Wrapper>
  );
}

/**
 * The ads booked under the hero, one at a time, sliding to the next every
 * AD_ROTATE_SECONDS. Hovering or focusing the banner holds the current ad,
 * and picking a dot restarts the countdown.
 */
export function SponsorAdCarousel({ ads }: { ads: SponsorAd[] }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = ads.length;
  const current = active < count ? active : 0;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => setActive((current + 1) % count), AD_ROTATE_SECONDS * 1000);
    return () => clearTimeout(id);
  }, [current, count, paused]);

  if (count === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {ads.map((ad, i) => (
            <div key={ad._id} className="w-full shrink-0">
              <SponsorAdCard ad={ad} className="" offscreen={i !== current} />
            </div>
          ))}
        </div>
      </div>

      <SlideDots
        count={count}
        active={current}
        onSelect={setActive}
        variant="surface"
        className="mt-2.5 justify-center"
        ariaLabel={(index) => t("homeCompare.hero.slideAria", { index })}
      />
    </div>
  );
}
