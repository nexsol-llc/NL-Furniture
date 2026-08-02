"use client";
import { adminFetch } from "@/lib/adminAuth";

import useSWR from "swr";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Trash2, Edit2, X, Search, ExternalLink,
  ImageIcon, ChevronDown, ChevronUp, ImagePlus,
  Camera, ShoppingBag, Tag, FileText, HelpCircle, Globe, Save,
} from "lucide-react";
import RichTextEditor from "@/app/components/RichTextEditor";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const uid = () => `p${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const CATS = [
  "Schlafzimmer","Wohnzimmer","Küche","Badezimmer","Büro","Esszimmer",
  "Outdoor","Dekoration","Beleuchtung","Kinderzimmer","Flur","Garten",
];

const defaultFaqs = (title: string) => [
  {
    question: `How do I buy the products from "${title}"?`,
    answer: "Click on a product — you'll be taken directly to the partner shop.",
  },
  {
    question: "Are the prices up to date?",
    answer: "Prices can change at any time. Please check with the respective retailer.",
  },
];

/* ════════════════════════════════════════════════════
   PRODUCT SEARCH  (standalone, outside main component)
   ════════════════════════════════════════════════════ */
function ProductSearchPicker({ onAdd }: { onAdd: (p: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products-by-category?category=all&limit=20&searchTerms=${encodeURIComponent(q)}`
      );
      const json = await res.json();
      setResults(json.products || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), 420);
  };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const pick = (p: any) => {
    onAdd({
      id: uid(),
      productId: p.aw_product_id || p._id || "",
      name: p.product_name || "",
      image: p.aw_image_url || p.merchant_image_url || "",
      price: p.display_price || String(p.search_price || "€0,00"),
      link: p.aw_deep_link || p.merchant_deep_link || "",
    });
    setQuery(""); setResults([]); setOpen(false);
  };

  return (
    <div ref={wrap} className="relative">
      <div className="flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-gray-50 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={onChange}
          placeholder="Search product (name, brand…)"
          className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
        />
        {loading && <span className="text-xs text-primary-500 animate-pulse shrink-0">searching…</span>}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.length === 0
            ? <p className="text-sm text-gray-400 text-center py-5">No products found</p>
            : results.map((p) => (
              <button
                key={p._id || p.aw_product_id}
                onClick={() => pick(p)}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-primary-50 transition text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.aw_image_url || p.merchant_image_url || ""}
                  alt=""
                  className="w-10 h-10 object-cover rounded-lg shrink-0 bg-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.product_name}</p>
                  <p className="text-xs text-gray-400">{p.brand_name} · {p.display_price || p.search_price}</p>
                </div>
                <Plus size={14} className="text-primary-500 shrink-0" />
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   COLLAPSIBLE SECTION BOX
   (standalone — outside main component)
   ════════════════════════════════════════ */
function SectionBox({
  title, icon, isOpen, onToggle, children, badge,
}: {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary-600">{icon}</span>}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge !== undefined && (
            <span className="bg-primary-100 text-primary-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════ */
export default function AdminInfluencersPage() {
  /* ── data ── */
  const { data: brandsData, mutate: mutateBrands } = useSWR("/api/influencer-brands", fetcher);
  const brands: any[] = brandsData?.brands || [];

  const [selectedUsername, setSelectedUsername] = useState("");

  const { data: looksData, mutate: mutateLooksRaw } = useSWR(
    selectedUsername ? `/api/influencer-looks?username=${selectedUsername}` : null,
    fetcher
  );
  const looks: any[] = looksData?.looks || [];

  // safe mutate — won't crash when key is null
  const mutateLooks = useCallback(() => {
    if (selectedUsername) mutateLooksRaw();
  }, [selectedUsername, mutateLooksRaw]);

  /* ── form state ── */
  const [brandForm, setBrandForm] = useState<any>(null);
  const [lookForm, setLookForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Media library picker — holds the callback that receives the selected URL.
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => setPickerCallback(() => cb);

  /* ── section open/close (for the Look form modal) ── */
  const [openHero, setOpenHero] = useState(true);
  const [openProducts, setOpenProducts] = useState(true);
  const [openSimilar, setOpenSimilar] = useState(false);
  const [openContent, setOpenContent] = useState(false);
  const [openFaqs, setOpenFaqs] = useState(false);
  const [openSeo, setOpenSeo] = useState(false);

  const resetSections = () => {
    setOpenHero(true);
    setOpenProducts(true);
    setOpenSimilar(false);
    setOpenContent(false);
    setOpenFaqs(false);
    setOpenSeo(false);
  };

  /* ── brand handlers ── */
  const handleSaveBrand = async () => {
    if (!brandForm) return;
    if (!brandForm.username || !brandForm.displayName) {
      alert("Username and Display Name are required.");
      return;
    }
    setSaving(true);
    const payload = {
      username: brandForm.username,
      displayName: brandForm.displayName,
      name: brandForm.name || brandForm.displayName,
      bio: brandForm.bio || "",
      logo: brandForm.logo || "",
    };

    // Existing brand (_id present) → update via PUT; otherwise create via POST.
    const res = brandForm._id
      ? await adminFetch(`/api/influencer-brands/${brandForm.username}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/influencer-brands", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Error saving brand: " + (err.error || res.status));
      return;
    }
    setBrandForm(null);
    mutateBrands();
  };

  const handleDeleteBrand = async (username: string) => {
    if (!confirm(`Delete influencer @${username} and all looks?`)) return;
    await adminFetch(`/api/influencer-brands/${username}`, { method: "DELETE" });
    if (selectedUsername === username) setSelectedUsername("");
    mutateBrands();
  };

  /* ── look handlers ── */
  const openNewLook = () => {
    resetSections();
    setLookForm({
      lookId: uid(), title: "", caption: "", longContent: "",
      heroImage: "", products: [], faqs: [], similarCategories: [],
      tags: [], seoTitle: "", seoDescription: "",
    });
  };

  const openEditLook = (look: any) => {
    resetSections();
    setLookForm({ ...look });
  };

  const handleSaveLook = async () => {
    if (!lookForm || !selectedUsername) return;
    if (!lookForm.title) {
      alert("Title is required.");
      return;
    }
    setSaving(true);
    const faqs = lookForm.faqs?.length > 0
      ? lookForm.faqs
      : defaultFaqs(lookForm.title || "Look");

    const payload = {
      lookId: lookForm.lookId || uid(),
      username: selectedUsername,
      title: lookForm.title || "",
      caption: lookForm.caption || "",
      longContent: lookForm.longContent || "",
      seoTitle: lookForm.seoTitle || "",
      seoDescription: lookForm.seoDescription || "",
      heroImage: lookForm.heroImage || "",
      products: lookForm.products || [],
      faqs,
      similarCategories: lookForm.similarCategories || [],
      tags: lookForm.tags || [],
    };

    const res = await adminFetch("/api/influencer-looks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Error saving look. Check the console.");
      setSaving(false);
      return;
    }
    setLookForm(null);
    setSaving(false);
    mutateLooks();
  };

  const handleDeleteLook = async (lookId: string) => {
    if (!confirm("Delete this look?")) return;
    await adminFetch(`/api/influencer-looks?lookId=${lookId}`, { method: "DELETE" });
    mutateLooks();
  };

  /* ── product row helpers ── */
  const addProduct = (p: any) =>
    setLookForm((prev: any) => ({ ...prev, products: [...(prev.products || []), p] }));

  const updateProduct = (i: number, field: string, val: string) =>
    setLookForm((prev: any) => {
      const arr = [...(prev.products || [])];
      arr[i] = { ...arr[i], [field]: val };
      return { ...prev, products: arr };
    });

  const removeProduct = (i: number) =>
    setLookForm((prev: any) => ({
      ...prev,
      products: (prev.products || []).filter((_: any, j: number) => j !== i),
    }));

  /* ── faq helpers ── */
  const addFaq = () =>
    setLookForm((prev: any) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));

  const updateFaq = (i: number, field: "question" | "answer", val: string) =>
    setLookForm((prev: any) => {
      const arr = [...(prev.faqs || [])];
      arr[i] = { ...arr[i], [field]: val };
      return { ...prev, faqs: arr };
    });

  const removeFaq = (i: number) =>
    setLookForm((prev: any) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_: any, j: number) => j !== i),
    }));

  const toggleCategory = (cat: string) =>
    setLookForm((prev: any) => {
      const ex: string[] = prev.similarCategories || [];
      return {
        ...prev,
        similarCategories: ex.includes(cat)
          ? ex.filter((c: string) => c !== cat)
          : [...ex, cat],
      };
    });

  /* ══════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Influencer Manager</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage brands and their looks. Select a brand, then click "Add Look".
        </p>
      </div>

      {/* ─── BRANDS SECTION ─── */}
      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Influencer Brands ({brands.length})</h2>
          <button
            onClick={() => setBrandForm({ username: "", displayName: "", name: "", bio: "", logo: "" })}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition"
          >
            <Plus size={15} /> Add Brand
          </button>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
            <p className="text-sm">No brands yet. Click "Add Brand" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brands.map((b: any) => (
              <div
                key={b.username}
                onClick={() => setSelectedUsername(b.username)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition select-none ${
                  selectedUsername === b.username
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                }`}
              >
                <div className="h-14 flex items-center justify-center mb-2 overflow-hidden">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-2xl font-semibold text-gray-200">
                      {(b.name || b.displayName || "?").charAt(0)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate text-center">{b.displayName}</p>
                <p className="text-[10px] text-gray-400 text-center">@{b.username}</p>
                <div className="flex justify-center gap-3 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setBrandForm(b); }}
                    className="text-[11px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5"
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBrand(b.username); }}
                    className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── BRAND FORM MODAL ─── */}
      {brandForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{brandForm._id ? "Edit Brand" : "New Brand"}</h3>
              <button onClick={() => setBrandForm(null)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Username (e.g. sherricalnanhome)"
              value={brandForm.username}
              onChange={(e) => setBrandForm({ ...brandForm, username: e.target.value })}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              placeholder="Display Name"
              value={brandForm.displayName}
              onChange={(e) => setBrandForm({ ...brandForm, displayName: e.target.value })}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <textarea
              placeholder="Bio (optional)"
              value={brandForm.bio}
              onChange={(e) => setBrandForm({ ...brandForm, bio: e.target.value })}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 h-20 resize-none"
            />
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Logo</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openPicker((url) => setBrandForm((prev: any) => ({ ...prev, logo: url })))}
                  className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-600 hover:border-primary-400 hover:bg-gray-50 transition"
                >
                  <ImagePlus size={15} /> Choose from Library
                </button>
                {brandForm.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandForm.logo} alt="" className="h-14 object-contain" />
                )}
              </div>
            </div>
            <button
              onClick={handleSaveBrand}
              disabled={saving}
              className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 hover:bg-primary-700 transition"
            >
              {saving ? "Saving…" : "Save Brand"}
            </button>
          </div>
        </div>
      )}

      {/* ─── LOOKS SECTION ─── */}
      {selectedUsername && (
        <section className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Looks — @{selectedUsername}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {looks.length} Look{looks.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <button
              onClick={openNewLook}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
            >
              <Plus size={15} /> Add Look
            </button>
          </div>

          {looks.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl py-16 text-center text-gray-400">
              <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No looks yet. Click "Add Look"!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {looks.map((look: any) => (
                <div key={look.lookId} className="border rounded-xl overflow-hidden group hover:shadow-sm transition">
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {look.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={look.heroImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={30} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditLook(look)}
                        className="bg-white text-black text-xs px-3 py-1.5 rounded-lg font-semibold"
                      >
                        Edit
                      </button>
                      <a
                        href={`/influencer/${selectedUsername}/posts/${look.lookId}`}
                        target="_blank"
                        className="bg-primary-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                      >
                        View
                      </a>
                    </div>
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {(look.products || []).length} items
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate text-gray-800">{look.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{look.caption}</p>
                    <button
                      onClick={() => handleDeleteLook(look.lookId)}
                      className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════
          LOOK FORM MODAL
          ════════════════════════════════════════════════ */}
      {lookForm && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl flex flex-col">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-lg sticky top-0 z-10">
                <h3 className="font-semibold text-lg text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    {lookForm.lookId
                      ? <><Edit2 size={18} className="text-primary-600" /> Edit Look</>
                      : <><Plus size={18} className="text-primary-600" /> New Look</>}
                  </span>
                </h3>
                <button
                  onClick={() => setLookForm(null)}
                  className="text-gray-400 hover:text-black transition"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">

                {/* Basic Info */}
                <div className="space-y-3">
                  <input
                    placeholder="Title (e.g. Coastal Bedroom Look) *"
                    value={lookForm.title}
                    onChange={(e) => setLookForm({ ...lookForm, title: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <textarea
                    placeholder="Caption (short description)"
                    value={lookForm.caption}
                    onChange={(e) => setLookForm({ ...lookForm, caption: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm h-16 resize-none outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>

                {/* ── Hero Image ── */}
                <SectionBox title="Hero Image (Main Photo)" icon={<Camera size={15} />} isOpen={openHero} onToggle={() => setOpenHero(!openHero)}>
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setLookForm((prev: any) => ({ ...prev, heroImage: url })))}
                    className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-600 hover:border-primary-400 hover:bg-gray-50 transition"
                  >
                    <ImagePlus size={15} /> Choose from Library
                  </button>
                  {lookForm.heroImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lookForm.heroImage} alt="" className="mt-2 h-48 w-full object-cover rounded-xl" />
                  )}
                </SectionBox>

                {/* ── Products ── */}
                <SectionBox
                  title="Products"
                  icon={<ShoppingBag size={15} />}
                  isOpen={openProducts}
                  onToggle={() => setOpenProducts(!openProducts)}
                  badge={(lookForm.products || []).length}
                >
                  {/* Search */}
                  <ProductSearchPicker onAdd={addProduct} />
                  <button
                    type="button"
                    onClick={() => addProduct({ id: uid(), name: "", image: "", price: "", link: "" })}
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 mt-1"
                  >
                    <Plus size={12} /> Add manually
                  </button>

                  {/* Product rows */}
                  <div className="space-y-3 mt-2">
                    {(lookForm.products || []).map((p: any, i: number) => (
                      <div key={p.id || i} className="border rounded-xl p-3 bg-gray-50 relative group">
                        <button
                          type="button"
                          onClick={() => removeProduct(i)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex gap-3">
                          {/* thumbnail */}
                          <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.image
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <ImageIcon size={18} className="text-gray-400" />
                            }
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <input
                              placeholder="Product name"
                              value={p.name}
                              onChange={(e) => updateProduct(i, "name", e.target.value)}
                              className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                            />
                            <div className="flex gap-2">
                              <input
                                placeholder="Price (e.g. €49.99)"
                                value={p.price}
                                onChange={(e) => updateProduct(i, "price", e.target.value)}
                                className="w-1/2 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                              />
                              <div className="w-1/2 flex gap-1.5">
                                <input
                                  placeholder="Image URL"
                                  value={p.image}
                                  onChange={(e) => updateProduct(i, "image", e.target.value)}
                                  className="min-w-0 flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => openPicker((url) => updateProduct(i, "image", url))}
                                  className="shrink-0 inline-flex items-center justify-center rounded-lg border border-primary-200 bg-white px-2.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                                >
                                  Library
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ExternalLink size={12} className="text-gray-400 shrink-0" />
                              <input
                                placeholder="Affiliate link (new tab)"
                                value={p.link || ""}
                                onChange={(e) => updateProduct(i, "link", e.target.value)}
                                className="flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionBox>

                {/* ── Similar Categories ── */}
                <SectionBox title="Similar Products (Categories)" icon={<Tag size={15} />} isOpen={openSimilar} onToggle={() => setOpenSimilar(!openSimilar)}>
                  <p className="text-xs text-gray-500">Choose categories — similar products will be shown.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CATS.map((cat) => {
                      const active = (lookForm.similarCategories || []).includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                            active
                              ? "bg-primary-500 text-white border-primary-500"
                              : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </SectionBox>

                {/* ── Long Content ── */}
                <SectionBox title="Long Content" icon={<FileText size={15} />} isOpen={openContent} onToggle={() => setOpenContent(!openContent)}>
                  <RichTextEditor
                    value={lookForm.longContent || ""}
                    onChange={(val) => setLookForm({ ...lookForm, longContent: val })}
                    placeholder="Long description text with formatting..."
                  />
                </SectionBox>

                {/* ── FAQs ── */}
                <SectionBox
                  title="FAQs"
                  icon={<HelpCircle size={15} />}
                  isOpen={openFaqs}
                  onToggle={() => setOpenFaqs(!openFaqs)}
                  badge={(lookForm.faqs || []).length}
                >
                  <div className="space-y-3">
                    {(lookForm.faqs || []).map((faq: any, i: number) => (
                      <div key={i} className="border rounded-xl p-3 bg-gray-50 relative group">
                        <button
                          type="button"
                          onClick={() => removeFaq(i)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={13} />
                        </button>
                        <input
                          placeholder="Question…"
                          value={faq.question}
                          onChange={(e) => updateFaq(i, "question", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-xs mb-2 outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <textarea
                          placeholder="Answer…"
                          value={faq.answer}
                          onChange={(e) => updateFaq(i, "answer", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-xs h-16 resize-none outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 mt-1"
                  >
                    <Plus size={12} /> Add FAQ
                  </button>
                  {(lookForm.faqs || []).length === 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      No FAQs → default FAQs will be set automatically.
                    </p>
                  )}
                </SectionBox>

                {/* ── SEO ── */}
                <SectionBox title="SEO" icon={<Globe size={15} />} isOpen={openSeo} onToggle={() => setOpenSeo(!openSeo)}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">SEO Title <span className="text-gray-400">(max. 60)</span></label>
                      <input
                        placeholder="SEO Title…"
                        value={lookForm.seoTitle || ""}
                        maxLength={60}
                        onChange={(e) => setLookForm({ ...lookForm, seoTitle: e.target.value })}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <p className="text-[11px] text-gray-400 text-right mt-0.5">{(lookForm.seoTitle || "").length}/60</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Meta Description <span className="text-gray-400">(max. 160)</span></label>
                      <textarea
                        placeholder="Meta Description…"
                        value={lookForm.seoDescription || ""}
                        maxLength={160}
                        onChange={(e) => setLookForm({ ...lookForm, seoDescription: e.target.value })}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <p className="text-[11px] text-gray-400 text-right mt-0.5">{(lookForm.seoDescription || "").length}/160</p>
                    </div>
                  </div>
                </SectionBox>

              </div>{/* end modal body */}

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex gap-3 sticky bottom-0">
                <button
                  onClick={() => setLookForm(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLook}
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition text-sm"
                >
                  {saving ? "Saving…" : <span className="inline-flex items-center justify-center gap-2"><Save size={16} /> Save Look</span>}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Media Library Picker ── */}
      <MediaPicker
        open={pickerCallback !== null}
        onClose={() => setPickerCallback(null)}
        onSelect={(item: MediaItem) => {
          pickerCallback?.(item.url);
          setPickerCallback(null);
        }}
        title="Select Image"
      />

    </div>
  );
}
