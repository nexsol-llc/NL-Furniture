"use client";
import { adminFetch } from "@/lib/adminAuth";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";

export const dynamic = 'force-dynamic';

import useSWR from "swr";
import { useState, useCallback, useEffect } from "react";
import {
  Plus, Search, Edit2, X, ChevronDown, ChevronUp,
  Store, Tag, Link2, Image as ImageIcon, Trash2,
  Globe, FileText, HelpCircle, BarChart2, ArrowLeft,
  CheckCircle, AlertCircle, Loader2, ExternalLink, Save, ImagePlus, Star,
  Lightbulb, UserCircle, Package, PackageSearch,
} from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ───────────────────────────────────────────────────────────────────
interface Faq { question: string; answer: string; }
interface SocialLinks { twitter?: string; instagram?: string; linkedin?: string; website?: string; }
interface AuthorBox {
  authorId: string;
  bio: string;         // store-specific description shown in the Author Box
  updatedAt: string;
  // Read-only, hydrated from the referenced author (see /admin/authors) — not edited here.
  name: string;
  avatarUrl: string;
  role: string;
  socialLinks: SocialLinks;
}
interface StoreForm {
  _id?: string;
  name: string;
  slug: string;
  url: string;               // Landing page URL
  description: string;       // Short description
  longContent: string;       // Rich HTML long desc
  logo: string;              // Existing logo URL
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImage: string;
  sidebarText: string;
  faqs: Faq[];
  tips: string[];
  authorBox: AuthorBox;
  verifiedCoupons: string;
  avgSavings: string;
  totalOffers: string;
  publishDate: string;       // Separate from lastUpdated/createdAt — shown on frontend as "Zuletzt aktualisiert"
  featured: boolean;
}

const emptyAuthorBox = (): AuthorBox => ({
  authorId: "", bio: "", updatedAt: "",
  name: "", avatarUrl: "", role: "",
  socialLinks: { twitter: "", instagram: "", linkedin: "", website: "" },
});

const emptyForm = (): StoreForm => ({
  name: "", slug: "", url: "", description: "", longContent: "",
  logo: "", seoTitle: "", seoDescription: "", seoKeywords: "",
  canonicalUrl: "", ogImage: "", sidebarText: "",
  faqs: [], tips: [], authorBox: emptyAuthorBox(),
  verifiedCoupons: "", avgSavings: "", totalOffers: "", publishDate: "",
  featured: false,
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// "Zuletzt aktualisiert" is stored as either an ISO string or a legacy
// "d.m.yyyy" string; <input type="date"> needs a strict "yyyy-mm-dd" value.
const toDateInputValue = (raw?: string): string => {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const day = Number(dotMatch[1]);
    const month = Number(dotMatch[2]);
    let year = Number(dotMatch[3]);
    if (year < 100) year += 2000;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return "";
};


// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  title, icon, isOpen, onToggle, children, badge,
}: {
  title: string; icon: React.ReactNode; isOpen: boolean;
  onToggle: () => void; children: React.ReactNode; badge?: number | string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-primary-600">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge !== undefined && (
            <span className="bg-primary-100 text-primary-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen
          ? <ChevronUp size={16} className="text-gray-500" />
          : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      {isOpen && <div className="px-5 py-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CouponStoresAdmin() {
  // ── Data fetching
  const { data: storesData, mutate: mutateStores } = useSWR("/api/coupon-stores", fetcher);
  const { data: allBrandsData, mutate: mutateAllBrands } = useSWR("/api/brands", fetcher);
  const { data: authorsData } = useSWR("/api/authors", fetcher);
  const stores: any[] = storesData?.brands || [];
  const allBrands: any[] = allBrandsData?.brands || [];
  const authors: any[] = authorsData?.authors || [];

  // ── View state: null = store list, string = selected store slug (coupon view)
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");

  // ── Coupon data for selected store
  const { data: couponsData } = useSWR(
    selectedStore ? `/api/coupons?brandSlug=${selectedStore.slug}` : null,
    fetcher
  );
  const coupons: any[] = couponsData?.coupons || [];

  // ── Form / modal state
  const [form, setForm] = useState<StoreForm | null>(null);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // ── Collapsible sections in modal
  const [sBasic, setSBasic] = useState(true);
  const [sLong, setSLong] = useState(false);
  const [sFaqs, setSFaqs] = useState(false);
  const [sTips, setSTips] = useState(false);
  const [sAuthor, setSAuthor] = useState(false);
  const [sSeo, setSSeo] = useState(false);
  const [sSidebar, setSSidebar] = useState(false);
  const [sStats, setsSStats] = useState(false);

  // ── Brand products (View 2 — per-store "Choose from Products" + manual add)
  const { data: brandProductsData, mutate: mutateBrandProducts } = useSWR(
    selectedStore ? `/api/coupon-brand-products?brandSlug=${selectedStore.slug}` : null,
    fetcher
  );
  const brandProducts: any[] = Array.isArray(brandProductsData) ? brandProductsData : [];
  const [productForm, setProductForm] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSearchInput, setCatalogSearchInput] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPages, setCatalogPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addingProductIds, setAddingProductIds] = useState<Record<string, boolean>>({});

  // ── Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Filtered lists
  const filteredStores = stores.filter((s) =>
    s.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.slug?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const filteredCoupons = coupons.filter((c: any) =>
    c.brand?.toLowerCase().includes(couponSearch.toLowerCase()) ||
    c.title?.toLowerCase().includes(couponSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(couponSearch.toLowerCase()) ||
    c.discountText?.toLowerCase().includes(couponSearch.toLowerCase())
  );

  // ── Open Add New form
  const openAdd = () => {
    setForm(emptyForm());
    setSBasic(true); setSLong(false); setSFaqs(false); setSTips(false); setSAuthor(false);
    setSSeo(false); setSSidebar(false); setsSStats(false);
  };

  // ── Open Edit form (merge existing brand data)
  const openEdit = (brand: any) => {
    setForm({
      _id: brand._id,
      name: brand.name || "",
      slug: brand.slug || "",
      url: brand.url || "",
      description: brand.description || "",
      longContent: brand.longContent || "",
      logo: brand.logo || "",
      seoTitle: brand.seoTitle || "",
      seoDescription: brand.seoDescription || "",
      seoKeywords: brand.seoKeywords || "",
      canonicalUrl: brand.canonicalUrl || "",
      ogImage: brand.ogImage || "",
      sidebarText: brand.sidebarText || "",
      faqs: brand.faqs || [],
      tips: brand.tips || [],
      authorBox: { ...emptyAuthorBox(), ...(brand.authorBox || {}), socialLinks: { ...emptyAuthorBox().socialLinks, ...(brand.authorBox?.socialLinks || {}) } },
      verifiedCoupons: brand.verifiedCoupons || "",
      avgSavings: brand.avgSavings || "",
      totalOffers: brand.totalOffers || "",
      publishDate: brand.publishDate || "",
      featured: !!brand.featured,
    });
    setSBasic(true); setSLong(false); setSFaqs(false); setSTips(false); setSAuthor(false);
    setSSeo(false); setSSidebar(false); setsSStats(false);
  };

  // ── Save (Create or Update)
  const handleSave = async () => {
    if (!form) return;
    if (!form.name) { setToast({ type: "err", msg: "Store name required!" }); return; }

    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      url: form.url,
      description: form.description,
      longContent: form.longContent,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoKeywords: form.seoKeywords,
      canonicalUrl: form.canonicalUrl,
      ogImage: form.ogImage,
      sidebarText: form.sidebarText,
      faqs: form.faqs,
      tips: form.tips,
      authorBox: form.authorBox.authorId
        ? { authorId: form.authorBox.authorId, bio: form.authorBox.bio, updatedAt: form.authorBox.updatedAt || new Date().toISOString() }
        : { authorId: "", bio: "", updatedAt: "" },
      verifiedCoupons: form.verifiedCoupons,
      avgSavings: form.avgSavings,
      totalOffers: form.totalOffers,
      publishDate: form.publishDate,
      logo: form.logo,
      featured: form.featured,
    };

    const isEdit = !!form._id;
    const slug = form.slug || slugify(form.name);
    const url = isEdit ? `/api/brands/${slug}` : "/api/brands";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setToast({ type: "ok", msg: isEdit ? "Store updated ✅" : "Store created ✅" });
        if (isEdit && selectedStore?.slug === data.updated?.slug) {
          setSelectedStore(data.updated);
        }
        setForm(null);
        mutateStores();
        mutateAllBrands();
      } else {
        const err = await res.json();
        setToast({ type: "err", msg: err.error || "Save failed ❌" });
      }
    } catch {
      setToast({ type: "err", msg: "Network error ❌" });
    } finally {
      setSaving(false);
    }
  };

  // ── FAQ helpers
  const addFaq = () =>
    setForm((prev) => prev ? { ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] } : prev);

  const updateFaq = (i: number, field: keyof Faq, val: string) =>
    setForm((prev) => {
      if (!prev) return prev;
      const faqs = [...prev.faqs];
      faqs[i] = { ...faqs[i], [field]: val };
      return { ...prev, faqs };
    });

  const removeFaq = (i: number) =>
    setForm((prev) => prev ? { ...prev, faqs: prev.faqs.filter((_, j) => j !== i) } : prev);

  // ── Tips helpers
  const addTip = () =>
    setForm((prev) => prev ? { ...prev, tips: [...prev.tips, ""] } : prev);

  const updateTip = (i: number, val: string) =>
    setForm((prev) => {
      if (!prev) return prev;
      const tips = [...prev.tips];
      tips[i] = val;
      return { ...prev, tips };
    });

  const removeTip = (i: number) =>
    setForm((prev) => prev ? { ...prev, tips: prev.tips.filter((_, j) => j !== i) } : prev);

  // ── Author Box helpers
  const updateAuthorBoxBio = (val: string) =>
    setForm((prev) => prev ? { ...prev, authorBox: { ...prev.authorBox, bio: val } } : prev);

  const updateAuthorBoxDate = (val: string) =>
    setForm((prev) => prev ? { ...prev, authorBox: { ...prev.authorBox, updatedAt: val } } : prev);

  const selectAuthor = (authorId: string) =>
    setForm((prev) => {
      if (!prev) return prev;
      const author = authors.find((a) => a._id === authorId);
      return {
        ...prev,
        authorBox: {
          ...prev.authorBox,
          authorId,
          name: author?.name || "",
          avatarUrl: author?.avatarUrl || "",
          role: author?.role || "",
          socialLinks: author?.socialLinks || {},
        },
      };
    });

  // ── Brand Products: manual add/edit form
  const emptyProductForm = () => ({
    title: "", productLogo: "", saleValue: "", price: "", oldPrice: "", link: "", sortOrder: 0,
  });

  const openAddProduct = () => setProductForm(emptyProductForm());

  const openEditProduct = (p: any) =>
    setProductForm({
      _id: p._id,
      title: p.title || "",
      productLogo: p.productLogo || "",
      saleValue: p.saleValue || "",
      price: p.price || "",
      oldPrice: p.oldPrice || "",
      link: p.link || "",
      sortOrder: p.sortOrder || 0,
    });

  const closeProductForm = () => setProductForm(null);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm?.title || !selectedStore) return;
    setSavingProduct(true);
    try {
      const payload = { ...productForm, brandSlug: selectedStore.slug };
      const isEdit = !!productForm._id;
      const url = isEdit ? `/api/coupon-brand-products/${productForm._id}` : "/api/coupon-brand-products";
      const method = isEdit ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        await mutateBrandProducts();
        closeProductForm();
      } else {
        const err = await res.json();
        setToast({ type: "err", msg: err.error || "Save failed ❌" });
      }
    } catch {
      setToast({ type: "err", msg: "Network error ❌" });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await adminFetch(`/api/coupon-brand-products/${id}`, { method: "DELETE" });
    mutateBrandProducts();
  };

  // ── Brand Products: "Choose from Products" furniture-catalog picker
  const openCatalog = () => {
    setCatalogPage(1);
    setCatalogSearch("");
    setCatalogSearchInput("");
    setShowCatalog(true);
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams({ page: String(catalogPage), limit: "12", sort: "recent" });
      if (catalogSearch) params.set("search", catalogSearch);
      const res = await adminFetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setCatalogItems(Array.isArray(data.products) ? data.products : []);
      setCatalogPages(data.pages || 1);
    } catch {
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (showCatalog) fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCatalog, catalogPage, catalogSearch]);

  const addFromCatalog = async (p: any) => {
    if (!selectedStore) return;
    setAddingProductIds((prev) => ({ ...prev, [p._id]: true }));
    try {
      const payload = {
        brandSlug: selectedStore.slug,
        title: p.product_name || "Unbenanntes Produkt",
        price: p.display_price || (p.search_price ? `€${p.search_price}` : ""),
        link: p.aw_deep_link || p.merchant_deep_link || "#",
        productLogo: p.merchant_image_url || p.aw_image_url || "",
      };
      const res = await adminFetch("/api/coupon-brand-products", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add product");
      }
      await mutateBrandProducts();
    } catch (err: any) {
      setToast({ type: "err", msg: err.message || "Failed to add product ❌" });
    } finally {
      setAddingProductIds((prev) => {
        const next = { ...prev };
        delete next[p._id];
        return next;
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-2.5 rounded-lg shadow-xl text-white font-semibold text-sm transition-all ${toast.type === "ok" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.type === "ok" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ══ VIEW 1: Store Library ══════════════════════════════════════════════ */}
      {!selectedStore && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Coupon Stores</h1>
              <p className="text-gray-500 text-sm mt-1">
                All stores — {stores.length} store{stores.length !== 1 ? "s" : ""} (with or without coupons)
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-sm shadow-primary-200"
            >
              <Plus size={18} /> Add New Store
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store name or slug..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white shadow-sm"
            />
          </div>

          {/* Stores Grid */}
          {filteredStores.length === 0 ? (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg bg-white">
              <Store size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">
                {storeSearch ? `No store found for "${storeSearch}"` : "No coupon stores yet"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredStores.map((store: any) => (
                <div
                  key={store._id}
                  className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-sm hover:border-primary-200 transition-all group cursor-pointer overflow-hidden"
                  onClick={() => { setSelectedStore(store); setCouponSearch(""); }}
                >
                  {/* Logo area */}
                  <div className="relative bg-gradient-to-br from-gray-50 to-primary-50 h-28 flex items-center justify-center p-4 border-b border-gray-100">
                    {store.featured && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        <Star size={10} className="fill-white" /> Featured
                      </span>
                    )}
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="max-h-16 max-w-[120px] object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-primary-400">
                          {store.name?.[0] || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 text-base truncate">{store.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{store.slug}</p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <Tag size={12} className={store.couponCount > 0 ? "text-primary-500" : "text-gray-400"} />
                      <span className={`text-xs font-semibold ${store.couponCount > 0 ? "text-primary-600" : "text-gray-400"}`}>
                        {store.couponCount} coupon{store.couponCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedStore(store)}
                        className="flex-1 text-xs font-semibold py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition flex items-center justify-center gap-1"
                      >
                        <Tag size={12} /> Coupons
                      </button>
                      <button
                        onClick={() => openEdit(store)}
                        className="flex-1 text-xs font-semibold py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition flex items-center justify-center gap-1"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ VIEW 2: Coupon Library (Store selected) ═══════════════════════════ */}
      {selectedStore && (
        <>
          {/* Back + Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedStore(null)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700 transition"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <div className="flex items-center gap-3">
                {selectedStore.logo && (
                  <a href={selectedStore.url || "#"} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedStore.logo}
                      alt={selectedStore.name}
                      className="h-10 w-auto object-contain border rounded-xl p-1 hover:shadow-sm transition"
                    />
                  </a>
                )}
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{selectedStore.name}</h1>
                  <p className="text-xs text-gray-400 font-mono">{selectedStore.slug}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => openEdit(selectedStore)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
            >
              <Edit2 size={15} /> Edit Store
            </button>
          </div>

          {/* Coupon Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search coupons by title, brand or code..."
              value={couponSearch}
              onChange={(e) => setCouponSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white shadow-sm"
            />
          </div>

          {/* Coupon List */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Tag size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">
                  {couponSearch ? "No coupons matched" : "No coupons in this store yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCoupons.map((c: any) => (
                  <div key={c._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                    {/* Discount badge */}
                    <div className="flex-shrink-0 w-20 text-center">
                      {c.discountText && (
                        <span className="inline-block bg-primary-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl">
                          {c.discountText}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{c.code}</span>
                        {" · "}
                        <span className="capitalize">{c.type}</span>
                      </p>
                      {c.badge && (
                        <span className="inline-block mt-1.5 bg-amber-100 text-amber-700 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                          {c.badge}
                        </span>
                      )}
                    </div>

                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition flex-shrink-0"
                    >
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package size={16} className="text-primary-600" /> Products
                <span className="text-gray-400 text-sm font-normal">
                  ({brandProducts.length})
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={openCatalog}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  <PackageSearch size={14} className="text-primary-600" /> Choose from Products
                </button>
                <button
                  onClick={openAddProduct}
                  className="flex items-center gap-2 bg-primary-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            {brandProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">No products in this store yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {brandProducts.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.productLogo ? (
                        <img src={p.productLogo} alt={p.title} className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {p.saleValue && <span className="text-red-600 text-xs font-semibold">{p.saleValue}</span>}
                        {p.price && <span className="text-gray-700 text-xs font-medium">{p.price}</span>}
                        {p.oldPrice && <span className="text-gray-400 text-xs line-through">{p.oldPrice}</span>}
                      </div>
                    </div>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700 flex-shrink-0">
                        <Link2 size={16} />
                      </a>
                    )}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEditProduct(p)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p._id)} className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ */}
      {form && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="min-h-full flex items-start justify-center p-4 py-10">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl flex flex-col">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary-600 to-primary-600 rounded-t-lg">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  {form._id
                    ? <><Edit2 size={18} /> Edit Store</>
                    : <><Plus size={18} /> Add New Store</>}
                </h2>
                <button
                  onClick={() => setForm(null)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-4 overflow-y-auto max-h-[75vh]">

                {/* ── Section: Basic Info ── */}
                <Section
                  title="Basic Information"
                  icon={<Store size={16} />}
                  isOpen={sBasic}
                  onToggle={() => setSBasic(!sBasic)}
                >
                  {/* Store Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({
                        ...form,
                        name: e.target.value,
                        slug: form._id ? form.slug : slugify(e.target.value),
                      })}
                      placeholder="e.g. IKEA"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Short Description
                    </label>
                    <RichDescriptionEditor
                      value={form.description}
                      onChange={(html) => setForm({ ...form, description: html })}
                      placeholder="Short store intro — shown in the hero area"
                      minHeight={120}
                      headings={false}
                    />
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {form.logo && (
                        <img
                          src={form.logo}
                          alt="logo"
                          className="h-16 w-auto object-contain border rounded-xl p-2"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setLogoPickerOpen(true)}
                        className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition text-sm text-gray-600"
                      >
                        <ImagePlus size={18} className="text-gray-400" /> Choose from Library
                      </button>
                      {form.logo && (
                        <button type="button" onClick={() => setForm({ ...form, logo: "" })} className="text-xs text-red-500 hover:underline font-semibold">Remove</button>
                      )}
                    </div>
                  </div>

                  {/* Landing Page URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Landing Page URL <span className="text-gray-400">(logo click opens this)</span>
                    </label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-primary-400">
                      <Link2 size={14} className="text-gray-400 flex-shrink-0" />
                      <input
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 py-2.5 text-sm outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Featured */}
                  <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span className="text-sm text-gray-700 font-medium">Featured store</span>
                    <span className="text-xs text-gray-400">(highlighted on the site)</span>
                  </label>
                </Section>

                {/* ── Section: Long Description (Rich Editor) ── */}
                <Section
                  title="Long Description (Rich Content)"
                  icon={<FileText size={16} />}
                  isOpen={sLong}
                  onToggle={() => setSLong(!sLong)}
                >
                  <p className="text-xs text-gray-500 -mt-1">
                    Add headings (H2/H3), paragraphs, images and internal links here.
                  </p>
                  <RichDescriptionEditor
                    value={form.longContent}
                    onChange={(html) => setForm(prev => prev ? { ...prev, longContent: html } : prev)}
                    placeholder="Write the long store description..."
                    minHeight={240}
                  />
                </Section>

                {/* ── Section: FAQs ── */}
                <Section
                  title="FAQs"
                  icon={<HelpCircle size={16} />}
                  isOpen={sFaqs}
                  onToggle={() => setSFaqs(!sFaqs)}
                  badge={form.faqs.length || undefined}
                >
                  <div className="space-y-3">
                    {form.faqs.map((faq, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50 relative group">
                        <button
                          type="button"
                          onClick={() => removeFaq(i)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          placeholder="Question..."
                          value={faq.question}
                          onChange={(e) => updateFaq(i, "question", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs mb-2 outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <RichDescriptionEditor
                          value={faq.answer}
                          onChange={(html) => updateFaq(i, "answer", html)}
                          placeholder="Answer..."
                          minHeight={110}
                          headings={false}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition mt-1"
                  >
                    <Plus size={14} /> Add New FAQ
                  </button>
                  {form.faqs.length === 0 && (
                    <p className="text-[11px] text-gray-400">No FAQs yet — click "Add New FAQ" above</p>
                  )}
                </Section>

                {/* ── Section: Tips ── */}
                <Section
                  title="Tips"
                  icon={<Lightbulb size={16} />}
                  isOpen={sTips}
                  onToggle={() => setSTips(!sTips)}
                  badge={form.tips.length || undefined}
                >
                  <div className="space-y-2">
                    {form.tips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={tip}
                          onChange={(e) => updateTip(i, e.target.value)}
                          placeholder="e.g. Sign up for the newsletter for an extra 10% off"
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeTip(i)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addTip}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition mt-1"
                  >
                    <Plus size={14} /> Add Tip
                  </button>
                  {form.tips.length === 0 && (
                    <p className="text-[11px] text-gray-400">No tips yet — click "Add Tip" above</p>
                  )}
                </Section>

                {/* ── Section: Author Box ── */}
                <Section
                  title="Author Box"
                  icon={<UserCircle size={16} />}
                  isOpen={sAuthor}
                  onToggle={() => setSAuthor(!sAuthor)}
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Author</label>
                    <select
                      value={form.authorBox.authorId}
                      onChange={(e) => selectAuthor(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                    >
                      <option value="">— No author —</option>
                      {authors.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}{a.role ? ` — ${a.role}` : ""}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Authors (name, avatar, role, socials) are managed on the{" "}
                      <a href="/admin/authors" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Authors</a> page.
                    </p>
                  </div>

                  {form.authorBox.authorId && (
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      {form.authorBox.avatarUrl ? (
                        <img
                          src={form.authorBox.avatarUrl}
                          alt="avatar"
                          className="w-11 h-11 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                          <UserCircle size={22} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{form.authorBox.name}</p>
                        {form.authorBox.role && <p className="text-xs text-gray-500 truncate">{form.authorBox.role}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                    <RichDescriptionEditor
                      value={form.authorBox.bio}
                      onChange={(html) => updateAuthorBoxBio(html)}
                      placeholder="Short description shown in this store's author box..."
                      minHeight={130}
                      headings={false}
                    />
                  </div>

                  {form.authorBox.authorId && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aktualisiert am (Author Box Date)</label>
                      <input
                        type="date"
                        value={toDateInputValue(form.authorBox.updatedAt)}
                        onChange={(e) => updateAuthorBoxDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5">Leave empty to stamp today's date automatically on save.</p>
                    </div>
                  )}

                  {form.authorBox.name && (
                    <p className="text-[11px] text-gray-400">
                      Geschrieben von {form.authorBox.name}
                      {form.authorBox.updatedAt ? ` · Aktualisiert am ${new Date(form.authorBox.updatedAt).toLocaleDateString("de-DE")}` : " · wird beim Speichern gestempelt"}
                    </p>
                  )}
                </Section>

                {/* ── Section: SEO ── */}
                <Section
                  title="SEO Settings"
                  icon={<Globe size={16} />}
                  isOpen={sSeo}
                  onToggle={() => setSSeo(!sSeo)}
                >
                  {/* SEO Title */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        SEO Title (Meta Title) <span className="text-gray-400">— max 60 chars</span>
                      </label>
                      <span className={`text-[11px] font-semibold ${form.seoTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                        {form.seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      value={form.seoTitle}
                      onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                      placeholder="Brand's best coupons & discount codes 2024"
                      maxLength={65}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        Meta Description <span className="text-gray-400">— max 160 chars</span>
                      </label>
                      <span className={`text-[11px] font-semibold ${form.seoDescription.length > 160 ? "text-red-500" : "text-gray-400"}`}>
                        {form.seoDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={form.seoDescription}
                      onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                      placeholder="Find the brand's best coupons, discount codes and deals here..."
                      rows={3}
                      maxLength={165}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* SEO Keywords */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      SEO Keywords <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <input
                      value={form.seoKeywords}
                      onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                      placeholder="brand coupon, discount code, promo code, sale"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Canonical URL <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      value={form.canonicalUrl}
                      onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                      placeholder="https://yoursite.com/brands/brand-slug"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* OG Image */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      OG Image URL <span className="text-gray-400">(Open Graph / Social share image)</span>
                    </label>
                    <input
                      value={form.ogImage}
                      onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                      placeholder="https://yoursite.com/og-image.jpg"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* SEO Preview */}
                  {(form.seoTitle || form.seoDescription) && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <p className="text-[10px] text-gray-400 font-semibold mb-2 uppercase tracking-widest">Google Preview</p>
                      <p className="text-primary-700 text-sm font-medium line-clamp-1">{form.seoTitle || form.name}</p>
                      <p className="text-xs text-green-700 mt-0.5">yoursite.com/brands/{form.slug}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{form.seoDescription}</p>
                    </div>
                  )}
                </Section>

                {/* ── Section: Sidebar Box ── */}
                <Section
                  title="Sidebar Box Text (Left Panel)"
                  icon={<BarChart2 size={16} />}
                  isOpen={sSidebar}
                  onToggle={() => setSSidebar(!sSidebar)}
                >
                  <p className="text-xs text-gray-500 -mt-1">
                    Text for the left sidebar box on the store page (3 lines recommended)
                  </p>
                  <textarea
                    value={form.sidebarText}
                    onChange={(e) => setForm({ ...form, sidebarText: e.target.value })}
                    placeholder={"✅ Verified Coupons: 12\n💰 Avg. Savings: $25\n🕐 Last Updated: Today"}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </Section>

                {/* ── Section: Stats ── */}
                <Section
                  title="Store Stats (Verified Coupons, Avg Savings...)"
                  icon={<Tag size={16} />}
                  isOpen={sStats}
                  onToggle={() => setsSStats(!sStats)}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verified Coupons</label>
                      <input
                        value={form.verifiedCoupons}
                        onChange={(e) => setForm({ ...form, verifiedCoupons: e.target.value })}
                        placeholder="12"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Avg Savings</label>
                      <input
                        value={form.avgSavings}
                        onChange={(e) => setForm({ ...form, avgSavings: e.target.value })}
                        placeholder="$25"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Offers</label>
                      <input
                        value={form.totalOffers}
                        onChange={(e) => setForm({ ...form, totalOffers: e.target.value })}
                        placeholder="20"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Publish Date</label>
                      <input
                        type="date"
                        value={toDateInputValue(form.publishDate)}
                        onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Shown as "Zuletzt aktualisiert" on the store page</p>
                    </div>
                  </div>
                </Section>

              </div>{/* end modal body */}

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex gap-3 sticky bottom-0">
                <button
                  onClick={() => setForm(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-semibold transition text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-primary-200"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : form._id
                      ? <><Save size={16} /> Save Changes</>
                      : <><Plus size={16} /> Create Store</>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══ PRODUCT ADD/EDIT MODAL ══════════════════════════════════════════════ */}
      {productForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {productForm._id ? <><Edit2 size={18} className="text-primary-600" /> Edit Product</> : <><Plus size={18} className="text-primary-600" /> Add Product</>}
              </h2>
              <button onClick={closeProductForm} className="text-gray-400 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Title <span className="text-red-500">*</span></label>
                <input
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="Product name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLogoPickerOpen(true)}
                    className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition"
                  >
                    <ImagePlus size={16} /> Choose from Library
                  </button>
                  {productForm.productLogo && (
                    <img src={productForm.productLogo} alt="product" className="w-14 h-14 object-contain rounded-lg border border-gray-200" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sale Value <span className="text-gray-400">(shown in red)</span></label>
                <input
                  value={productForm.saleValue}
                  onChange={(e) => setProductForm({ ...productForm, saleValue: e.target.value })}
                  placeholder="e.g. -30% or SALE"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Price</label>
                  <input
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="€ 49,99"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Old Price</label>
                  <input
                    value={productForm.oldPrice}
                    onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })}
                    placeholder="€ 79,99"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Link</label>
                <input
                  value={productForm.link}
                  onChange={(e) => setProductForm({ ...productForm, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  value={productForm.sortOrder}
                  onChange={(e) => setProductForm({ ...productForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 transition disabled:opacity-60"
                >
                  {savingProduct ? "Saving..." : productForm._id ? "Update Product" : "Add Product"}
                </button>
                <button type="button" onClick={closeProductForm} className="px-6 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ FURNITURE PRODUCT PICKER MODAL ══════════════════════════════════════ */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCatalog(false)}>
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Choose from Furniture Products</h3>
              <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
              <form
                onSubmit={(e) => { e.preventDefault(); setCatalogPage(1); setCatalogSearch(catalogSearchInput.trim()); }}
                className="flex gap-2"
              >
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={catalogSearchInput}
                    onChange={(e) => setCatalogSearchInput(e.target.value)}
                    placeholder="Search products by name or brand..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button type="submit" className="px-4 bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider">
                  Search
                </button>
              </form>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : catalogItems.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-20">No products found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {catalogItems.map((p: any) => {
                    const img = p.merchant_image_url || p.aw_image_url || "";
                    const price = p.display_price || (p.search_price ? `€${p.search_price}` : "");
                    const busy = !!addingProductIds[p._id];
                    return (
                      <div key={p._id} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                        <div className="relative h-28 bg-gray-50 flex items-center justify-center p-2">
                          {img ? (
                            <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <ImagePlus className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem]">{p.product_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-500 uppercase truncate">{p.brand_name}</span>
                            <span className="text-xs font-bold text-gray-900">{price}</span>
                          </div>
                          <button
                            onClick={() => addFromCatalog(p)}
                            disabled={busy}
                            className="mt-3 inline-flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            {busy ? "Adding" : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {catalogPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-gray-100">
                <button
                  onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  disabled={catalogPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500">Page {catalogPage} of {catalogPages}</span>
                <button
                  onClick={() => setCatalogPage((p) => Math.min(catalogPages, p + 1))}
                  disabled={catalogPage >= catalogPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logo media picker */}
      <MediaPicker
        open={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        onSelect={(item: MediaItem) => {
          if (productForm) {
            setProductForm((prev: any) => (prev ? { ...prev, productLogo: item.url } : prev));
          } else {
            setForm((prev) => (prev ? { ...prev, logo: item.url } : prev));
          }
        }}
        title={productForm ? "Select Product Image" : "Select Store Logo"}
      />

    </div>
  );
}
