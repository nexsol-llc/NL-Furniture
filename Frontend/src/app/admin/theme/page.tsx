"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/themeContext";
import { COLOR_PRESETS, ColorPresetKey, ThemeKey, generateShades, applyCustomHex } from "@/lib/colorPresets";
import { Check, Loader2, Palette, Pipette, Layers, Sofa, Tag } from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";

export default function ThemeSettingsPage() {
  const {
    theme, customHex, setTheme, setCustomTheme,
    couponsTheme, couponsCustomHex, setCouponsTheme, setCouponsCustomTheme,
    isSaving,
  } = useTheme();
  const [savedMsg, setSavedMsg] = useState("");

  const flashSaved = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  };

  // ── Section background colors (alternated across the homepage sections) ──────
  // Two for the furniture homepage, two for the coupons (/kortingscodes) page.
  const [sectionBg1, setSectionBg1] = useState("#e9ecef");
  const [sectionBg2, setSectionBg2] = useState("#F5E6D7");
  const [couponSectionBg1, setCouponSectionBg1] = useState("#f3f4f6");
  const [couponSectionBg2, setCouponSectionBg2] = useState("#f5f5f5");
  const [bgLoading, setBgLoading] = useState(true);
  const [bgSaving, setBgSaving] = useState(false);

  useEffect(() => {
    adminFetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.section_bg_1) setSectionBg1(d.section_bg_1);
        if (d?.section_bg_2) setSectionBg2(d.section_bg_2);
        if (d?.coupon_section_bg_1) setCouponSectionBg1(d.coupon_section_bg_1);
        if (d?.coupon_section_bg_2) setCouponSectionBg2(d.coupon_section_bg_2);
      })
      .catch(() => {})
      .finally(() => setBgLoading(false));
  }, []);

  const handleSaveSectionBackgrounds = async () => {
    setBgSaving(true);
    try {
      const res = await adminFetch("/api/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          section_bg_1: sectionBg1,
          section_bg_2: sectionBg2,
          coupon_section_bg_1: couponSectionBg1,
          coupon_section_bg_2: couponSectionBg2,
        }),
      });
      if (res.ok) flashSaved("Section backgrounds saved");
    } catch {
      // no-op
    } finally {
      setBgSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Palette className="text-primary-600" size={28} />
        <h1 className="text-2xl font-semibold text-gray-800">Theme Colors</h1>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Saving…
          </span>
        )}
        {!isSaving && savedMsg && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check size={13} /> {savedMsg}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Set separate primary colors for the two sites: the <strong>Furniture</strong> store and the{" "}
        <strong>Coupons</strong> site. Each is applied independently across its own pages.
      </p>

      {/* Furniture theme — the global :root color (admin panel + furniture site) */}
      <ThemePicker
        icon={<Sofa size={18} className="text-primary-600" />}
        title="Furniture Site"
        description="The primary color for the furniture store and the admin panel."
        theme={theme}
        customHex={customHex}
        onSelectPreset={async (key) => {
          await setTheme(key);
          flashSaved(`Furniture theme changed to ${COLOR_PRESETS[key].label}`);
        }}
        onApplyCustom={async (hex) => {
          await setCustomTheme(hex);
          flashSaved("Furniture custom color saved");
        }}
        livePreview
      />

      {/* Coupons theme — scoped to /kortingscodes/* only */}
      <ThemePicker
        icon={<Tag size={18} className="text-primary-600" />}
        title="Coupons Site"
        description="The primary color used only across the coupons pages (/kortingscodes)."
        theme={couponsTheme}
        customHex={couponsCustomHex}
        onSelectPreset={async (key) => {
          await setCouponsTheme(key);
          flashSaved(`Coupons theme changed to ${COLOR_PRESETS[key].label}`);
        }}
        onApplyCustom={async (hex) => {
          await setCouponsCustomTheme(hex);
          flashSaved("Coupons custom color saved");
        }}
      />

      {/* Section Background Colors */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={16} className="text-primary-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Section Backgrounds
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Two colors per site, used one after another (A, B, A, B…) across the content sections.
        </p>

        {bgLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            <SectionBgGroup
              icon={<Sofa size={15} className="text-primary-600" />}
              title="Furniture Homepage"
              colors={[
                { label: "Color 1 (A)", value: sectionBg1, set: setSectionBg1 },
                { label: "Color 2 (B)", value: sectionBg2, set: setSectionBg2 },
              ]}
            />

            <div className="mt-6">
              <SectionBgGroup
                icon={<Tag size={15} className="text-primary-600" />}
                title="Coupons Page (/kortingscodes)"
                colors={[
                  { label: "Color 1 (A)", value: couponSectionBg1, set: setCouponSectionBg1 },
                  { label: "Color 2 (B)", value: couponSectionBg2, set: setCouponSectionBg2 },
                ]}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={handleSaveSectionBackgrounds}
                disabled={bgSaving}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition flex items-center gap-2"
              >
                {bgSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Section Backgrounds
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Colors are saved to the database and applied for all admin users and visitors.
      </p>
    </div>
  );
}

/**
 * A preset grid + custom color picker for one site's primary color.
 * `livePreview` re-colors the admin panel itself (:root) while dragging — only
 * used for the furniture theme; the coupons picker just previews generated swatches.
 */
function ThemePicker({
  icon,
  title,
  description,
  theme,
  customHex,
  onSelectPreset,
  onApplyCustom,
  livePreview = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  theme: ThemeKey;
  customHex: string;
  onSelectPreset: (key: ColorPresetKey) => Promise<void>;
  onApplyCustom: (hex: string) => Promise<void>;
  livePreview?: boolean;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [localHex, setLocalHex] = useState(customHex);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Keep the local picker in sync when the stored value loads/changes.
  useEffect(() => {
    if (!previewing) setLocalHex(customHex);
  }, [customHex, previewing]);

  const handleSelectPreset = async (key: ColorPresetKey) => {
    setPreviewing(false);
    setBusy(true);
    await onSelectPreset(key);
    setBusy(false);
  };

  const handleColorPickerChange = (hex: string) => {
    setLocalHex(hex);
    if (livePreview) applyCustomHex(hex); // live preview on the admin panel itself
    setPreviewing(true);
  };

  const handleApplyCustom = async () => {
    setBusy(true);
    await onApplyCustom(localHex);
    setBusy(false);
    setPreviewing(false);
  };

  const customShades = generateShades(/^#[0-9a-fA-F]{6}$/.test(localHex) ? localHex : "#000000");

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <p className="text-xs text-gray-500 -mt-2 mb-5">{description}</p>

      {/* Preset Color Grid */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Presets</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {(Object.keys(COLOR_PRESETS) as ColorPresetKey[]).map((key) => {
          const preset = COLOR_PRESETS[key];
          const isActive = theme === key && !previewing;
          return (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                ${isActive
                  ? "border-gray-700 shadow-sm scale-105"
                  : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                }
              `}
            >
              <div className="flex gap-0.5">
                {(["400", "500", "600", "700"] as const).map((shade) => (
                  <div
                    key={shade}
                    className="w-5 h-8 rounded-sm first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: preset.shades[shade] }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-700">{preset.label}</span>
              {isActive && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: preset.shades["600"] }}
                >
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 mt-6">Custom Color</p>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Color picker trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => colorInputRef.current?.click()}
            className={`
              relative w-16 h-16 rounded-xl border-2 shadow-sm transition-all hover:scale-105 active:scale-95
              ${theme === "custom" && !previewing ? "border-gray-700 ring-2 ring-offset-2 ring-gray-400" : "border-gray-200"}
            `}
            style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(localHex) ? localHex : "#ffffff" }}
            title="Pick custom color"
          >
            <Pipette
              size={16}
              className="absolute bottom-1 right-1 opacity-60"
              style={{ color: isLight(localHex) ? "#374151" : "#f9fafb" }}
            />
          </button>
          {/* Hidden native color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(localHex) ? localHex : "#000000"}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            className="sr-only"
          />

          {/* Hex input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Hex value</label>
            <input
              type="text"
              value={localHex}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value;
                setLocalHex(v);
                setPreviewing(true);
                if (/^#[0-9a-fA-F]{6}$/.test(v) && livePreview) applyCustomHex(v);
              }}
              className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Generated shades preview */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-400">Generated shades</span>
          <div className="flex gap-1">
            {(["100", "200", "300", "400", "500", "600", "700", "800", "900"] as const).map((s) => (
              <div
                key={s}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: customShades[s] }}
                title={`${s}: ${customShades[s]}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleApplyCustom}
          disabled={busy}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition flex items-center gap-2"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Apply Custom Color
        </button>
        {theme === "custom" && !previewing && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Check size={12} className="text-green-500" /> Currently active
          </span>
        )}
      </div>
    </div>
  );
}

/** One site's pair of alternating section background colors + a live preview strip. */
function SectionBgGroup({
  icon,
  title,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  colors: ReadonlyArray<{ label: string; value: string; set: (v: string) => void }>;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {colors.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <label
              className="relative w-14 h-14 rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer flex-shrink-0"
              style={{ backgroundColor: c.value }}
            >
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(c.value) ? c.value : "#ffffff"}
                onChange={(e) => c.set(e.target.value)}
                className="sr-only"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">{c.label}</span>
              <input
                type="text"
                value={c.value}
                maxLength={7}
                onChange={(e) => c.set(e.target.value)}
                className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Alternation preview */}
      <div className="mt-4 rounded-lg overflow-hidden border border-gray-100">
        {[colors[0]?.value, colors[1]?.value, colors[0]?.value, colors[1]?.value].map((bg, i) => (
          <div key={i} className="h-8 flex items-center px-4 text-xs text-gray-600" style={{ backgroundColor: bg }}>
            Section {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function isLight(hex: string): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
