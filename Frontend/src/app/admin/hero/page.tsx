'use client';

import { useEffect, useState, type CSSProperties } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";
import { HOME_PAGE_SEO_KEY, isBlankHtml } from "@/lib/homeText";
import { HERO_IMAGE, HERO_ROTATE_SECONDS, HERO_SLOTS, type HeroSlot } from "@/lib/heroSlides";
import {
  COMPARE_IMAGE,
  COMPARE_SECTION_ID,
  DEFAULT_COMPARE_SECTION,
  normalizeCompareSection,
  type CompareSectionSettings,
} from "@/lib/compareSection";

/** Which image the media picker is choosing for: a hero slot or the compare section. */
type PickerTarget = HeroSlot | "compare";

type HeroRow = {
  _id: string;
  slot: number;
  image?: string;
  link?: string;
  title?: string;
  subtitle?: string;
  /** Absent means shown. */
  showGradient?: boolean;
  showText?: boolean;
};

type SlideSwitch = "showGradient" | "showText";

const LABEL = "text-[11px] font-semibold text-zinc-500 uppercase tracking-wider";

export default function HeroAdmin() {
  const [heroes, setHeroes] = useState<HeroRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Images picked from the library but not saved yet, per slot.
  const [pending, setPending] = useState<Partial<Record<HeroSlot, string>>>({});
  const [busy, setBusy] = useState<Partial<Record<HeroSlot, boolean>>>({});
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  // Compare section — stored in section-settings, saved independently of the slides.
  const [compare, setCompare] = useState<CompareSectionSettings>(DEFAULT_COMPARE_SECTION);
  const [compareLoading, setCompareLoading] = useState(true);
  const [comparePending, setComparePending] = useState<string | null>(null);
  const [compareBusy, setCompareBusy] = useState(false);

  const fetchCompare = async () => {
    try {
      const res = await adminFetch(`/api/section-settings?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setCompare(normalizeCompareSection(data));
    } catch (e) {
      console.error("Error fetching compare section settings:", e);
    } finally {
      setCompareLoading(false);
    }
  };

  const saveCompare = async (patch: Partial<CompareSectionSettings>) => {
    setCompareBusy(true);
    try {
      const res = await adminFetch("/api/section-settings", {
        method: "POST",
        body: JSON.stringify({ sectionId: COMPARE_SECTION_ID, ...patch }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save compare section");
      setCompare(normalizeCompareSection(data));
      return true;
    } catch (err: any) {
      alert(err.message || "Failed to save compare section");
      await fetchCompare();
      return false;
    } finally {
      setCompareBusy(false);
    }
  };

  const fetchHeroes = async () => {
    try {
      const res = await adminFetch(`/api/hero?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setHeroes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching hero slides:", e);
    } finally {
      setLoading(false);
    }
  };

  // Home page text — the official-home page-SEO `longContent`, shown before the FAQs.
  const [homeText, setHomeText] = useState("");
  const [homeTextSaved, setHomeTextSaved] = useState("");
  const [homeTextLoading, setHomeTextLoading] = useState(true);
  const [homeTextBusy, setHomeTextBusy] = useState(false);
  const homeTextDirty = homeText !== homeTextSaved;

  const fetchHomeText = async () => {
    try {
      const res = await adminFetch(`/api/page-seo-settings/${HOME_PAGE_SEO_KEY}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const text = typeof data?.longContent === "string" ? data.longContent : "";
      setHomeText(text);
      setHomeTextSaved(text);
    } catch (e) {
      console.error("Error fetching home page text:", e);
    } finally {
      setHomeTextLoading(false);
    }
  };

  const saveHomeText = async () => {
    // An emptied editor still holds markup like "<p><br></p>", which would
    // render an empty card on the home page — store it as "" instead.
    const longContent = isBlankHtml(homeText) ? "" : homeText;
    setHomeTextBusy(true);
    try {
      // Only this key is sent; the endpoint merges, so the page's SEO title,
      // meta and FAQs are untouched.
      const res = await adminFetch(`/api/page-seo-settings/${HOME_PAGE_SEO_KEY}`, {
        method: "PUT",
        body: JSON.stringify({ longContent }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save home page text");
      const saved = typeof data?.longContent === "string" ? data.longContent : longContent;
      setHomeText(saved);
      setHomeTextSaved(saved);
    } catch (err: any) {
      alert(err.message || "Failed to save home page text");
    } finally {
      setHomeTextBusy(false);
    }
  };

  useEffect(() => {
    fetchHeroes();
    fetchCompare();
    fetchHomeText();
  }, []);

  const heroFor = (slot: HeroSlot) => heroes.find((h) => h.slot === slot);

  const clearPending = (slot: HeroSlot) =>
    setPending((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });

  const save = async (slot: HeroSlot) => {
    const image = pending[slot];
    if (!image) return;
    setBusy((b) => ({ ...b, [slot]: true }));

    // The endpoint rewrites these fields, so carry the stored text and link
    // across — the current hero doesn't show them, but nothing is lost. The
    // gradient/text switches aren't touched by it and survive on their own.
    const existing = heroFor(slot);
    const formData = new FormData();
    formData.append("slot", String(slot));
    formData.append("image", image);
    formData.append("title", existing?.title ?? "");
    formData.append("subtitle", existing?.subtitle ?? "");
    formData.append("link", existing?.link ?? "");

    try {
      const res = await adminFetch("/api/hero", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.details || "Upload failed");
      clearPending(slot);
      await fetchHeroes();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setBusy((b) => ({ ...b, [slot]: false }));
    }
  };

  // Switches apply straight away — optimistic, rolled back if the save fails.
  const toggle = async (slot: HeroSlot, field: SlideSwitch, value: boolean) => {
    const hero = heroFor(slot);
    if (!hero) return;
    setHeroes((list) => list.map((h) => (h._id === hero._id ? { ...h, [field]: value } : h)));
    try {
      const res = await adminFetch(`/api/hero/${hero._id}`, {
        method: "PUT",
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update slide");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update slide");
      await fetchHeroes();
    }
  };

  const remove = async (slot: HeroSlot) => {
    const hero = heroFor(slot);
    if (!hero || !confirm(`Remove slide ${slot}? It drops out of the hero rotation.`)) return;
    setBusy((b) => ({ ...b, [slot]: true }));
    try {
      const res = await adminFetch(`/api/hero/${hero._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to remove slide");
      await fetchHeroes();
    } catch (err: any) {
      alert(err.message || "Failed to remove slide");
    } finally {
      setBusy((b) => ({ ...b, [slot]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-white border border-gray-200 text-gray-900 p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Home Page Settings</h2>
        <p className="text-gray-500 text-sm max-w-2xl">
          What the home page shows, top to bottom: the hero slides, the photo behind the
          &ldquo;Compare products&rdquo; section, and the text block before the FAQs.
        </p>
      </div>

      <div className="space-y-1 px-1">
        <h3 className="text-lg font-semibold text-zinc-950">Hero slides</h3>
        <p className="text-gray-500 text-sm max-w-2xl">
          The home page hero fades through these images every {HERO_ROTATE_SECONDS} seconds, as
          the background behind the headline, stats and search bar. Empty slots are skipped; with
          none set, the hero shows the plain brand colour. Each slide can switch off the gradient
          and the website text — useful for banners that carry their own.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm flex flex-col gap-6 md:flex-row md:items-center">
        <div className="space-y-1.5 shrink-0">
          <p className={LABEL}>Image size — all slides</p>
          <div
            style={{ aspectRatio: HERO_IMAGE.aspect }}
            className="h-[84px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700"
          >
            <span className="text-[12px] font-bold leading-tight">
              {HERO_IMAGE.width} × {HERO_IMAGE.height}
            </span>
            <span className="text-[9px] font-semibold opacity-75">px</span>
          </div>
          <p className="text-[10px] text-zinc-500">{HERO_IMAGE.ratioLabel} · JPG or WebP</p>
        </div>

        <ul className="space-y-2 text-sm text-zinc-600">
          {[
            <>With website text on, keep the subject in the <strong>right half</strong> — the left sits under the headline.</>,
            <>Keep the <strong>bottom quarter</strong> quiet — the search bar and the Top Deals rail always cover it.</>,
            <>On phones only the <strong>middle</strong> of the image shows.</>,
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {loading
        ? HERO_SLOTS.map((slot) => (
            <div key={slot} className="h-72 rounded-xl bg-white border border-zinc-100 animate-pulse" />
          ))
        : HERO_SLOTS.map((slot) => (
            <SlideCard
              key={slot}
              slot={slot}
              hero={heroFor(slot)}
              pending={pending[slot]}
              busy={!!busy[slot]}
              onPick={() => setPickerTarget(slot)}
              onSave={() => save(slot)}
              onDiscard={() => clearPending(slot)}
              onRemove={() => remove(slot)}
              onToggle={(field, value) => toggle(slot, field, value)}
            />
          ))}

      <div className="space-y-1 px-1 pt-4">
        <h3 className="text-lg font-semibold text-zinc-950">Compare section</h3>
        <p className="text-gray-500 text-sm max-w-2xl">
          The photo on the right of the &ldquo;Compare products side by side&rdquo; card. It fades
          into the card behind the headline; the optional badges (VS, Price, Shipping&hellip;) float
          on top. With no photo, the text spans the full card.
        </p>
      </div>

      {compareLoading ? (
        <div className="h-72 rounded-xl bg-white border border-zinc-100 animate-pulse" />
      ) : (
        <CompareSectionCard
          settings={compare}
          pending={comparePending}
          busy={compareBusy}
          onPick={() => setPickerTarget("compare")}
          onSave={async () => {
            if (comparePending && (await saveCompare({ backgroundImage: comparePending }))) {
              setComparePending(null);
            }
          }}
          onDiscard={() => setComparePending(null)}
          onRemove={() => {
            if (confirm("Remove the compare section photo? The text then spans the full card.")) {
              saveCompare({ backgroundImage: "" });
            }
          }}
          onToggleBadges={(value) => {
            // Optimistic — saveCompare re-fetches if the save fails.
            setCompare((c) => ({ ...c, showBadges: value }));
            saveCompare({ showBadges: value });
          }}
        />
      )}

      <div className="space-y-1 px-1 pt-4">
        <h3 className="text-lg font-semibold text-zinc-950">Home page text</h3>
        <p className="text-gray-500 text-sm max-w-2xl">
          Shown on the home page just before the FAQs. Use headings, lists and links as you would in
          a description; leave it empty to hide the block. One text is shown for all languages.
        </p>
      </div>

      {homeTextLoading ? (
        <div className="h-72 rounded-xl bg-white border border-zinc-100 animate-pulse" />
      ) : (
        <section className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-lg text-zinc-950">Text</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                homeTextDirty
                  ? "bg-amber-100 text-amber-800"
                  : homeTextSaved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {homeTextDirty ? "Unsaved" : homeTextSaved ? "Live" : "Empty — hidden"}
            </span>
          </div>

          <RichDescriptionEditor
            value={homeText}
            onChange={setHomeText}
            placeholder="Write the home page text..."
            minHeight={280}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveHomeText}
              disabled={!homeTextDirty || homeTextBusy}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {homeTextBusy ? "Saving..." : "Save text"}
            </button>
            {homeTextDirty && (
              <button
                type="button"
                onClick={() => setHomeText(homeTextSaved)}
                disabled={homeTextBusy}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Discard
              </button>
            )}
          </div>
        </section>
      )}

      <MediaPicker
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(item: MediaItem) => {
          if (pickerTarget === "compare") setComparePending(item.url);
          else if (pickerTarget) setPending((p) => ({ ...p, [pickerTarget]: item.url }));
        }}
        title={
          pickerTarget === "compare"
            ? "Select image for the compare section"
            : pickerTarget
              ? `Select image for slide ${pickerTarget}`
              : "Media Library"
        }
      />
    </div>
  );
}

function SlideCard({
  slot,
  hero,
  pending,
  busy,
  onPick,
  onSave,
  onDiscard,
  onRemove,
  onToggle,
}: {
  slot: HeroSlot;
  hero?: HeroRow;
  pending?: string;
  busy: boolean;
  onPick: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onRemove: () => void;
  onToggle: (field: SlideSwitch, value: boolean) => void;
}) {
  const image = pending ?? hero?.image ?? "";
  const showGradient = hero?.showGradient !== false;
  const showText = hero?.showText !== false;

  // Keyed by src so a stale measurement never describes a newly picked image.
  const [natural, setNatural] = useState<{ src: string; w: number; h: number } | null>(null);
  const measured = natural && natural.src === image ? natural : null;
  const target = HERO_IMAGE.width / HERO_IMAGE.height;
  const ratio = measured ? measured.w / measured.h : target;

  const status = pending
    ? { label: "Unsaved", className: "bg-amber-100 text-amber-800" }
    : hero
      ? { label: "Live", className: "bg-emerald-100 text-emerald-700" }
      : { label: "Empty — skipped", className: "bg-zinc-100 text-zinc-500" };

  return (
    <section className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <h3 className="font-semibold text-lg text-zinc-950">Slide {slot}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:ml-auto">
          <Switch
            label="Show gradient"
            checked={showGradient}
            disabled={!hero}
            onChange={(value) => onToggle("showGradient", value)}
          />
          <Switch
            label="Show website text"
            checked={showText}
            disabled={!hero}
            onChange={(value) => onToggle("showText", value)}
          />
          {!hero && <span className="text-[10px] text-zinc-400">Save an image to change these</span>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
        <div className="space-y-1.5 min-w-0">
          <p className={LABEL}>Desktop · 1440px screen</p>
          <HeroPreview
            device="desktop"
            image={image}
            gradient={showGradient}
            text={showText}
            onMeasure={(w, h) => setNatural({ src: image, w, h })}
          />
        </div>
        <div className="space-y-1.5">
          <p className={LABEL}>Phone</p>
          <HeroPreview device="phone" image={image} gradient={showGradient} text={showText} />
        </div>
      </div>

      {measured &&
        (ratio < target * 0.8 || ratio > target * 1.2 ? (
          <Notice tone="warn">
            This image is {measured.w} × {measured.h} px —{" "}
            {ratio < target
              ? "taller than 3:1, so desktop screens crop its top and bottom"
              : "wider than 3:1, so most screens crop its sides"}{" "}
            (see preview). Use{" "}
            <strong>
              {HERO_IMAGE.width} × {HERO_IMAGE.height} px
            </strong>{" "}
            for a clean fit.
          </Notice>
        ) : measured.w < 1600 ? (
          <Notice tone="warn">
            Right shape, but only {measured.w} × {measured.h} px — it will look soft on large
            screens. {HERO_IMAGE.width} × {HERO_IMAGE.height} px is recommended.
          </Notice>
        ) : (
          <Notice tone="ok">Good fit — {measured.w} × {measured.h} px.</Notice>
        ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-400 bg-white text-zinc-800 font-semibold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <ImagePlus size={14} /> {image ? "Change image" : "Choose image"}
        </button>

        {pending && (
          <>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {busy ? "Saving..." : `Save slide ${slot}`}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={busy}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Discard
            </button>
          </>
        )}

        {hero && !pending && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            title="Delete"
            className="ml-auto p-2 hover:bg-zinc-100 text-zinc-500 hover:text-red-600 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
    </section>
  );
}

function Switch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 text-sm font-medium text-zinc-700 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? "bg-primary-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      {label}
    </label>
  );
}

function Notice({ tone, children }: { tone: "warn" | "ok"; children: React.ReactNode }) {
  return tone === "warn" ? (
    <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800">
      <AlertTriangle size={14} className="mt-px shrink-0 text-amber-600" />
      <span>{children}</span>
    </p>
  ) : (
    <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-800">
      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
      {children}
    </p>
  );
}

type Box = Pick<CSSProperties, "top" | "left" | "right" | "bottom" | "width" | "height">;

/**
 * What covers the image on the live page, as percentages of the hero box.
 * Mirrors CompareHero measured on a 1440px screen (hero 1196 × 390, with the
 * right rail overlapping from 286px down) and a 390px phone (366 × 420).
 * Revisit if the hero's layout changes.
 */
const OVERLAY: Record<
  "desktop" | "phone",
  { aspect: string; fade: string; text: (Box & { tone: string })[]; search: Box; rail?: Box }
> = {
  desktop: {
    aspect: "1196 / 390",
    fade: "33%",
    text: [
      { top: "9.5%", left: "3.3%", width: "36%", height: "7.5%", tone: "bg-white/85" },
      { top: "20.5%", left: "3.3%", width: "30%", height: "7.5%", tone: "bg-white/85" },
      { top: "33%", left: "3.3%", width: "38%", height: "2.2%", tone: "bg-white/45" },
      { top: "37%", left: "3.3%", width: "30%", height: "2.2%", tone: "bg-white/45" },
      ...["3.3%", "9.4%", "15.5%", "21.6%"].map((left) => ({
        top: "45%",
        left,
        width: "4.5%",
        height: "5.5%",
        tone: "bg-white/65",
      })),
    ],
    search: { left: "1.7%", right: "27.9%", bottom: "4.1%", height: "22.6%" },
    rail: { right: "0.7%", width: "25.9%", top: "73.3%", bottom: "0" },
  },
  phone: {
    aspect: "366 / 420",
    fade: "30%",
    text: [
      { top: "7%", left: "6.6%", width: "80%", height: "6%", tone: "bg-white/85" },
      { top: "15.5%", left: "6.6%", width: "72%", height: "6%", tone: "bg-white/85" },
      { top: "24%", left: "6.6%", width: "55%", height: "6%", tone: "bg-white/85" },
      { top: "34%", left: "6.6%", width: "85%", height: "2%", tone: "bg-white/45" },
      ...["6.6%", "29%", "51%", "73%"].map((left) => ({
        top: "42%",
        left,
        width: "12%",
        height: "5%",
        tone: "bg-white/65",
      })),
    ],
    search: { left: "4.4%", right: "4.4%", bottom: "3.8%", height: "26%" },
  },
};

/**
 * The image framed the way the live hero crops it, with the page drawn on
 * top: the gradient and headline only when this slide shows them, the search
 * bar and rail always.
 */
function HeroPreview({
  device,
  image,
  gradient,
  text,
  onMeasure,
}: {
  device: "desktop" | "phone";
  image: string;
  gradient: boolean;
  text: boolean;
  onMeasure?: (width: number, height: number) => void;
}) {
  const spec = OVERLAY[device];

  return (
    <div
      style={{ aspectRatio: spec.aspect }}
      className="relative w-full overflow-hidden rounded-lg bg-primary-950 ring-1 ring-zinc-200"
    >
      {image ? (
        <img
          src={image}
          alt=""
          onLoad={(e) => onMeasure?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/50">
          <ImagePlus className="w-6 h-6 mb-1" />
          {device === "desktop" && <span className="text-[11px] font-semibold">No image</span>}
        </div>
      )}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {gradient && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-950/60 via-primary-900/20 to-transparent" />
            <div
              style={{ height: spec.fade }}
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950/25 to-transparent"
            />
          </>
        )}
        {text &&
          spec.text.map(({ tone, ...box }, i) => (
            <div key={i} style={box} className={`absolute rounded-[2px] ${tone}`} />
          ))}
        <div style={spec.search} className="absolute rounded-md bg-white/95 shadow-sm">
          <div className="absolute right-[3%] top-1/2 h-[32%] w-[16%] -translate-y-1/2 rounded bg-primary-500" />
        </div>
        {spec.rail && (
          <div style={spec.rail} className="absolute rounded-t-md bg-white ring-1 ring-zinc-200" />
        )}
      </div>
    </div>
  );
}

function CompareSectionCard({
  settings,
  pending,
  busy,
  onPick,
  onSave,
  onDiscard,
  onRemove,
  onToggleBadges,
}: {
  settings: CompareSectionSettings;
  pending: string | null;
  busy: boolean;
  onPick: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onRemove: () => void;
  onToggleBadges: (value: boolean) => void;
}) {
  const saved = settings.backgroundImage;
  const image = pending ?? saved;

  // Keyed by src so a stale measurement never describes a newly picked image.
  const [natural, setNatural] = useState<{ src: string; w: number; h: number } | null>(null);
  const measured = natural && natural.src === image ? natural : null;
  const ratio = measured ? measured.w / measured.h : COMPARE_IMAGE.width / COMPARE_IMAGE.height;

  const status = pending
    ? { label: "Unsaved", className: "bg-amber-100 text-amber-800" }
    : saved
      ? { label: "Live", className: "bg-emerald-100 text-emerald-700" }
      : { label: "No photo — text only", className: "bg-zinc-100 text-zinc-500" };

  return (
    <section className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <h3 className="font-semibold text-lg text-zinc-950">Background photo</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
        <div className="sm:ml-auto">
          <Switch
            label="Show badges"
            checked={settings.showBadges}
            disabled={busy}
            onChange={onToggleBadges}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="space-y-1.5 shrink-0">
          <p className={LABEL}>Image size</p>
          <div
            style={{ aspectRatio: COMPARE_IMAGE.aspect }}
            className="h-[84px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700"
          >
            <span className="text-[12px] font-bold leading-tight">
              {COMPARE_IMAGE.width} × {COMPARE_IMAGE.height}
            </span>
            <span className="text-[9px] font-semibold opacity-75">px</span>
          </div>
          <p className="text-[10px] text-zinc-500">{COMPARE_IMAGE.ratioLabel} · JPG or WebP</p>
        </div>

        <ul className="space-y-2 text-sm text-zinc-600">
          {[
            <>The <strong>left edge fades to white</strong> behind the headline — keep the products in the right two-thirds.</>,
            <>With badges on, leave the <strong>middle clear</strong> for the VS badge — one product either side of it reads best.</>,
            <>Keep the <strong>bottom edge</strong> plain; it fades into the product slots below.</>,
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-1.5 min-w-0">
          <p className={LABEL}>Desktop · 1440px screen</p>
          <ComparePreview
            device="desktop"
            image={image}
            badges={settings.showBadges}
            onMeasure={(w, h) => setNatural({ src: image, w, h })}
          />
        </div>
        <div className="space-y-1.5">
          <p className={LABEL}>Phone</p>
          <ComparePreview device="phone" image={image} badges={settings.showBadges} />
        </div>
      </div>

      {measured &&
        (ratio < 1.3 || ratio > 2.2 ? (
          <Notice tone="warn">
            This image is {measured.w} × {measured.h} px —{" "}
            {ratio < 1.3
              ? "much taller than 16:9, so its top and bottom are cropped"
              : "much wider than 16:9, so its sides are cropped"}{" "}
            (see preview). Use{" "}
            <strong>
              {COMPARE_IMAGE.width} × {COMPARE_IMAGE.height} px
            </strong>{" "}
            for a clean fit.
          </Notice>
        ) : measured.w < 1200 ? (
          <Notice tone="warn">
            Right shape, but only {measured.w} × {measured.h} px — it will look soft on large
            screens. {COMPARE_IMAGE.width} × {COMPARE_IMAGE.height} px is recommended.
          </Notice>
        ) : (
          <Notice tone="ok">Good fit — {measured.w} × {measured.h} px.</Notice>
        ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-400 bg-white text-zinc-800 font-semibold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <ImagePlus size={14} /> {image ? "Change image" : "Choose image"}
        </button>

        {pending && (
          <>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {busy ? "Saving..." : "Save photo"}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={busy}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Discard
            </button>
          </>
        )}

        {saved && !pending && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            title="Remove photo"
            className="ml-auto p-2 hover:bg-zinc-100 text-zinc-500 hover:text-red-600 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * The compare card's header as the live page draws it: on a 1440px screen the
 * header is ≈ 862 × 320 with the photo filling its right 56%; on a phone the
 * photo is a 208px band above the copy, badges reduced to the VS disc.
 * Mirrors CompareProducts — revisit if its layout changes.
 */
function ComparePreview({
  device,
  image,
  badges,
  onMeasure,
}: {
  device: "desktop" | "phone";
  image: string;
  badges: boolean;
  onMeasure?: (width: number, height: number) => void;
}) {
  const desktop = device === "desktop";

  const pill = (key: number) => (
    <span key={key} className="block h-[9%] w-full rounded-full bg-white/95 shadow-sm" />
  );

  return (
    <div
      style={{ aspectRatio: desktop ? "862 / 320" : "366 / 208" }}
      className="relative w-full overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200"
    >
      <div
        className={`absolute inset-y-0 right-0 ${desktop ? "w-[56%]" : "w-full"} ${
          image ? "" : "flex items-center justify-center border-2 border-dashed border-zinc-200 bg-zinc-50 text-zinc-400"
        }`}
      >
        {image ? (
          <>
            <img
              src={image}
              alt=""
              onLoad={(e) => onMeasure?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {desktop && (
              <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-white via-white/70 to-transparent" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-white to-transparent" />

            {badges && (
              <div aria-hidden="true" className="absolute inset-0">
                <span
                  className={`absolute left-1/2 top-1/2 flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 font-extrabold text-white ring-2 ring-white/70 ${
                    desktop ? "h-[17%] text-[9px]" : "h-[23%] text-[8px]"
                  }`}
                >
                  VS
                </span>
                {desktop && (
                  <>
                    <div className="absolute left-[16%] top-1/2 flex h-full w-[20%] -translate-y-1/2 flex-col justify-center gap-[3%]">
                      {[0, 1, 2].map(pill)}
                    </div>
                    <div className="absolute right-[4%] top-1/2 flex h-full w-[22%] -translate-y-1/2 flex-col justify-center gap-[3%]">
                      {[0, 1, 2].map(pill)}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="flex flex-col items-center text-center">
            <ImagePlus className="w-6 h-6 mb-1" />
            {desktop && <span className="text-[11px] font-semibold">No photo — text spans the card</span>}
          </span>
        )}
      </div>

      {desktop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/2">
          <div className="absolute left-[7%] top-[11%] h-[3%] w-[26%] rounded-[2px] bg-primary-300" />
          <div className="absolute left-[7%] top-[18%] h-[9%] w-[72%] rounded-[2px] bg-zinc-800/85" />
          <div className="absolute left-[7%] top-[30%] h-[9%] w-[54%] rounded-[2px] bg-zinc-800/85" />
          <div className="absolute left-[7%] top-[44%] h-[3%] w-[78%] rounded-[2px] bg-zinc-300" />
          <div className="absolute left-[7%] top-[50%] h-[3%] w-[60%] rounded-[2px] bg-zinc-300" />
          {["7%", "45%"].flatMap((left) =>
            ["62%", "78%"].map((top) => (
              <div key={left + top} style={{ left, top }} className="absolute flex h-[10%] w-[34%] items-center gap-[6%]">
                <span className="aspect-square h-full rounded-full bg-primary-100" />
                <span className="h-[35%] flex-1 rounded-[2px] bg-zinc-300" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
