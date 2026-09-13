'use client';

import { useEffect, useState, type CSSProperties } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import { HERO_IMAGE, HERO_ROTATE_SECONDS, HERO_SLOTS, type HeroSlot } from "@/lib/heroSlides";

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
  const [pickerSlot, setPickerSlot] = useState<HeroSlot | null>(null);

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

  useEffect(() => {
    fetchHeroes();
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
        <h2 className="text-xl font-semibold tracking-tight">Hero Section Manager</h2>
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
              onPick={() => setPickerSlot(slot)}
              onSave={() => save(slot)}
              onDiscard={() => clearPending(slot)}
              onRemove={() => remove(slot)}
              onToggle={(field, value) => toggle(slot, field, value)}
            />
          ))}

      <MediaPicker
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(item: MediaItem) => {
          if (pickerSlot) setPending((p) => ({ ...p, [pickerSlot]: item.url }));
        }}
        title={pickerSlot ? `Select image for slide ${pickerSlot}` : "Media Library"}
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
