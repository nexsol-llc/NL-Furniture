// Sponsor ads — admin-uploaded creatives (an image plus a click-through link)
// booked into fixed home-page placements. The Backend (`routes/sponsorAds.ts`)
// owns the same placement keys; keep the two in sync.

export type AdPlacement =
  | "hero_below"
  | "compare_below"
  | "sidebar_1"
  | "sidebar_2"
  | "sidebar_3"
  | "sidebar_4"
  | "sidebar_5";

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

/** How long each carousel ad shows before the carousel slides on. */
export const AD_ROTATE_SECONDS = 5;

// Both banner carousels sit in the same main column, so they share a size.
const BANNER = { width: 1400, height: 500, aspect: "14 / 5", ratioLabel: "14:5 landscape" };
// Every right-rail slot is the same card width.
const RAIL = { width: 600, height: 720, aspect: "5 / 6", ratioLabel: "5:6 portrait" };
// The rail's closing slot is a skyscraper, filling the side beside the lower sections.
const RAIL_TALL = { width: 600, height: 1200, aspect: "1 / 2", ratioLabel: "1:2 tall portrait" };

export const AD_PLACEMENTS: PlacementSpec[] = [
  {
    key: "hero_below",
    label: "Below the hero",
    description: `Wide banners directly under the hero slider. Add as many as you like — one shows at a time, sliding on every ${AD_ROTATE_SECONDS} seconds in the order below.`,
    multiple: true,
    ...BANNER,
  },
  {
    key: "compare_below",
    label: "Below “Compare products”",
    description: `Wide banners directly under the “Compare products side by side” section. Add as many as you like — one shows at a time, sliding on every ${AD_ROTATE_SECONDS} seconds in the order below.`,
    multiple: true,
    ...BANNER,
  },
  {
    key: "sidebar_1",
    label: "Right sidebar — Ad 1",
    description: "Top of the right rail, above Top Deals. Holds one ad at a time.",
    multiple: false,
    ...RAIL,
  },
  {
    key: "sidebar_2",
    label: "Right sidebar — Ad 2",
    description: "Right rail, below Top Deals. Holds one ad at a time.",
    multiple: false,
    ...RAIL,
  },
  {
    key: "sidebar_3",
    label: "Right sidebar — Ad 3",
    description: "Right rail, below the “Why advertise” card, above the newsletter sign-up. Holds one ad at a time.",
    multiple: false,
    ...RAIL,
  },
  {
    key: "sidebar_4",
    label: "Right sidebar — Ad 4",
    description: "Right rail, below the newsletter sign-up. Holds one ad at a time.",
    multiple: false,
    ...RAIL,
  },
  {
    key: "sidebar_5",
    label: "Right sidebar — Ad 5 (tall)",
    description: "The last card of the right rail, under Ad 4 — a tall skyscraper beside the lower home sections. Holds one ad at a time.",
    multiple: false,
    ...RAIL_TALL,
  },
];

export const placementSpec = (key: AdPlacement): PlacementSpec =>
  AD_PLACEMENTS.find((p) => p.key === key) ?? AD_PLACEMENTS[0];

/** The public feed: active ads only, grouped by placement. */
export interface SponsorAdsByPlacement {
  hero_below: SponsorAd[];
  compare_below: SponsorAd[];
  sidebar_1: SponsorAd | null;
  sidebar_2: SponsorAd | null;
  sidebar_3: SponsorAd | null;
  sidebar_4: SponsorAd | null;
  sidebar_5: SponsorAd | null;
}

export const EMPTY_SPONSOR_ADS: SponsorAdsByPlacement = {
  hero_below: [],
  compare_below: [],
  sidebar_1: null,
  sidebar_2: null,
  sidebar_3: null,
  sidebar_4: null,
  sidebar_5: null,
};

/** Coerces a `/api/sponsor-ads` response into shape, dropping ads without an image. */
export function normalizeSponsorAds(data: any): SponsorAdsByPlacement {
  const valid = (ad: any): ad is SponsorAd =>
    Boolean(ad && typeof ad.image === "string" && ad.image.trim());
  const many = (value: any): SponsorAd[] => (Array.isArray(value) ? value.filter(valid) : []);
  const one = (value: any): SponsorAd | null => (valid(value) ? value : null);

  return {
    hero_below: many(data?.hero_below),
    compare_below: many(data?.compare_below),
    sidebar_1: one(data?.sidebar_1),
    sidebar_2: one(data?.sidebar_2),
    sidebar_3: one(data?.sidebar_3),
    sidebar_4: one(data?.sidebar_4),
    sidebar_5: one(data?.sidebar_5),
  };
}
