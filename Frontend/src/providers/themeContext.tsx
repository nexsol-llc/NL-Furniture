"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  COLOR_PRESETS,
  ColorPresetKey,
  ThemeKey,
  ColorShades,
  DEFAULT_THEME,
  DEFAULT_CUSTOM_HEX,
  STORAGE_KEY,
  CUSTOM_COLOR_KEY,
  COUPONS_STORAGE_KEY,
  COUPONS_CUSTOM_COLOR_KEY,
  DEFAULT_COUPONS_THEME,
  DEFAULT_COUPONS_CUSTOM_HEX,
  applyTheme,
  applyCustomHex,
  resolveShades,
} from "@/lib/colorPresets";
import {
  DEFAULT_SECTION_PATTERN,
  DEFAULT_SECTION_PATTERNS,
  PATTERN_SLOTS,
  SectionPatternMap,
  applyAllPatternVars,
  readAllPatterns,
} from "@/lib/bgPatterns";
import { adminFetch } from "@/lib/adminAuth";

// ── Section background colors (published as CSS variables for every section) ──
const SECTION_BG_KEY = "nl-furniture-section-bgs";
const SECTION_BG_DEFAULTS = {
  section_bg_1: "#e9ecef",
  section_bg_2: "#F5E6D7",
  coupon_section_bg_1: "#f3f4f6",
  coupon_section_bg_2: "#f5f5f5",
};
type SectionBgs = Partial<typeof SECTION_BG_DEFAULTS>;

function readCachedSectionBgs(): SectionBgs {
  try {
    const raw = localStorage.getItem(SECTION_BG_KEY);
    return raw ? { ...SECTION_BG_DEFAULTS, ...JSON.parse(raw) } : SECTION_BG_DEFAULTS;
  } catch {
    return SECTION_BG_DEFAULTS;
  }
}

function applySectionBgVars(bgs: SectionBgs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const merged = { ...SECTION_BG_DEFAULTS, ...bgs };
  root.style.setProperty("--section-bg-1", merged.section_bg_1);
  root.style.setProperty("--section-bg-2", merged.section_bg_2);
  root.style.setProperty("--coupon-section-bg-1", merged.coupon_section_bg_1);
  root.style.setProperty("--coupon-section-bg-2", merged.coupon_section_bg_2);
}

// ── Section background patterns (dots/grid/stripes/… over those colors) ───────
// One per section color, so A and B can carry different textures.
const SECTION_PATTERN_KEY = "nl-furniture-section-patterns";

function readCachedPatterns(): SectionPatternMap {
  try {
    const raw = localStorage.getItem(SECTION_PATTERN_KEY);
    if (!raw) return DEFAULT_SECTION_PATTERNS;
    const parsed = JSON.parse(raw) ?? {};
    const patterns = { ...DEFAULT_SECTION_PATTERNS };
    PATTERN_SLOTS.forEach((slot) => {
      patterns[slot] = { ...DEFAULT_SECTION_PATTERN, ...parsed[slot] };
    });
    return patterns;
  } catch {
    return DEFAULT_SECTION_PATTERNS;
  }
}

type ThemeContextType = {
  // Furniture (global) theme — applied to :root.
  theme: ThemeKey;
  customHex: string;
  setTheme: (key: ColorPresetKey) => Promise<void>;
  setCustomTheme: (hex: string) => Promise<void>;
  // Coupons theme — scoped to the /kortingscodes subtree, not applied to :root.
  couponsTheme: ThemeKey;
  couponsCustomHex: string;
  couponsShades: ColorShades;
  setCouponsTheme: (key: ColorPresetKey) => Promise<void>;
  setCouponsCustomTheme: (hex: string) => Promise<void>;
  isSaving: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  customHex: DEFAULT_CUSTOM_HEX,
  setTheme: async () => {},
  setCustomTheme: async () => {},
  couponsTheme: DEFAULT_COUPONS_THEME,
  couponsCustomHex: DEFAULT_COUPONS_CUSTOM_HEX,
  couponsShades: resolveShades(DEFAULT_COUPONS_THEME, DEFAULT_COUPONS_CUSTOM_HEX),
  setCouponsTheme: async () => {},
  setCouponsCustomTheme: async () => {},
  isSaving: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME);
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM_HEX);
  const [couponsTheme, setCouponsThemeState] = useState<ThemeKey>(DEFAULT_COUPONS_THEME);
  const [couponsCustomHex, setCouponsCustomHex] = useState(DEFAULT_COUPONS_CUSTOM_HEX);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Apply cached section backgrounds + patterns immediately (no flash), then reconcile below.
    applySectionBgVars(readCachedSectionBgs());
    applyAllPatternVars(readCachedPatterns());

    // Apply cached values immediately (no flash)
    const cachedTheme = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    const cachedHex = localStorage.getItem(CUSTOM_COLOR_KEY) ?? DEFAULT_CUSTOM_HEX;

    if (cachedTheme === "custom") {
      setThemeState("custom");
      setCustomHex(cachedHex);
      applyCustomHex(cachedHex);
    } else if (cachedTheme && COLOR_PRESETS[cachedTheme as ColorPresetKey]) {
      setThemeState(cachedTheme);
      applyTheme(cachedTheme as ColorPresetKey);
    } else {
      applyTheme(DEFAULT_THEME as ColorPresetKey);
    }

    // Coupons theme — only stored in state (applied via CouponsThemeScope), never on :root.
    const cachedCouponsTheme = localStorage.getItem(COUPONS_STORAGE_KEY) as ThemeKey | null;
    const cachedCouponsHex = localStorage.getItem(COUPONS_CUSTOM_COLOR_KEY) ?? DEFAULT_COUPONS_CUSTOM_HEX;
    if (cachedCouponsTheme === "custom") {
      setCouponsThemeState("custom");
      setCouponsCustomHex(cachedCouponsHex);
    } else if (cachedCouponsTheme && COLOR_PRESETS[cachedCouponsTheme as ColorPresetKey]) {
      setCouponsThemeState(cachedCouponsTheme);
    }

    // Fetch authoritative values from backend
    adminFetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const serverTheme = data.theme_color as ThemeKey | undefined;
        const serverHex = data.custom_color ?? cachedHex;

        if (serverTheme === "custom") {
          setThemeState("custom");
          setCustomHex(serverHex);
          applyCustomHex(serverHex);
          localStorage.setItem(STORAGE_KEY, "custom");
          localStorage.setItem(CUSTOM_COLOR_KEY, serverHex);
        } else if (serverTheme && COLOR_PRESETS[serverTheme as ColorPresetKey]) {
          setThemeState(serverTheme);
          applyTheme(serverTheme as ColorPresetKey);
          localStorage.setItem(STORAGE_KEY, serverTheme);
        }

        const serverCouponsTheme = data.coupons_theme_color as ThemeKey | undefined;
        const serverCouponsHex = data.coupons_custom_color ?? cachedCouponsHex;
        if (serverCouponsTheme === "custom") {
          setCouponsThemeState("custom");
          setCouponsCustomHex(serverCouponsHex);
          localStorage.setItem(COUPONS_STORAGE_KEY, "custom");
          localStorage.setItem(COUPONS_CUSTOM_COLOR_KEY, serverCouponsHex);
        } else if (serverCouponsTheme && COLOR_PRESETS[serverCouponsTheme as ColorPresetKey]) {
          setCouponsThemeState(serverCouponsTheme);
          localStorage.setItem(COUPONS_STORAGE_KEY, serverCouponsTheme);
        }

        // Section background colors → published as CSS variables for all sections.
        const bgs = {
          section_bg_1: data.section_bg_1,
          section_bg_2: data.section_bg_2,
          coupon_section_bg_1: data.coupon_section_bg_1,
          coupon_section_bg_2: data.coupon_section_bg_2,
        };
        applySectionBgVars(bgs);
        try {
          localStorage.setItem(SECTION_BG_KEY, JSON.stringify(bgs));
        } catch {}

        // Section background patterns → CSS variables consumed by .section-bg-*.
        const patterns = readAllPatterns(data);
        applyAllPatternVars(patterns);
        try {
          localStorage.setItem(SECTION_PATTERN_KEY, JSON.stringify(patterns));
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setTheme = async (key: ColorPresetKey) => {
    setThemeState(key);
    applyTheme(key);
    localStorage.setItem(STORAGE_KEY, key);

    setIsSaving(true);
    await adminFetch("/api/site-settings", {
      method: "PUT",
      body: JSON.stringify({ theme_color: key }),
    });
    setIsSaving(false);
  };

  const setCustomTheme = async (hex: string) => {
    setThemeState("custom");
    setCustomHex(hex);
    applyCustomHex(hex);
    localStorage.setItem(STORAGE_KEY, "custom");
    localStorage.setItem(CUSTOM_COLOR_KEY, hex);

    setIsSaving(true);
    await adminFetch("/api/site-settings", {
      method: "PUT",
      body: JSON.stringify({ theme_color: "custom", custom_color: hex }),
    });
    setIsSaving(false);
  };

  const setCouponsTheme = async (key: ColorPresetKey) => {
    setCouponsThemeState(key);
    localStorage.setItem(COUPONS_STORAGE_KEY, key);

    setIsSaving(true);
    await adminFetch("/api/site-settings", {
      method: "PUT",
      body: JSON.stringify({ coupons_theme_color: key }),
    });
    setIsSaving(false);
  };

  const setCouponsCustomTheme = async (hex: string) => {
    setCouponsThemeState("custom");
    setCouponsCustomHex(hex);
    localStorage.setItem(COUPONS_STORAGE_KEY, "custom");
    localStorage.setItem(COUPONS_CUSTOM_COLOR_KEY, hex);

    setIsSaving(true);
    await adminFetch("/api/site-settings", {
      method: "PUT",
      body: JSON.stringify({ coupons_theme_color: "custom", coupons_custom_color: hex }),
    });
    setIsSaving(false);
  };

  const couponsShades = useMemo(
    () => resolveShades(couponsTheme, couponsCustomHex),
    [couponsTheme, couponsCustomHex],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        customHex,
        setTheme,
        setCustomTheme,
        couponsTheme,
        couponsCustomHex,
        couponsShades,
        setCouponsTheme,
        setCouponsCustomTheme,
        isSaving,
      }}
    >
      {loaded ? (
        children
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <div
            role="status"
            aria-label="Wird geladen"
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"
          />
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
