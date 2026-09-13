// Sponsor ads — admin-uploaded creatives (an image plus a click-through link)
// booked into fixed home-page placements. The Backend (`routes/sponsorAds.ts`)
// owns the same placement keys; keep the two in sync.

export type AdPlacement = "hero_below" | "sidebar_1" | "sidebar_2";

export interface SponsorAd {
  _id: string;
  placement: AdPlacement;
  image: string;
  link?: string;
  /** Admin-facing name; doubles as the image's alt text. */
  title?: string;
  active: boolean;
  position: number;
}

export interface PlacementSpec {
  key: AdPlacement;
  label: string;
  description: string;
  /** Whether the placement holds a list of ads or exactly one. */
  multiple: boolean;
  /** Recommended upload size in px. */
  width: number;
  height: number;
  /** CSS aspect-ratio the slot renders at — a creative at the recommended
      size is shown uncropped. */
  aspect: string;
  ratioLabel: string;
}

/** How long each under-hero ad shows before the carousel slides on. */
export const AD_ROTATE_SECONDS = 5;

export const AD_PLACEMENTS: PlacementSpec[] = [
  {
    key: "hero_below",
    label: "Below the hero",
    description: `Wide banners directly under the hero slider. Add as many as you like — one shows at a time, sliding on every ${AD_ROTATE_SECONDS} seconds in the order below.`,
    multiple: true,
    width: 1400,
    height: 500,
    aspect: "14 / 5",
    ratioLabel: "14:5 landscape",
  },
  {
    key: "sidebar_1",
    label: "Right sidebar — Ad 1",
    description: "Top of the right rail, above Top Deals. Holds one ad at a time.",
    multiple: false,
    width: 600,
    height: 720,
    aspect: "5 / 6",
    ratioLabel: "5:6 portrait",
  },
  {
    key: "sidebar_2",
    label: "Right sidebar — Ad 2",
    description: "Right rail, below Top Deals. Holds one ad at a time.",
    multiple: false,
    width: 600,
    height: 720,
    aspect: "5 / 6",
    ratioLabel: "5:6 portrait",
  },
];

export const placementSpec = (key: AdPlacement): PlacementSpec =>
  AD_PLACEMENTS.find((p) => p.key === key) ?? AD_PLACEMENTS[0];

/** The public feed: active ads only, grouped by placement. */
export interface SponsorAdsByPlacement {
  hero_below: SponsorAd[];
  sidebar_1: SponsorAd | null;
  sidebar_2: SponsorAd | null;
}

export const EMPTY_SPONSOR_ADS: SponsorAdsByPlacement = {
  hero_below: [],
  sidebar_1: null,
  sidebar_2: null,
};

/** Coerces a `/api/sponsor-ads` response into shape, dropping ads without an image. */
export function normalizeSponsorAds(data: any): SponsorAdsByPlacement {
  const valid = (ad: any): ad is SponsorAd =>
    Boolean(ad && typeof ad.image === "string" && ad.image.trim());

  return {
    hero_below: Array.isArray(data?.hero_below) ? data.hero_below.filter(valid) : [],
    sidebar_1: valid(data?.sidebar_1) ? data.sidebar_1 : null,
    sidebar_2: valid(data?.sidebar_2) ? data.sidebar_2 : null,
  };
}
