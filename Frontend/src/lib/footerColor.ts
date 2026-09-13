// Footer colours — Admin → Theme → Footer Colors, stored as site settings.
//
// The background is one of the theme's dark primary shades ("primary-950", …),
// which follows the brand colour when it changes, or a fixed custom hex. Every
// other colour — headings, text, links, link hover, dividers, icon buttons — is
// a custom hex or "" for its default, which is derived from the background:
// light on a dark footer, navy on a light one.
//
// footerCssVars() turns a theme into the CSS variables .site-footer reads (see
// globals.css). ThemeProvider sets them on :root; the admin preview sets the
// same ones on its own .site-footer, so both render identically.

/** Offered in the admin, darkest first. */
export const FOOTER_SHADES = ["950", "900", "800", "700"] as const;
export const DEFAULT_FOOTER_COLOR = "primary-950";

export type FooterTheme = {
  /** `primary-<shade>` or `#rrggbb`. */
  bg: string;
  /** The rest are `#rrggbb`, or "" for the default derived from `bg`. */
  heading: string;
  text: string;
  link: string;
  linkHover: string;
  divider: string;
  iconBg: string;
};

type InkKey = Exclude<keyof FooterTheme, "bg">;

/**
 * The overridable colours: their site-settings key, the CSS variable they
 * feed, admin copy, and the default's opacity over the footer's ink.
 */
export const FOOTER_INK_FIELDS: {
  key: InkKey;
  setting: string;
  cssVar: string;
  label: string;
  hint: string;
  defaultAlpha: number;
}[] = [
  { key: "heading", setting: "footer_heading_color", cssVar: "--footer-heading", label: "Headings", hint: "Column titles and “Follow us”", defaultAlpha: 0.6 },
  { key: "text", setting: "footer_text_color", cssVar: "--footer-text", label: "Text", hint: "The copyright line and other plain text", defaultAlpha: 0.6 },
  { key: "link", setting: "footer_link_color", cssVar: "--footer-link", label: "Links", hint: "The footer menu links", defaultAlpha: 0.78 },
  { key: "linkHover", setting: "footer_link_hover_color", cssVar: "--footer-link-hover", label: "Link hover", hint: "A link under the pointer", defaultAlpha: 1 },
  { key: "divider", setting: "footer_divider_color", cssVar: "--footer-divider", label: "Dividers", hint: "The top border and the line above the columns", defaultAlpha: 0.12 },
  { key: "iconBg", setting: "footer_icon_bg_color", cssVar: "--footer-icon-bg", label: "Icon buttons", hint: "Social icons and back-to-top — the icon inside turns light or dark to match", defaultAlpha: 0.1 },
];

export const DEFAULT_FOOTER_THEME: FooterTheme = {
  bg: DEFAULT_FOOTER_COLOR,
  heading: "",
  text: "",
  link: "",
  linkHover: "",
  divider: "",
  iconBg: "",
};

export const FOOTER_THEME_KEY = "nl-furniture-footer-theme";

const HEX = /^#[0-9a-fA-F]{6}$/;
const SHADE = new RegExp(`^primary-(${FOOTER_SHADES.join("|")})$`);

/** Any partial shape → a complete theme holding only valid values. */
export function normalizeFooterTheme(
  value: Partial<Record<keyof FooterTheme, unknown>> | null | undefined
): FooterTheme {
  const bg = value?.bg;
  const theme: FooterTheme = {
    ...DEFAULT_FOOTER_THEME,
    bg: typeof bg === "string" && (SHADE.test(bg) || HEX.test(bg)) ? bg : DEFAULT_FOOTER_COLOR,
  };
  for (const { key } of FOOTER_INK_FIELDS) {
    const v = value?.[key];
    theme[key] = typeof v === "string" && HEX.test(v) ? v : "";
  }
  return theme;
}

/** Reads the theme out of a /api/site-settings response. */
export function readFooterTheme(settings: Record<string, unknown> | null | undefined): FooterTheme {
  const raw: Partial<Record<keyof FooterTheme, unknown>> = { bg: settings?.footer_color };
  for (const f of FOOTER_INK_FIELDS) raw[f.key] = settings?.[f.setting];
  return normalizeFooterTheme(raw);
}

/** The site-settings patch that stores a theme. */
export function writeFooterTheme(theme: FooterTheme): Record<string, string> {
  const out: Record<string, string> = { footer_color: theme.bg };
  for (const f of FOOTER_INK_FIELDS) out[f.setting] = theme[f.key];
  return out;
}

/** The CSS colour for a background: the live theme variable for shades, the hex otherwise. */
export function footerCssColor(bg: string): string {
  return HEX.test(bg) ? bg : `var(--${SHADE.test(bg) ? bg : DEFAULT_FOOTER_COLOR})`;
}

/** The actual hex behind a background, reading the theme variable for shades (client only). */
function resolveBgHex(bg: string): string | null {
  if (HEX.test(bg)) return bg;
  if (typeof window === "undefined") return null;
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${SHADE.test(bg) ? bg : DEFAULT_FOOTER_COLOR}`)
    .trim();
  return HEX.test(hex) ? hex : null;
}

const channels = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

// Perceived luminance, same weighting as the admin's other colour checks.
function isLightHex(hex: string): boolean {
  const [r, g, b] = channels(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/** Whether the background is light enough to need dark text. */
export function isLightFooter(bg: string): boolean {
  const hex = resolveBgHex(bg);
  return hex ? isLightHex(hex) : false;
}

/** `hex` moved toward `toward` by `amount` (0–1). */
function mix(hex: string, toward: string, amount: number): string {
  const a = channels(hex);
  const b = channels(toward);
  return `#${a
    .map((c, i) => Math.round(c + (b[i] - c) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Every footer CSS variable for a theme, with defaults filled in from the background's tone. */
export function footerCssVars(theme: FooterTheme): Record<string, string> {
  const ink = isLightFooter(theme.bg) ? "17 24 39" : "255 255 255";
  const byDefault = (alpha: number) => `rgb(${ink} / ${alpha})`;

  const vars: Record<string, string> = { "--footer-bg": footerCssColor(theme.bg) };
  for (const f of FOOTER_INK_FIELDS) vars[f.cssVar] = theme[f.key] || byDefault(f.defaultAlpha);

  // The icon glyph and hover follow the icon background.
  if (theme.iconBg) {
    const lightIcon = isLightHex(theme.iconBg);
    vars["--footer-icon-fg"] = lightIcon ? "rgb(17 24 39)" : "rgb(255 255 255)";
    vars["--footer-icon-bg-hover"] = mix(theme.iconBg, lightIcon ? "#000000" : "#ffffff", 0.15);
  } else {
    vars["--footer-icon-fg"] = byDefault(0.9);
    vars["--footer-icon-bg-hover"] = byDefault(0.2);
  }
  return vars;
}

/**
 * Publishes the footer theme to :root. Call it again after the site theme
 * changes: a primary-shade background follows by itself, but its tone — and so
 * every default colour — may not.
 */
export function applyFooterTheme(theme: FooterTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(footerCssVars(theme))) {
    root.style.setProperty(name, value);
  }
  root.toggleAttribute("data-footer-light", isLightFooter(theme.bg));
}
