"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Star, Link2, ImagePlus, ExternalLink, GitMerge, X } from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

type BrandSEO = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
};

type Brand = {
  _id: string;
  title: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  featured?: boolean;
  sortOrder?: number;
  seo?: Partial<BrandSEO>;
};

const EMPTY_SEO: BrandSEO = {
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
};

const EMPTY: Omit<Brand, "_id"> & { seo: BrandSEO } = {
  title: "",
  slug: "",
  logo: "",
  description: "",
  website: "",
  featured: false,
  sortOrder: 0,
  seo: { ...EMPTY_SEO },
};

// Mirror of the backend slugify (umlaut-aware) for a live preview.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FurnitureBrandsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<Omit<Brand, "_id"> & { seo: BrandSEO }>({ ...EMPTY, seo: { ...EMPTY_SEO } });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  // Merge modal: reassign all of `mergeSource`'s products to another brand, then
  // delete the source brand.
  const [mergeSource, setMergeSource] = useState<Brand | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await adminFetch(`/api/furniture-brands?t=${Date.now()}`);
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBrands([]);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY, seo: { ...EMPTY_SEO } });
    setSlugEdited(false);
  };

  const openEdit = (b: Brand) => {
    setEditingId(b._id);
    setForm({
      title: b.title || "",
      slug: b.slug || "",
      logo: b.logo || "",
      description: b.description || "",
      website: b.website || "",
      featured: !!b.featured,
      sortOrder: b.sortOrder || 0,
      seo: { ...EMPTY_SEO, ...(b.seo || {}) },
    });
    setSlugEdited(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setSeo = (field: keyof BrandSEO, value: string) =>
    setForm((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));

  const effectiveSlug = slugEdited && form.slug ? slugify(form.slug) : slugify(form.title);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required.");
    setLoading(true);

    const payload = { ...form, slug: effectiveSlug };

    try {
      const res = editingId
        ? await adminFetch(`/api/furniture-brands/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await adminFetch("/api/furniture-brands", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save brand");

      alert(editingId ? "Brand updated ✅" : "Brand created ✅");
      resetForm();
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || "Failed to save brand");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    try {
      const res = await adminFetch(`/api/furniture-brands/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      if (editingId === id) resetForm();
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const openMerge = (b: Brand) => {
    setMergeSource(b);
    setMergeTargetId("");
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    setMerging(true);
    try {
      const res = await adminFetch("/api/furniture-brands/merge", {
        method: "POST",
        body: JSON.stringify({ sourceId: mergeSource._id, targetId: mergeTargetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Merge failed");
      alert(
        `Merged "${data.source}" into "${data.target}" ✅\n${data.movedProducts} product(s) reassigned.`
      );
      if (editingId === mergeSource._id) resetForm();
      setMergeSource(null);
      setMergeTargetId("");
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold tracking-tight">Furniture Brands</h2>
        <p className="text-gray-500 text-sm max-w-2xl mt-1">
          Manage the furniture brand directory — title, slug, logo, description and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT: ADD / EDIT FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
              {editingId ? <><Edit2 className="w-4 h-4 text-primary-600" /> Edit Brand</> : <><Plus className="w-4 h-4 text-emerald-600" /> Add New Brand</>}
            </h3>

            {/* Logo */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Logo</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-2 border border-dashed border-zinc-300 rounded-xl px-4 py-2.5 text-sm text-zinc-600 hover:border-primary-400 hover:bg-zinc-50 transition"
                >
                  <ImagePlus size={15} /> Choose from Library
                </button>
                {form.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="logo" className="w-12 h-12 object-contain rounded-lg border border-zinc-200" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. IKEA"
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => { setForm({ ...form, slug: e.target.value }); setSlugEdited(true); }}
                placeholder="auto-generated from title"
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <p className="text-[11px] text-zinc-400">URL: /brands/<span className="font-semibold text-zinc-600">{effectiveSlug || "…"}</span></p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short brand description…"
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm h-24 resize-y focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {/* Website */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Website</label>
              <div className="relative flex items-center">
                <Link2 size={15} className="absolute left-3 text-zinc-400" />
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://…"
                  className="w-full border border-zinc-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            {/* Sort order + Featured */}
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-24 border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                Featured
              </label>
            </div>

            {/* SEO */}
            <div className="pt-2 border-t border-zinc-100 space-y-3">
              <h4 className="text-sm font-semibold text-zinc-700">SEO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Meta Title</label>
                  <input
                    type="text"
                    value={form.seo.metaTitle}
                    onChange={(e) => setSeo("metaTitle", e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Keywords</label>
                  <input
                    type="text"
                    value={form.seo.keywords}
                    onChange={(e) => setSeo("keywords", e.target.value)}
                    placeholder="sofa, wohnzimmer, trends"
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Focus Keyword</label>
                  <input
                    type="text"
                    value={form.seo.focusKeyword}
                    onChange={(e) => setSeo("focusKeyword", e.target.value)}
                    placeholder="haupt keyword"
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Canonical URL</label>
                  <input
                    type="url"
                    value={form.seo.canonicalUrl}
                    onChange={(e) => setSeo("canonicalUrl", e.target.value)}
                    placeholder="https://nl-furniture.nl/brands/..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">OG Title</label>
                  <input
                    type="text"
                    value={form.seo.ogTitle}
                    onChange={(e) => setSeo("ogTitle", e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">OG Description</label>
                  <input
                    type="text"
                    value={form.seo.ogDescription}
                    onChange={(e) => setSeo("ogDescription", e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Meta Description</label>
                <textarea
                  value={form.seo.metaDescription}
                  onChange={(e) => setSeo("metaDescription", e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm h-24 resize-y focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-grow bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                {loading ? "Saving…" : editingId ? "Update Brand" : "Add Brand"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-lg">All Brands ({brands.length})</h3>

            {brands.length === 0 ? (
              <p className="text-zinc-400 text-sm">No brands yet. Add one on the left.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brands.map((b) => (
                  <div key={b._id} className="relative border border-zinc-100 rounded-lg p-4 flex gap-4 bg-zinc-50/50 hover:bg-zinc-50 transition">
                    <div className="relative w-16 h-16 bg-white border border-zinc-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {b.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt={b.title} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg font-bold text-zinc-300">{(b.title || "?").charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-sm text-zinc-900 truncate">{b.title}</h4>
                          {b.featured && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-zinc-400 block">/{b.slug}</span>
                        {b.description && (
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{b.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2 self-end mt-2">
                        {b.website && (
                          <a href={b.website} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-primary-600 rounded-lg" title="Open website">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-primary-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => openMerge(b)}
                          disabled={brands.length < 2}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-indigo-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                          title={brands.length < 2 ? "Need another brand to merge into" : "Merge into another brand"}
                        >
                          <GitMerge size={13} /> Merge
                        </button>
                        <button
                          onClick={() => handleDelete(b._id)}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-red-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MERGE MODAL */}
      {mergeSource && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-100 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-950 flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-600" /> Merge Brand
              </h3>
              <button onClick={() => setMergeSource(null)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600">
                Move every product from <strong className="text-zinc-900">{mergeSource.title}</strong> to another
                brand, then delete <strong className="text-zinc-900">{mergeSource.title}</strong>. This can&apos;t be undone.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Merge into</label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Select target brand…</option>
                  {brands
                    .filter((b) => b._id !== mergeSource._id)
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleMerge}
                  disabled={!mergeTargetId || merging}
                  className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {merging ? "Merging…" : "Merge & Delete Source"}
                </button>
                <button
                  onClick={() => setMergeSource(null)}
                  disabled={merging}
                  className="px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY PICKER */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => setForm((prev) => ({ ...prev, logo: item.url }))}
        title="Select Brand Logo"
      />
    </div>
  );
}
