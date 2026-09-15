// Home "compare products" section — its admin-set background photo lives in
// the generic section-settings store (GET/POST /api/section-settings) under
// this section id, so no dedicated table or route is needed.

export const COMPARE_SECTION_ID = "compare-products";

export type CompareSectionSettings = {
  /** Photo behind the right half of the section header. "" = none. */
  backgroundImage: string;
  /** Floating "Prijs / Kenmerken / VS …" badges over the photo. Absent = shown. */
  showBadges: boolean;
};

export const DEFAULT_COMPARE_SECTION: CompareSectionSettings = {
  backgroundImage: "",
  showBadges: true,
};

/** Reads this section out of the `/api/section-settings` response. */
export function normalizeCompareSection(data: unknown): CompareSectionSettings {
  const raw = (data as any)?.settings?.[COMPARE_SECTION_ID];
  if (!raw || typeof raw !== "object") return DEFAULT_COMPARE_SECTION;
  return {
    backgroundImage: typeof raw.backgroundImage === "string" ? raw.backgroundImage.trim() : "",
    showBadges: raw.showBadges !== false,
  };
}

/**
 * Recommended upload size. The photo fills the header's right side with
 * `object-cover`, fading into white on its left edge; the VS badge sits in the
 * middle. The admin preview's geometry mirrors CompareProducts — change them
 * together.
 */
export const COMPARE_IMAGE = {
  width: 1600,
  height: 900,
  aspect: "16 / 9",
  ratioLabel: "16:9",
} as const;
