"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/providers/themeContext";
import { shadesToCssVars } from "@/lib/colorPresets";

/**
 * Scopes the admin-configured *coupons* primary color to everything it wraps.
 * The furniture theme lives on :root (`--primary-*`); this element re-declares
 * those same variables from the coupons palette, so every `primary-*` Tailwind
 * class and `var(--primary-*)` inside the coupons site resolves to the coupons
 * color while the rest of the app keeps the furniture color.
 */
export default function CouponsThemeScope({ children }: { children: ReactNode }) {
  const { couponsShades } = useTheme();
  return <div style={shadesToCssVars(couponsShades)}>{children}</div>;
}
