"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit2, X, Search, ImagePlus, Loader2,
  Package, ExternalLink, FileSpreadsheet, AlertTriangle, CheckCircle2,
} from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import Pagination from "@/app/components/Pagination";
import { parseCsvText, rowToFeedProduct, slugify, type FeedProduct } from "@/lib/parseCsvClient";

type MissingItem = { name: string; count: number };

// A compact card listing "unknown" values (with product counts) inside the confirm modal.
function MissingCard({ title, items, accent }: { title: string; items: { name: string; count: number }[]; accent: string }) {
  const totalProducts = items.reduce((n, x) => n + x.count, 0);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden flex flex-col">
      <div className={`px-3 py-2.5 border-b ${accent}`}>
        <p className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle size={13} /> {title}</p>
        <p className="text-[11px] mt-0.5 opacity-80">{items.length} unknown · {totalProducts.toLocaleString("de-DE")} products</p>
      </div>
      <div className="flex-1 max-h-44 overflow-y-auto divide-y divide-gray-50">
        {items.length === 0 ? (
          <p className="px-3 py-3 text-[11px] text-emerald-600">All already exist ✅</p>
        ) : (
          items.map((it) => (
            <div key={it.name} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-gray-700 truncate mr-2" title={it.name}>{it.name || "(empty)"}</span>
              <span className="font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">{it.count.toLocaleString("de-DE")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type Product = {
  _id: string;
  slug?: string;
  product_name?: string;
  brand_name?: string;
  category_name?: string;
  merchant_category?: string;
  merchant_name?: string;
  search_price?: number;
  display_price?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  description?: string;
  colour?: string;
  delivery_cost?: string;
  aw_product_id?: number | null;
  is_sponsored?: boolean;
};

const EMPTY: Partial<Product> = {
  product_name: "",
  slug: "",
  brand_name: "",
  category_name: "",
  merchant_category: "",
  merchant_name: "",
  search_price: 0,
  display_price: "",
  aw_deep_link: "",
  merchant_deep_link: "",
  merchant_image_url: "",
  aw_image_url: "",
  description: "",
  colour: "",
  delivery_cost: "",
  aw_product_id: null,
  is_sponsored: false,
};

export default function FurnitureProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recent");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Dropdown sources — the brands & category catalog configured elsewhere in admin.
  const [furnitureBrands, setFurnitureBrands] = useState<string[]>([]);
  const [catalogs, setCatalogs] = useState<{ _id?: string; name: string; slug: string; subcategories?: { name: string; slug: string }[] }[]>([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [pickerField, setPickerField] = useState<"merchant_image_url" | "aw_image_url" | null>(null);

  // CSV import (client-side parse → confirm → chunked upload)
  const [csvBusy, setCsvBusy] = useState(false);
  const [importData, setImportData] = useState<null | {
    fileName: string;
    products: FeedProduct[];
    missingBrands: MissingItem[];
    missingCategories: MissingItem[];
    missingSubcategories: { name: string; count: number; category: string }[];
  }>(null);
  const [createBrands, setCreateBrands] = useState(true);
  // Per-brand canonical mapping chosen in the confirm modal: maps each new brand
  // (lowercased name) to the brand name it should become. Lets the admin merge
  // variants like "ALLPOWERS Deutschland" into "ALLPOWERS" before importing, so
  // only the canonical brand is created and its products all share one name.
  const [brandMappings, setBrandMappings] = useState<Record<string, string>>({});
  // Per-category placement chosen in the confirm modal: which grid (if any) each
  // newly-created category should be added to. Keyed by lowercased category name.
  const [categoryPlacements, setCategoryPlacements] = useState<Record<string, "indoor" | "outdoor" | "skip">>({});
  const [importing, setImporting] = useState(false);
  const [importStage, setImportStage] = useState("");
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importResult, setImportResult] = useState<any | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort });
      if (search) params.set("search", search);
      if (brand) params.set("brand", brand);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      const res = await adminFetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort, search, brand, category, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    adminFetch("/api/products/filters")
      .then((r) => r.json())
      .then((d) => {
        setBrandOptions(Array.isArray(d.brands) ? d.brands : []);
        setCategoryOptions(Array.isArray(d.categories) ? d.categories : []);
      })
      .catch(() => {});

    // Brands & categories/subcategories for the form dropdowns (from admin config).
    adminFetch(`/api/furniture-brands?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.brands) ? d.brands : [];
        setFurnitureBrands(arr.map((b: any) => b.title || b.name).filter(Boolean));
      })
      .catch((e) => console.error("furniture-brands fetch failed:", e));
    adminFetch(`/api/category-catalog?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.catalogs) ? d.catalogs : [];
        setCatalogs(arr);
      })
      .catch((e) => console.error("category-catalog fetch failed:", e));
  }, []);

  // Subcategories for the currently selected category in the form.
  const selectedCatalog = catalogs.find(
    (c) => c.name === form.category_name || c.slug === form.category_name
  );
  const subOptions = selectedCatalog?.subcategories ?? [];

  const applyFilters = () => { setSearch(searchInput.trim()); setPage(1); };
  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setBrand(""); setCategory("");
    setMinPrice(""); setMaxPrice(""); setSort("recent"); setPage(1);
  };

  const openAdd = () => { setEditingId(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditingId(p._id);
    // Tolerate the legacy camelCase `isSponsored` from older API responses; keep only `is_sponsored`.
    const { isSponsored, ...rest } = p as Product & { isSponsored?: boolean };
    setForm({ ...rest, is_sponsored: p.is_sponsored ?? isSponsored ?? false });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name?.trim()) return alert("Product name is required.");
    setSaving(true);
    try {
      const res = editingId
        ? await adminFetch(`/api/products/${editingId}`, { method: "PUT", body: JSON.stringify(form) })
        : await adminFetch("/api/products", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save product");
      closeForm();
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  // 1) Parse the CSV in the browser, compute coverage against the existing
  //    brands/categories, and open the confirmation modal (no upload yet).
  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    setCsvBusy(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      const products = rows.map(rowToFeedProduct).filter((p): p is FeedProduct => p !== null);
      if (products.length === 0) throw new Error("No valid products found (missing aw_product_id).");

      const existBrands = new Set(furnitureBrands.map((b) => b.toLowerCase()));
      const existCats = new Set<string>();
      const existSubs = new Set<string>();
      for (const c of catalogs) {
        for (const v of [c.name, c.slug, ...((c as any).aliases || [])]) if (v) existCats.add(String(v).toLowerCase());
        for (const s of c.subcategories || []) { if (s.name) existSubs.add(s.name.toLowerCase()); if (s.slug) existSubs.add(s.slug.toLowerCase()); }
      }

      const bMap = new Map<string, MissingItem>();
      const cMap = new Map<string, MissingItem>();
      const sMap = new Map<string, { name: string; count: number; category: string }>();
      for (const p of products) {
        if (p.brand_name) { const k = p.brand_name.toLowerCase(); const e = bMap.get(k) || { name: p.brand_name, count: 0 }; e.count++; bMap.set(k, e); }
        if (p.category_name) { const k = p.category_name.toLowerCase(); const e = cMap.get(k) || { name: p.category_name, count: 0 }; e.count++; cMap.set(k, e); }
        if (p.merchant_category) { const k = (p.category_name + "|" + p.merchant_category).toLowerCase(); const e = sMap.get(k) || { name: p.merchant_category, count: 0, category: p.category_name }; e.count++; sMap.set(k, e); }
      }
      const byCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

      const missingBrands = Array.from(bMap.values()).filter((x) => !existBrands.has(x.name.toLowerCase())).sort(byCount);
      const missingCategories = Array.from(cMap.values()).filter((x) => !existCats.has(x.name.toLowerCase())).sort(byCount);

      setImportData({
        fileName: file.name,
        products,
        missingBrands,
        missingCategories,
        missingSubcategories: Array.from(sMap.values()).filter((x) => !existSubs.has(x.name.toLowerCase())).sort(byCount),
      });

      // Default every new brand to map to itself; the admin can point variants at a
      // canonical brand to merge them before import.
      const initBrandMap: Record<string, string> = {};
      for (const b of missingBrands) initBrandMap[b.name.toLowerCase()] = b.name;
      setBrandMappings(initBrandMap);

      // Default every new category to Indoor; the admin picks Indoor/Outdoor/skip per row.
      const initPlacements: Record<string, "indoor" | "outdoor" | "skip"> = {};
      for (const c of missingCategories) initPlacements[c.name.toLowerCase()] = "indoor";
      setCategoryPlacements(initPlacements);
    } catch (err: any) {
      alert(err.message || "Failed to read CSV");
    } finally {
      setCsvBusy(false);
    }
  };

  // 2) Confirmed — optionally create missing brands/categories, then upload
  //    the products to the backend in chunks with a progress bar.
  const runImport = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      // a) Create approved missing brands, honoring the admin's canonical mapping.
      //    `brandMap` maps a lowercased new-brand name → the canonical name it
      //    should become (defaults to itself). Products are reassigned to the
      //    canonical name below so merged variants share one brand.
      const brandMap = new Map<string, string>();
      let createdBrandCount = 0;
      if (createBrands && importData.missingBrands.length) {
        for (const b of importData.missingBrands) {
          const canonical = (brandMappings[b.name.toLowerCase()] || b.name).trim();
          brandMap.set(b.name.toLowerCase(), canonical);
        }

        // Create each distinct canonical brand that doesn't already exist.
        const existLower = new Set(furnitureBrands.map((x) => x.toLowerCase()));
        const toCreate = new Set<string>();
        for (const canonical of Array.from(brandMap.values())) {
          if (canonical && !existLower.has(canonical.toLowerCase())) toCreate.add(canonical);
        }

        if (toCreate.size) {
          setImportStage(`Creating ${toCreate.size} brand(s)…`);
          for (const name of Array.from(toCreate)) {
            const res = await adminFetch("/api/furniture-brands", {
              method: "POST",
              body: JSON.stringify({ title: name, slug: slugify(name) }),
            }).catch(() => null);
            if (res && res.ok) createdBrandCount++;
          }
        }
      }

      // b) Create approved missing categories (with their feed subcategories) and
      //    queue each for the Indoor/Outdoor grid the admin chose in the modal.
      type GridItem = { type: "indoor" | "outdoor"; name: string; slug: string; image: string; featured: boolean; showOnHome: boolean };
      const gridAdd: GridItem[] = [];
      let createdCatCount = 0;

      const catsToCreate = importData.missingCategories.filter(
        (c) => (categoryPlacements[c.name.toLowerCase()] ?? "skip") !== "skip"
      );

      if (catsToCreate.length) {
        setImportStage(`Creating ${catsToCreate.length} categories…`);
        for (const cat of catsToCreate) {
          const slug = slugify(cat.name);
          const placement = categoryPlacements[cat.name.toLowerCase()];
          const subs = importData.missingSubcategories
            .filter((s) => s.category.toLowerCase() === cat.name.toLowerCase())
            .map((s) => ({ name: s.name, slug: slugify(s.name) }));
          const res = await adminFetch("/api/category-catalog", {
            method: "POST",
            body: JSON.stringify({ name: cat.name, slug, aliases: [slug], subcategories: subs }),
          }).catch(() => null);
          if (res && res.ok) createdCatCount++;

          if (placement === "indoor" || placement === "outdoor") {
            gridAdd.push({ type: placement, name: cat.name, slug, image: "", featured: false, showOnHome: false });
          }
        }

        // Append the new categories to the Kategorie Main Page's unified
        // categories[] list. We fetch the current settings first and send
        // back the full array (the endpoint uses json_patch, which replaces
        // arrays wholesale), deduping by slug.
        if (gridAdd.length) {
          setImportStage("Updating category grids…");
          try {
            const kres = await adminFetch(`/api/kategorie-settings?t=${Date.now()}`);
            const kdata = await kres.json().catch(() => ({}));
            const s = (kdata?.settings ?? {}) as Record<string, any>;
            const { _id, ...restSettings } = s;
            const curCategories: GridItem[] = Array.isArray(s.categories)
              ? s.categories
              : [
                  ...(Array.isArray(s.indoorCategories) ? s.indoorCategories.map((c: any) => ({ ...c, type: "indoor" })) : []),
                  ...(Array.isArray(s.outdoorCategories) ? s.outdoorCategories.map((c: any) => ({ ...c, type: "outdoor" })) : []),
                ];
            const mergeUnique = (existing: GridItem[], additions: GridItem[]) => {
              const seen = new Set(existing.map((x) => (x.slug || "").toLowerCase()));
              const merged = [...existing];
              for (const a of additions) {
                if (seen.has(a.slug.toLowerCase())) continue;
                merged.push(a);
                seen.add(a.slug.toLowerCase());
              }
              return merged;
            };
            await adminFetch("/api/kategorie-settings", {
              method: "POST",
              body: JSON.stringify({
                ...restSettings,
                categories: mergeUnique(curCategories, gridAdd),
                indoorCategories: null,
                outdoorCategories: null,
              }),
            });
          } catch (e) {
            console.error("Failed to update category grids:", e);
          }
        }
      }

      // c) Upload products in chunks, reassigning brand names per the canonical map.
      const CHUNK = 300;
      const all = brandMap.size
        ? importData.products.map((p) => {
            const canonical = brandMap.get((p.brand_name || "").toLowerCase());
            return canonical && canonical !== p.brand_name ? { ...p, brand_name: canonical } : p;
          })
        : importData.products;
      setImportProgress({ done: 0, total: all.length });
      let inserted = 0, updated = 0;
      for (let i = 0; i < all.length; i += CHUNK) {
        setImportStage(`Uploading products… ${Math.min(i + CHUNK, all.length)} / ${all.length}`);
        const chunk = all.slice(i, i + CHUNK);
        const res = await adminFetch("/api/products/bulk", { method: "POST", body: JSON.stringify({ products: chunk }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Upload failed");
        inserted += data.inserted || 0;
        updated += data.updated || 0;
        setImportProgress({ done: Math.min(i + CHUNK, all.length), total: all.length });
      }

      setImportResult({ inserted, updated, total: all.length, createdBrands: createdBrandCount, createdCategories: createdCatCount });
      setImportData(null);
      setPage(1);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Import failed");
    } finally {
      setImporting(false);
      setImportStage("");
    }
  };

  const setField = (k: keyof Product, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap bg-white border border-gray-200 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" /> Products
          </h2>
          <p className="text-gray-500 text-sm max-w-2xl mt-1">
            Add furniture products manually or import an AWIN product feed (CSV). {total.toLocaleString("de-DE")} products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition ${csvBusy ? "opacity-60" : "bg-white hover:bg-gray-50 border-gray-200"}`}>
            {csvBusy ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} {csvBusy ? "Reading…" : "Import CSV"}
            <input type="file" accept=".csv,text/csv" disabled={csvBusy} className="hidden" onChange={(e) => { handleCsvFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }} />
          </label>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 size={16} />
            Imported {importResult.total.toLocaleString("de-DE")} products ({importResult.inserted} added, {importResult.updated} updated)
            {importResult.createdBrands > 0 && ` · ${importResult.createdBrands} brands created`}
            {importResult.createdCategories > 0 && ` · ${importResult.createdCategories} categories created`}
          </p>
          <button onClick={() => setImportResult(null)} className="text-emerald-500 hover:text-emerald-800"><X size={16} /></button>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Search</label>
          <div className="relative mt-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="Name or brand…" className="w-full border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Brand</label>
          <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className="mt-1 block border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-900 max-w-[160px]">
            <option value="">All brands</option>
            {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="mt-1 block border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-900 max-w-[160px]">
            <option value="">All categories</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Price €</label>
          <div className="flex items-center gap-1 mt-1">
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setPage(1)} placeholder="Min" className="w-20 border border-zinc-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-zinc-900" />
            <span className="text-zinc-400">–</span>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setPage(1)} placeholder="Max" className="w-20 border border-zinc-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Sort</label>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="mt-1 block border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-900">
            <option value="recent">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        <button onClick={applyFilters} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700">Apply</button>
        <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200">Reset</button>
      </div>

      {/* LIST */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-lg skeleton" />
                <div className="flex-1 space-y-2"><div className="h-4 w-1/2 rounded skeleton" /><div className="h-3 w-1/4 rounded skeleton" /></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs mt-1">Add one manually or import a CSV.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((p) => (
              <div key={p._id} className="flex items-center gap-4 p-4 hover:bg-gray-50/60 transition">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {(p.merchant_image_url || p.aw_image_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.merchant_image_url || p.aw_image_url} alt="" className="w-full h-full object-contain" />
                  ) : <Package size={18} className="text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{p.product_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-gray-400">
                    {p.brand_name && <span className="font-semibold text-gray-500">{p.brand_name}</span>}
                    {p.category_name && <span>· {p.category_name}</span>}
                    {p.merchant_name && <span>· {p.merchant_name}</span>}
                    {p.is_sponsored && <span className="text-primary-600 font-semibold">· Sponsored</span>}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {p.display_price || (p.search_price ? `€ ${p.search_price}` : "—")}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {(p.aw_deep_link || p.merchant_deep_link) && (
                    <a href={p.aw_deep_link || p.merchant_deep_link} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="Open link"><ExternalLink size={15} /></a>
                  )}
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="Edit"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <Pagination
              page={page}
              totalPages={pages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {editingId ? <><Edit2 size={18} className="text-primary-600" /> Edit Product</> : <><Plus size={18} className="text-primary-600" /> Add Product</>}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["merchant_image_url", "aw_image_url"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{field === "merchant_image_url" ? "Main Image" : "Alternate Image"}</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center flex-shrink-0">
                        {form[field] ? <img src={form[field] as string} alt="" className="w-full h-full object-contain" /> : <ImagePlus size={18} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input value={(form[field] as string) || ""} onChange={(e) => setField(field, e.target.value)} placeholder="Image URL" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-zinc-900" />
                        <button type="button" onClick={() => setPickerField(field)} className="text-[11px] font-semibold text-primary-600 hover:underline flex items-center gap-1"><ImagePlus size={12} /> Library</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Name */}
              <Field label="Product Name *"><input value={form.product_name || ""} onChange={(e) => setField("product_name", e.target.value)} required className="input" /></Field>

              {/* URL slug — optional; the backend derives one from the name when empty. */}
              <Field label="URL Slug (optional)">
                <input value={form.slug || ""} onChange={(e) => setField("slug", e.target.value)} placeholder={form.product_name ? `auto: ${slugify(form.product_name)}` : "auto-generated from name"} className="input" />
                <p className="text-[10px] text-gray-400 mt-1">Lowercase letters, numbers and “-” only — anything else is converted automatically (e.g. è → e, ä → ae).</p>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Brand">
                  <select value={form.brand_name || ""} onChange={(e) => setField("brand_name", e.target.value)} className="input">
                    <option value="">— Select brand —</option>
                    {form.brand_name && !furnitureBrands.includes(form.brand_name) && (
                      <option value={form.brand_name}>{form.brand_name} (current)</option>
                    )}
                    {furnitureBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {furnitureBrands.length === 0 && <p className="text-[10px] text-amber-600 mt-1">No brands yet — add them under Furniture → Brands.</p>}
                </Field>
                <Field label="Merchant / Shop"><input value={form.merchant_name || ""} onChange={(e) => setField("merchant_name", e.target.value)} placeholder="e.g. 3pagen DE" className="input" /></Field>
                <Field label="Category">
                  <select
                    value={form.category_name || ""}
                    onChange={(e) => { setField("category_name", e.target.value); setField("merchant_category", ""); }}
                    className="input"
                  >
                    <option value="">— Select category —</option>
                    {form.category_name && !catalogs.some((c) => c.name === form.category_name) && (
                      <option value={form.category_name}>{form.category_name} (current)</option>
                    )}
                    {catalogs.map((c) => <option key={c._id || c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                  {catalogs.length === 0 && <p className="text-[10px] text-amber-600 mt-1">No categories yet — add them under Furniture → Categories Manager.</p>}
                </Field>
                <Field label="Subcategory">
                  <select
                    value={form.merchant_category || ""}
                    onChange={(e) => setField("merchant_category", e.target.value)}
                    className="input"
                    disabled={subOptions.length === 0 && !form.merchant_category}
                  >
                    <option value="">{subOptions.length > 0 ? "— Select subcategory —" : "Select a category first"}</option>
                    {form.merchant_category && !subOptions.some((s) => s.name === form.merchant_category) && (
                      <option value={form.merchant_category}>{form.merchant_category} (current)</option>
                    )}
                    {subOptions.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Price (€)"><input type="number" step="0.01" value={form.search_price ?? ""} onChange={(e) => setField("search_price", e.target.value === "" ? 0 : Number(e.target.value))} placeholder="7.99" className="input" /></Field>
                <Field label="Display Price"><input value={form.display_price || ""} onChange={(e) => setField("display_price", e.target.value)} placeholder="auto (e.g. EUR7.99)" className="input" /></Field>
                <Field label="Old / Delivery cost"><input value={form.delivery_cost || ""} onChange={(e) => setField("delivery_cost", e.target.value)} className="input" /></Field>
                <Field label="Colour"><input value={form.colour || ""} onChange={(e) => setField("colour", e.target.value)} className="input" /></Field>
                <Field label="Affiliate Link (aw_deep_link)"><input value={form.aw_deep_link || ""} onChange={(e) => setField("aw_deep_link", e.target.value)} placeholder="https://www.awin1.com/…" className="input" /></Field>
                <Field label="Merchant Link"><input value={form.merchant_deep_link || ""} onChange={(e) => setField("merchant_deep_link", e.target.value)} placeholder="https://…" className="input" /></Field>
                <Field label="AWIN Product ID (optional)"><input type="number" value={form.aw_product_id ?? ""} onChange={(e) => setField("aw_product_id", e.target.value === "" ? null : Number(e.target.value))} placeholder="matches CSV feed" className="input" /></Field>
              </div>

              <Field label="Description"><textarea value={form.description || ""} onChange={(e) => setField("description", e.target.value)} rows={4} className="input resize-y" /></Field>

              <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={!!form.is_sponsored} onChange={(e) => setField("is_sponsored", e.target.checked)} className="w-4 h-4 accent-primary-600" />
                Mark as sponsored (shown first)
              </label>

              <div className="flex gap-3 pt-2 border-t">
                <button type="submit" disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
                  {saving ? "Saving…" : editingId ? "Update Product" : "Add Product"}
                </button>
                <button type="button" onClick={closeForm} className="px-6 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT CONFIRM MODAL */}
      {importData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><FileSpreadsheet size={18} className="text-primary-600" /> Confirm import</h3>
                <p className="text-xs text-gray-500 mt-0.5">{importData.fileName} · <span className="font-semibold text-gray-700">{importData.products.length.toLocaleString("de-DE")}</span> products</p>
              </div>
              {!importing && <button onClick={() => setImportData(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>}
            </div>

            <div className="p-6 space-y-5">
              {importing ? (
                <div className="py-10 text-center space-y-4">
                  <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
                  <p className="text-sm font-semibold text-gray-800">{importStage}</p>
                  {importProgress.total > 0 && (
                    <div className="max-w-md mx-auto">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 transition-all" style={{ width: `${Math.round((importProgress.done / importProgress.total) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">{importProgress.done.toLocaleString("de-DE")} / {importProgress.total.toLocaleString("de-DE")}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400">Please keep this tab open until the import finishes.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Review what will be created before importing. Items below aren&apos;t in your catalog yet.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MissingCard title="New brands" items={importData.missingBrands} accent="bg-amber-50 border-amber-100 text-amber-800" />
                    <MissingCard title="New categories" items={importData.missingCategories} accent="bg-amber-50 border-amber-100 text-amber-800" />
                    <MissingCard title="New subcategories" items={importData.missingSubcategories} accent="bg-amber-50 border-amber-100 text-amber-800" />
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <label className={`flex items-center gap-2.5 text-sm cursor-pointer ${importData.missingBrands.length === 0 ? "opacity-50" : ""}`}>
                      <input type="checkbox" checked={createBrands} disabled={importData.missingBrands.length === 0} onChange={(e) => setCreateBrands(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                      Create the missing brand(s) in Furniture → Brands
                    </label>
                    <p className="text-[11px] text-gray-400 pl-6">
                      Unchecked: brands aren&apos;t created and products keep their original brand names.
                    </p>

                    {/* Per-brand canonical mapping — merge variants into one brand. */}
                    {createBrands && importData.missingBrands.length > 0 && (
                      <div className="pl-6 pt-1 space-y-2">
                        <p className="text-[11px] text-gray-500">
                          Merge variants: point e.g. <em>ALLPOWERS Deutschland</em> and <em>ALLPOWERS Germany</em> at
                          <em> ALLPOWERS</em> — one brand is created and all their products share that name.
                        </p>
                        <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
                          {importData.missingBrands.map((b) => {
                            const key = b.name.toLowerCase();
                            const val = brandMappings[key] ?? b.name;
                            const merged = val.toLowerCase() !== key;
                            return (
                              <div key={key} className="flex items-center justify-between gap-3 px-3 py-2">
                                <span className="text-xs text-gray-700 truncate" title={b.name}>
                                  {b.name || "(empty)"}{" "}
                                  <span className="text-gray-400">· {b.count.toLocaleString("de-DE")}</span>
                                  {merged && <span className="text-indigo-600 font-semibold"> → {val}</span>}
                                </span>
                                <select
                                  value={val}
                                  onChange={(e) => setBrandMappings((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white shrink-0 max-w-[55%] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value={b.name}>Keep as “{b.name}”</option>
                                  {importData.missingBrands.filter((o) => o.name.toLowerCase() !== key).length > 0 && (
                                    <optgroup label="Merge into new brand">
                                      {importData.missingBrands
                                        .filter((o) => o.name.toLowerCase() !== key)
                                        .map((o) => (
                                          <option key={o.name} value={o.name}>{o.name}</option>
                                        ))}
                                    </optgroup>
                                  )}
                                  {furnitureBrands.length > 0 && (
                                    <optgroup label="Merge into existing brand">
                                      {furnitureBrands.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Per-category placement: create a catalog page AND add to the chosen grid. */}
                  {importData.missingCategories.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm font-semibold text-gray-800">
                        New categories — choose where to add each
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Each selected category gets a catalog page (with its subcategories) and is added to the chosen Kategorie grid.
                        Pick <strong>Don&apos;t create</strong> to skip it — its products still import.
                      </p>
                      <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
                        {importData.missingCategories.map((cat) => {
                          const key = cat.name.toLowerCase();
                          const val = categoryPlacements[key] ?? "indoor";
                          return (
                            <div key={key} className="flex items-center justify-between gap-3 px-3 py-2">
                              <span className="text-xs text-gray-700 truncate" title={cat.name}>
                                {cat.name || "(empty)"}{" "}
                                <span className="text-gray-400">· {cat.count.toLocaleString("de-DE")}</span>
                              </span>
                              <select
                                value={val}
                                onChange={(e) =>
                                  setCategoryPlacements((prev) => ({ ...prev, [key]: e.target.value as "indoor" | "outdoor" | "skip" }))
                                }
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="indoor">Indoor (Innenbereich)</option>
                                <option value="outdoor">Outdoor (Außenbereich)</option>
                                <option value="skip">Don&apos;t create</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 border-t">
                    <button onClick={runImport} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition">
                      Import {importData.products.length.toLocaleString("de-DE")} products
                    </button>
                    <button onClick={() => setImportData(null)} className="px-6 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MEDIA PICKER */}
      <MediaPicker
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        onSelect={(item: MediaItem) => { if (pickerField) setField(pickerField, item.url); setPickerField(null); }}
        title="Select Product Image"
      />

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e4e4e7;
          border-radius: 0.75rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: #18181b; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}
