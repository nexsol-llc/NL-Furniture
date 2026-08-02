import type { CSSProperties } from "react";

export const SHADE_KEYS = ["50","100","200","300","400","500","600","700","800","900","950"] as const;
export type ShadeKey = typeof SHADE_KEYS[number];
export type ColorShades = Record<ShadeKey, string>;

export type ColorPresetKey = "pink" | "rose" | "red" | "orange" | "purple" | "violet" | "blue" | "teal" | "green";
export type ThemeKey = ColorPresetKey | "custom";

export type ColorPreset = {
  label: string;
  shades: ColorShades;
};

export const COLOR_PRESETS: Record<ColorPresetKey, ColorPreset> = {
  pink: {
    label: "Pink",
    shades: {
      50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4",
      400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d",
      800: "#9d174d", 900: "#831843", 950: "#500724",
    },
  },
  rose: {
    label: "Rose",
    shades: {
      50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
      400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
      800: "#9f1239", 900: "#881337", 950: "#4c0519",
    },
  },
  red: {
    label: "Red",
    shades: {
      50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
      400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
      800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a",
    },
  },
  orange: {
    label: "Orange",
    shades: {
      50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74",
      400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c",
      800: "#9a3412", 900: "#7c2d12", 950: "#431407",
    },
  },
  purple: {
    label: "Purple",
    shades: {
      50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe",
      400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce",
      800: "#6b21a8", 900: "#581c87", 950: "#3b0764",
    },
  },
  violet: {
    label: "Violet",
    shades: {
      50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
      400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
      800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065",
    },
  },
  blue: {
    label: "Blue",
    shades: {
      50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
      400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
      800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
    },
  },
  teal: {
    label: "Teal",
    shades: {
      50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4",
      400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e",
      800: "#115e59", 900: "#134e4a", 950: "#042f2e",
    },
  },
  green: {
    label: "Green",
    shades: {
      50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac",
      400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
      800: "#166534", 900: "#14532d", 950: "#052e16",
    },
  },
};

export const STORAGE_KEY = "nl-furniture_theme";
export const CUSTOM_COLOR_KEY = "nl-furniture_custom_color";
export const DEFAULT_THEME: ThemeKey = "teal";
export const DEFAULT_CUSTOM_HEX = "#0d9488";

// Coupons site has its own primary color, independent from the furniture theme.
export const COUPONS_STORAGE_KEY = "nl-furniture_coupons_theme";
export const COUPONS_CUSTOM_COLOR_KEY = "nl-furniture_coupons_custom_color";
export const DEFAULT_COUPONS_THEME: ThemeKey = "orange";
export const DEFAULT_COUPONS_CUSTOM_HEX = "#ea580c";

// ─── Shade generator ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function mix(hex1: string, hex2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * ratio),
    Math.round(g1 + (g2 - g1) * ratio),
    Math.round(b1 + (b2 - b1) * ratio),
  );
}

/**
 * Generates an 11-shade palette from a single hex color.
 * The input hex is treated as the 600 shade (primary button color).
 * Lighter shades blend toward white, darker toward black.
 */
export function generateShades(hex: string): ColorShades {
  return {
    50:  mix("#ffffff", hex, 0.06),
    100: mix("#ffffff", hex, 0.13),
    200: mix("#ffffff", hex, 0.27),
    300: mix("#ffffff", hex, 0.44),
    400: mix("#ffffff", hex, 0.63),
    500: mix("#ffffff", hex, 0.82),
    600: hex,
    700: mix(hex, "#000000", 0.18),
    800: mix(hex, "#000000", 0.38),
    900: mix(hex, "#000000", 0.52),
    950: mix(hex, "#000000", 0.67),
  };
}

// ─── Apply helpers ────────────────────────────────────────────────────────────

function applyShades(shades: ColorShades) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  SHADE_KEYS.forEach((shade) => {
    const hex = shades[shade];
    const [r, g, b] = hexToRgb(hex);
    root.style.setProperty(`--primary-${shade}`, hex);
    // Raw channel triplet — required for Tailwind opacity modifiers (e.g. bg-primary-600/20)
    root.style.setProperty(`--primary-${shade}-rgb`, `${r} ${g} ${b}`);
  });
}

export function applyTheme(key: ColorPresetKey) {
  const shades = COLOR_PRESETS[key]?.shades;
  if (shades) applyShades(shades);
}

export function applyCustomHex(hex: string) {
  applyShades(generateShades(hex));
}

/** Resolve a theme selection (preset key or "custom") into a full shade palette. */
export function resolveShades(theme: ThemeKey, customHex: string): ColorShades {
  if (theme === "custom") return generateShades(customHex);
  const preset = COLOR_PRESETS[theme as ColorPresetKey];
  return preset ? preset.shades : COLOR_PRESETS[DEFAULT_THEME as ColorPresetKey].shades;
}

/**
 * Build a style object with the `--primary-*` (and `-rgb`) variables for a palette.
 * Used to scope a palette to a subtree (e.g. the coupons site) via an inline style,
 * overriding the global `:root` furniture palette for everything inside that element.
 */
export function shadesToCssVars(shades: ColorShades): CSSProperties {
  const vars: Record<string, string> = {};
  SHADE_KEYS.forEach((shade) => {
    const hex = shades[shade];
    const [r, g, b] = hexToRgb(hex);
    vars[`--primary-${shade}`] = hex;
    vars[`--primary-${shade}-rgb`] = `${r} ${g} ${b}`;
  });
  return vars as CSSProperties;
}
