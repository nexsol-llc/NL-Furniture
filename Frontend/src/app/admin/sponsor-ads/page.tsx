'use client';

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import {
  AD_PLACEMENTS,
  type AdPlacement,
  type PlacementSpec,
  type SponsorAd,
} from "@/lib/sponsorAds";

type Draft = {
  placement: AdPlacement;
  /** Set when editing an existing ad; null books a new one. */
  id: string | null;
  image: string;
  link: string;
  title: string;
  active: boolean;
};

const LABEL = "text-[11px] font-semibold text-zinc-500 uppercase tracking-wider";
const INPUT =
  "w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900";

export default function SponsorAdsAdmin() {
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/sponsor-ads/admin?t=${Date.now()}`);
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const request = async (path: string, init: RequestInit) => {
    const res = await adminFetch(path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const openDraft = (placement: AdPlacement, ad?: SponsorAd) =>
    setDraft({
      placement,
      id: ad?._id ?? null,
      image: ad?.image ?? "",
      link: ad?.link ?? "",
      title: ad?.title ?? "",
      active: ad?.active ?? true,
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.image) return alert("Choose an image from the media library first.");

    setSaving(true);
    const { id, placement, ...fields } = draft;
    try {
      await request(id ? `/api/sponsor-ads/${id}` : "/api/sponsor-ads", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(id ? fields : { placement, ...fields }),
      });
      setDraft(null);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to save ad");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: SponsorAd) => {
    try {
      await request(`/api/sponsor-ads/${ad._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !ad.active }),
      });
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to update ad");
    }
  };

  const remove = async (ad: SponsorAd) => {
    if (!confirm("Delete this ad? It disappears from the site immediately.")) return;
    try {
      await request(`/api/sponsor-ads/${ad._id}`, { method: "DELETE" });
      if (draft?.id === ad._id) setDraft(null);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to delete ad");
    }
  };

  const move = async (placement: AdPlacement, index: number, direction: -1 | 1) => {
    const list = ads.filter((a) => a.placement === placement);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setAds([
      ...ads.filter((a) => a.placement !== placement),
      ...reordered.map((a, i) => ({ ...a, position: i })),
    ]);

    try {
      await request("/api/sponsor-ads/reorder", {
        method: "POST",
        body: JSON.stringify({ placement, ids: reordered.map((a) => a._id) }),
      });
    } catch (err: any) {
      alert(err.message || "Failed to reorder ads");
      await load();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-white border border-gray-200 text-gray-900 p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Sponsor Ads</h2>
        <p className="text-gray-500 text-sm max-w-2xl">
          Paid placements on the home page. Each ad is an image and the link it opens — the
          artwork carries its own text and button. Upload at the recommended size for each
          placement so nothing gets cropped.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {AD_PLACEMENTS.map((spec) => (
            <div key={spec.key} className="h-56 rounded-xl bg-white border border-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : (
        AD_PLACEMENTS.map((spec) => {
          const list = ads.filter((a) => a.placement === spec.key);
          const editing = draft?.placement === spec.key ? draft : null;
          const canAdd = spec.multiple || list.length === 0;

          return (
            <section
              key={spec.key}
              className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-zinc-950 text-lg">{spec.label}</h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      {spec.multiple ? `Multiple · ${list.length}` : "Single"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-xl">{spec.description}</p>
                  {canAdd && !editing && (
                    <button
                      type="button"
                      onClick={() => openDraft(spec.key)}
                      className="mt-1 inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
                    >
                      <Plus size={14} /> Add ad
                    </button>
                  )}
                </div>

                <div className="flex shrink-0 items-end gap-5">
                  <SizeGuide spec={spec} />
                  <PlacementMap active={spec.key} />
                </div>
              </div>

              {editing && (
                <AdEditor
                  spec={spec}
                  draft={editing}
                  saving={saving}
                  onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
                  onPickImage={() => setPickerOpen(true)}
                  onSubmit={save}
                  onCancel={() => setDraft(null)}
                />
              )}

              {list.length === 0 ? (
                !editing && (
                  <div
                    style={{ aspectRatio: spec.aspect }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center text-zinc-400 ${
                      spec.multiple ? "w-full md:w-1/2" : "w-full max-w-[240px]"
                    }`}
                  >
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">No ad booked</span>
                    <span className="text-[10px] mt-0.5">This slot is hidden on the site</span>
                  </div>
                )
              ) : (
                <div
                  className={
                    spec.multiple ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "w-full max-w-[240px]"
                  }
                >
                  {list.map((ad, index) => (
                    <AdTile
                      key={ad._id}
                      spec={spec}
                      ad={ad}
                      editing={editing?.id === ad._id}
                      onEdit={() => openDraft(spec.key, ad)}
                      onToggle={() => toggleActive(ad)}
                      onDelete={() => remove(ad)}
                      {...(spec.multiple
                        ? {
                            slide: index + 1,
                            onUp: index > 0 ? () => move(spec.key, index, -1) : undefined,
                            onDown:
                              index < list.length - 1 ? () => move(spec.key, index, 1) : undefined,
                          }
                        : {})}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => setDraft((d) => (d ? { ...d, image: item.url } : d))}
        title="Select Ad Image"
      />
    </div>
  );
}

/** The recommended upload size, drawn to the placement's actual shape. */
function SizeGuide({ spec }: { spec: PlacementSpec }) {
  return (
    <div className="space-y-1.5">
      <p className={LABEL}>Image size</p>
      <div
        style={{ aspectRatio: spec.aspect }}
        className="h-[76px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700"
      >
        <span className="text-[11px] font-bold leading-tight">
          {spec.width} × {spec.height}
        </span>
        <span className="text-[9px] font-semibold opacity-75">px</span>
      </div>
      <p className="text-[10px] text-zinc-500">
        {spec.ratioLabel} · PNG, JPG, WebP
      </p>
    </div>
  );
}

/**
 * Wireframe of the home page with this placement lit up: the hero spans the
 * top, the main column runs below it, and the right rail sits beside it.
 */
function PlacementMap({ active }: { active: AdPlacement }) {
  const block = (placement?: AdPlacement) =>
    `rounded-[3px] ${placement && placement === active ? "bg-primary-500" : "bg-zinc-200"}`;

  // A banner carousel: the banner plus its slide dots.
  const carousel = (placement: AdPlacement) => (
    <div>
      <div className={`h-3 ${block(placement)}`} />
      <div className="mt-0.5 flex justify-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-[3px] rounded-full ${i === 0 ? "w-1.5" : "w-[3px]"} ${
              active === placement ? "bg-primary-500" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-1.5" aria-hidden="true">
      <p className={LABEL}>Where it shows</p>
      <div className="w-[128px] rounded-lg border border-zinc-200 bg-white p-1.5">
        <div className="h-1.5 rounded-[3px] bg-zinc-300" />
        <div className="mt-1 flex gap-1">
          <div className="w-3 rounded-[3px] bg-zinc-100" />
          <div className="flex-1 space-y-1">
            <div className="h-6 rounded-[3px] bg-zinc-300" />
            <div className="flex gap-1">
              <div className="flex-1 space-y-1">
                {carousel("hero_below")}
                <div className={`h-3 ${block()}`} />
                <div className={`h-3 ${block()}`} />
                {/* The compare section, drawn a touch darker so the banner under it reads. */}
                <div className="h-4 rounded-[3px] bg-zinc-300" />
                {carousel("compare_below")}
                <div className={`h-3 ${block()}`} />
              </div>
              <div className="w-6 space-y-1">
                <div className={`h-4 ${block("sidebar_1")}`} />
                <div className={`h-2.5 ${block()}`} />
                <div className={`h-4 ${block("sidebar_2")}`} />
                <div className={`h-2 ${block()}`} />
                <div className={`h-4 ${block("sidebar_3")}`} />
                <div className={`h-2 ${block()}`} />
                <div className={`h-4 ${block("sidebar_4")}`} />
                <div className={`h-8 ${block("sidebar_5")}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-zinc-500">Home page</p>
    </div>
  );
}

function AdTile({
  spec,
  ad,
  editing,
  onEdit,
  onToggle,
  onDelete,
  slide,
  onUp,
  onDown,
}: {
  spec: PlacementSpec;
  ad: SponsorAd;
  editing: boolean;
  /** 1-based position in the rotation, for multiple placements. */
  slide?: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  const action =
    "p-1.5 hover:bg-zinc-200/50 text-zinc-500 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div
      className={`rounded-xl border p-3 space-y-3 transition ${
        editing ? "border-primary-400 ring-2 ring-primary-100" : "border-zinc-100 bg-zinc-50/50"
      }`}
    >
      <div
        style={{ aspectRatio: spec.aspect }}
        className={`relative w-full overflow-hidden rounded-lg bg-zinc-100 ${ad.active ? "" : "opacity-50 grayscale"}`}
      >
        <img src={ad.image} alt={ad.title || ""} className="absolute inset-0 h-full w-full object-cover" />
        <span
          className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            ad.active ? "bg-emerald-500 text-white" : "bg-zinc-800 text-white"
          }`}
        >
          {ad.active ? "Live" : "Hidden"}
        </span>
        {slide && (
          <span className="absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700">
            Slide {slide}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-sm text-zinc-900 truncate">{ad.title || "Untitled ad"}</p>
        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
          <Link2 size={11} className="shrink-0" />
          {ad.link || "No link — the ad isn't clickable"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={onEdit} className={`${action} hover:text-primary-600`}>
          <Edit size={13} /> Edit
        </button>
        <button type="button" onClick={onToggle} className={`${action} hover:text-zinc-900`}>
          {ad.active ? <EyeOff size={13} /> : <Eye size={13} />}
          {ad.active ? "Hide" : "Show"}
        </button>
        {spec.multiple && (
          <>
            <button type="button" onClick={onUp} disabled={!onUp} title="Move earlier" className={action}>
              <ArrowUp size={13} />
            </button>
            <button type="button" onClick={onDown} disabled={!onDown} title="Move later" className={action}>
              <ArrowDown size={13} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className={`${action} ml-auto hover:text-red-600`}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

function AdEditor({
  spec,
  draft,
  saving,
  onChange,
  onPickImage,
  onSubmit,
  onCancel,
}: {
  spec: PlacementSpec;
  draft: Draft;
  saving: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onPickImage: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  // Keyed by src so a stale measurement never describes a newly picked image.
  const [natural, setNatural] = useState<{ src: string; w: number; h: number } | null>(null);
  const measured = natural && natural.src === draft.image ? natural : null;

  const targetRatio = spec.width / spec.height;
  const ratioOff = measured ? Math.abs(measured.w / measured.h - targetRatio) / targetRatio : 0;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 md:p-5 grid gap-5 md:grid-cols-2"
    >
      <div className="space-y-2">
        <label className={LABEL}>Ad image — preview as it appears on the site</label>
        <button
          type="button"
          onClick={onPickImage}
          style={{ aspectRatio: spec.aspect }}
          className={`relative w-full overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-white transition flex items-center justify-center group ${
            spec.multiple ? "" : "max-w-[260px]"
          }`}
        >
          {draft.image && (
            <img
              src={draft.image}
              alt=""
              onLoad={(e) =>
                setNatural({
                  src: draft.image,
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="relative z-10 flex flex-col items-center p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border group-hover:scale-95 transition-all">
            <ImagePlus className="w-5 h-5 text-zinc-500 mb-0.5" />
            <span className="text-[10px] font-semibold text-zinc-900">
              {draft.image ? "Change image" : "Choose image"}
            </span>
            <span className="text-[9px] text-zinc-500">
              {spec.width} × {spec.height} px
            </span>
          </span>
        </button>

        {measured &&
          (ratioOff > 0.05 ? (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800">
              <AlertTriangle size={14} className="mt-px shrink-0 text-amber-600" />
              <span>
                This image is {measured.w} × {measured.h} px — a different shape from{" "}
                {spec.ratioLabel}, so its edges will be cropped as shown above. Use{" "}
                <strong>
                  {spec.width} × {spec.height} px
                </strong>{" "}
                for a perfect fit.
              </span>
            </p>
          ) : measured.w < spec.width * 0.75 ? (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800">
              <AlertTriangle size={14} className="mt-px shrink-0 text-amber-600" />
              <span>
                Right shape, but only {measured.w} × {measured.h} px — it may look soft on large
                screens. {spec.width} × {spec.height} px is recommended.
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-800">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
              Good fit — {measured.w} × {measured.h} px.
            </p>
          ))}
      </div>

      <div className="space-y-4">
        <p className="font-semibold text-zinc-950 text-sm">
          {draft.id ? "Edit ad" : "New ad"} · {spec.label}
        </p>

        <div className="space-y-1">
          <label className={LABEL}>Click link</label>
          <div className="relative flex items-center">
            <Link2 size={16} className="absolute left-3.5 text-zinc-400" />
            <input
              type="text"
              value={draft.link}
              onChange={(e) => onChange({ link: e.target.value })}
              placeholder="https://brand.nl/campaign or /categorie"
              className={`${INPUT} pl-10`}
            />
          </div>
          <p className="text-[10px] text-zinc-400">
            External links open in a new tab. Leave empty for an unclickable ad.
          </p>
        </div>

        <div className="space-y-1">
          <label className={LABEL}>Name (optional)</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Interwood — winter campaign"
            className={INPUT}
          />
          <p className="text-[10px] text-zinc-400">
            For your own reference; also read out to screen-reader users.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 accent-primary-600"
          />
          Show on the site
        </label>

        {!spec.multiple && !draft.id && (
          <p className="text-[10px] text-zinc-400">
            This placement holds one ad — saving here replaces any ad already booked.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-grow bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            {saving ? "Saving..." : draft.id ? "Update ad" : "Save ad"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
