// Home hero slides — the three admin-managed images (Admin → Home Page Settings)
// that CompareHero fades through as the background behind its headline,
// stats and search bar. The recommended size is tuned to that layout; if
// CompareHero's geometry changes, revisit it and the preview overlay in
// admin/hero/page.tsx.

export const HERO_SLOTS = [1, 2, 3] as const;
export type HeroSlot = (typeof HERO_SLOTS)[number];

/** How long each slide shows before the hero fades to the next. */
export const HERO_ROTATE_SECONDS = 6;

/**
 * Recommended upload. The hero is 390px tall on desktop and spans the main
 * column — about 1196px wide on a 1440px screen (3:1) and 1660px on a 1920px
 * one — so a 3:1 image fills it with little cropping and stays sharp on 2×
 * laptop screens.
 */
export const HERO_IMAGE = {
  width: 2400,
  height: 800,
  aspect: "3 / 1",
  ratioLabel: "3:1 landscape",
};
