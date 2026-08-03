/**
 * Section background patterns.
 *
 * Single source of truth for the six CSS-gradient patterns, shared by two
 * consumers so they can never drift apart:
 *
 *  1. `components/ui/bg-pattern.tsx` — the <BGPattern> element, for one-off
 *     decorative use (supports fade masks).
 *  2. The admin-configured, site-wide section pattern, published from here as
 *     CSS variables by `providers/themeContext.tsx` and consumed by the
 *     `.section-bg-*` / `.coupon-section-bg-*` classes in `globals.css`. Every
 *     section surface picks up the admin's choice with no per-section wiring.
 */

export type BGVariantType =
  | "dots"
  | "diagonal-stripes"
  | "grid"
  | "horizontal-lines"
  | "vertical-lines"
  | "checkerboard";

/** What an admin picks per site: one of the patterns, or no pattern at all. */
export type SectionPatternKey = "none" | BGVariantType;

/** Selectable patterns in admin order (the "no pattern" default comes first). */
export const SECTION_PATTERNS: ReadonlyArray<{ key: SectionPatternKey; label: string }> = [
  { key: "none", label: "None" },
  { key: "dots", label: "Dots" },
  { key: "grid", label: "Grid" },
  { key: "diagonal-stripes", label: "Diagonal Stripes" },
  { key: "horizontal-lines", label: "Horizontal Lines" },
  { key: "vertical-lines", label: "Vertical Lines" },
  { key: "checkerboard", label: "Checkerboard" },
];

export function isSectionPatternKey(value: unknown): value is SectionPatternKey {
  return SECTION_PATTERNS.some((p) => p.key === value);
}

// ─── Pattern geometry ────────────────────────────────────────────────────────

/** The `background-image` stack that draws `variant`, tiled at `size`px. */
export function getPatternBackgroundImage(
  variant: BGVariantType,
  fill: string,
  size: number,
): string | undefined {
  switch (variant) {
    case "dots":
      return `radial-gradient(${fill} 1px, transparent 1px)`;
    case "grid":
      return `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case "diagonal-stripes":
      return `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
    case "horizontal-lines":
      return `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case "vertical-lines":
      return `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
    case "checkerboard":
      return `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
    default:
      return undefined;
  }
}

/**
 * The checkerboard is four half-tile triangles that have to be offset against
 * each other to interlock; every other variant tiles from the origin.
 */
export function getPatternBackgroundPosition(variant: BGVariantType, size: number): string {
  if (variant !== "checkerboard") return "0 0";
  const half = size / 2;
  return `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0px`;
}

// ─── Admin-configured section pattern ────────────────────────────────────────

export type SectionPatternSettings = {
  pattern: SectionPatternKey;
  /** Ink color of the pattern itself, as `#rrggbb`. */
  color: string;
  /** 0–100. Patterns are meant to be felt, not read — the default is very low. */
  opacity: number;
  /** Tile size in px. */
  size: number;
};

export const DEFAULT_SECTION_PATTERN: SectionPatternSettings = {
  pattern: "none",
  color: "#000000",
  opacity: 8,
  size: 24,
};

export const PATTERN_SIZE_MIN = 8;
export const PATTERN_SIZE_MAX = 80;
export const PATTERN_OPACITY_MAX = 40;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** `#rrggbb` + a 0–100 opacity → an `rgba()` color usable inside a gradient. */
export function patternFill(hex: string, opacityPercent: number): string {
  const clean = (HEX_RE.test(hex) ? hex : DEFAULT_SECTION_PATTERN.color).slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacityPercent, 0, 100) / 100})`;
}

/**
 * One slot per admin-configurable section color, so each of the four surfaces
 * (furniture A/B, coupons A/B) can carry its own texture. The slot name doubles
 * as the settings-key base (`section_pattern_1_color`) and — with dashes — as
 * the CSS-variable prefix (`--section-pattern-1-image`).
 */
export type PatternSlot =
  | "section_pattern_1"
  | "section_pattern_2"
  | "coupon_section_pattern_1"
  | "coupon_section_pattern_2";

export const PATTERN_SLOTS: readonly PatternSlot[] = [
  "section_pattern_1",
  "section_pattern_2",
  "coupon_section_pattern_1",
  "coupon_section_pattern_2",
];

export type SectionPatternMap = Record<PatternSlot, SectionPatternSettings>;

export const DEFAULT_SECTION_PATTERNS: SectionPatternMap = {
  section_pattern_1: DEFAULT_SECTION_PATTERN,
  section_pattern_2: DEFAULT_SECTION_PATTERN,
  coupon_section_pattern_1: DEFAULT_SECTION_PATTERN,
  coupon_section_pattern_2: DEFAULT_SECTION_PATTERN,
};

/** Resolve settings into the three CSS background longhands they drive. */
export function patternCssValues(settings: SectionPatternSettings): {
  image: string;
  size: string;
  position: string;
} {
  if (settings.pattern === "none") return { image: "none", size: "auto", position: "0 0" };

  const size = clamp(settings.size, PATTERN_SIZE_MIN, PATTERN_SIZE_MAX);
  const fill = patternFill(settings.color, settings.opacity);
  return {
    image: getPatternBackgroundImage(settings.pattern, fill, size) ?? "none",
    size: `${size}px ${size}px`,
    position: getPatternBackgroundPosition(settings.pattern, size),
  };
}

/** Publish one slot's pattern as the CSS variables `globals.css` reads. */
export function applyPatternVars(slot: PatternSlot, settings: SectionPatternSettings): void {
  if (typeof document === "undefined") return;
  const prefix = `--${slot.replaceAll("_", "-")}`;
  const { image, size, position } = patternCssValues(settings);
  const root = document.documentElement;
  root.style.setProperty(`${prefix}-image`, image);
  root.style.setProperty(`${prefix}-size`, size);
  root.style.setProperty(`${prefix}-position`, position);
}

/** Publish all four slots at once. */
export function applyAllPatternVars(patterns: SectionPatternMap): void {
  PATTERN_SLOTS.forEach((slot) => applyPatternVars(slot, patterns[slot]));
}

/**
 * Pull one slot's pattern out of a flat `/api/site-settings` payload, falling
 * back to the defaults for anything missing or malformed.
 */
export function readPatternSettings(data: unknown, slot: PatternSlot): SectionPatternSettings {
  const raw = (data ?? {}) as Record<string, unknown>;
  const pattern = raw[slot];
  const color = raw[`${slot}_color`];
  const opacity = Number(raw[`${slot}_opacity`]);
  const size = Number(raw[`${slot}_size`]);

  return {
    pattern: isSectionPatternKey(pattern) ? pattern : DEFAULT_SECTION_PATTERN.pattern,
    color: typeof color === "string" && HEX_RE.test(color) ? color : DEFAULT_SECTION_PATTERN.color,
    opacity: Number.isFinite(opacity)
      ? clamp(opacity, 0, 100)
      : DEFAULT_SECTION_PATTERN.opacity,
    size: Number.isFinite(size)
      ? clamp(size, PATTERN_SIZE_MIN, PATTERN_SIZE_MAX)
      : DEFAULT_SECTION_PATTERN.size,
  };
}

/** All four slots out of a flat `/api/site-settings` payload. */
export function readAllPatterns(data: unknown): SectionPatternMap {
  return {
    section_pattern_1: readPatternSettings(data, "section_pattern_1"),
    section_pattern_2: readPatternSettings(data, "section_pattern_2"),
    coupon_section_pattern_1: readPatternSettings(data, "coupon_section_pattern_1"),
    coupon_section_pattern_2: readPatternSettings(data, "coupon_section_pattern_2"),
  };
}

/** The flat `/api/site-settings` keys for all four slots. */
export function writeAllPatterns(patterns: SectionPatternMap): Record<string, string | number> {
  return PATTERN_SLOTS.reduce<Record<string, string | number>>((body, slot) => {
    const settings = patterns[slot];
    body[slot] = settings.pattern;
    body[`${slot}_color`] = settings.color;
    body[`${slot}_opacity`] = settings.opacity;
    body[`${slot}_size`] = settings.size;
    return body;
  }, {});
}
