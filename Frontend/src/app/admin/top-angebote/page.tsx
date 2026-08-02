"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ImagePlus,
  Image as ImageIcon,
  Tag,
  Link2,
  FileText,
  HelpCircle,
  Search,
  Globe,
  Package,
  PackageSearch,
  Loader2,
} from "lucide-react";

// ─────────── Types ───────────
type Product = {
  _id: string;
  category: string;
  title: string;
  brandName?: string;
  brandLogo?: string;
  productLogo?: string;
  saleValue?: string;
  price?: string;
  oldPrice?: string;
  link?: string;
  sortOrder?: number;
};

// A furniture product as returned by /api/products.
type FurnitureProduct = {
  _id: string;
  product_name?: string;
  brand_name?: string;
  search_price?: number;
  display_price?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
};

const PICKER_PAGE_SIZE = 12;

type FAQ = { question: string; answer: string };

type Settings = {
  bannerImage?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  longContent?: string;
  faqs?: FAQ[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

const EMPTY_PRODUCT = {
  category: "",
  title: "",
  brandName: "",
  saleValue: "",
  price: "",
  oldPrice: "",
  link: "",
  sortOrder: 0,
};

const readJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Server returned ${res.status}: ${text.slice(0, 180)}`);
  }
};

// ─────────── Section Tabs ───────────
const TABS = [
  { id: "products", label: "Products Library", icon: Package },
  { id: "banner", label: "Banner Settings", icon: ImageIcon },
  { id: "content", label: "Long Content", icon: FileText },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "seo", label: "SEO", icon: Globe },
];

// ─────────── Main Page ───────────
export default function TopAngeboteAdmin() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Product form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [productLogoUrl, setProductLogoUrl] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");

  // Category filter
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Settings>({
    bannerImage: "",
    bannerTitle: "",
    bannerSubtitle: "",
    pageTitle: "",
    pageSubtitle: "",
    longContent: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    faqs: [],
  });

  // Media library picker — holds the callback that receives the selected URL.
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => setPickerCallback(() => cb);

  // Brand-name → logo map, so catalog picks carry a logo automatically.
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const resolveLogo = (name?: string) => (name ? brandLogos[name.toLowerCase()] || "" : "");

  // Furniture-product picker modal ("Choose from Products").
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogItems, setCatalogItems] = useState<FurnitureProduct[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSearchInput, setCatalogSearchInput] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPages, setCatalogPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});

  // ── Fetch ──
  const fetchProducts = async () => {
    try {
      const res = await adminFetch(`/api/top-angebote-products?t=${Date.now()}`);
      const rawText = await res.text(); let data; try { data = JSON.parse(rawText); } catch(err) { throw new Error(`Server Error (${res.status}): ${rawText.slice(0,100)}`); }
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setProducts([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await adminFetch(`/api/top-angebote-settings?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data?.details || data?.error || `Server returned ${res.status}`);
      }
      setSettingsForm({
        bannerImage: data.bannerImage || "",
        bannerTitle: data.bannerTitle || "",
        bannerSubtitle: data.bannerSubtitle || "",
        pageTitle: data.pageTitle || "",
        pageSubtitle: data.pageSubtitle || "",
        longContent: data.longContent || "",
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        seoKeywords: data.seoKeywords || "",
        faqs: data.faqs || [],
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    adminFetch("/api/brands")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const b of d?.brands || []) {
          if (b?.name && b?.logo) map[String(b.name).toLowerCase()] = b.logo;
        }
        setBrandLogos(map);
      })
      .catch(() => {});
  }, []);

  // ── Catalog picker: browse the furniture catalog and add straight to a category ──
  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(catalogPage),
        limit: String(PICKER_PAGE_SIZE),
        sort: "recent",
      });
      if (catalogSearch) params.set("search", catalogSearch);
      const res = await adminFetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setCatalogItems(Array.isArray(data.products) ? data.products : []);
      setCatalogPages(data.pages || 1);
    } catch (e) {
      console.error("Error loading catalog:", e);
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (showCatalog) fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCatalog, catalogPage, catalogSearch]);

  const openCatalog = () => {
    setCatalogCategory(filterCategory !== "all" ? filterCategory : "");
    setCatalogPage(1);
    setCatalogSearch("");
    setCatalogSearchInput("");
    setShowCatalog(true);
  };

  const addFromCatalog = async (p: FurnitureProduct) => {
    if (!catalogCategory.trim()) return alert("Please enter a category first.");
    setAddingIds((prev) => ({ ...prev, [p._id]: true }));
    try {
      const payload = {
        category: catalogCategory.trim(),
        title: p.product_name || "Unbenanntes Produkt",
        price: p.display_price || (p.search_price ? `€${p.search_price}` : ""),
        link: p.aw_deep_link || p.merchant_deep_link || "#",
        brandName: p.brand_name || "",
        brandLogo: resolveLogo(p.brand_name),
        productLogo: p.merchant_image_url || p.aw_image_url || "",
      };
      const res = await adminFetch("/api/top-angebote-products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to add product");
    } finally {
      setAddingIds((prev) => {
        const next = { ...prev };
        delete next[p._id];
        return next;
      });
    }
  };

  // ── Derived data ──
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brandName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Product Form Handlers ──
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
    setProductLogoUrl("");
    setBrandLogoUrl("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({
      category: p.category,
      title: p.title,
      brandName: p.brandName || "",
      saleValue: p.saleValue || "",
      price: p.price || "",
      oldPrice: p.oldPrice || "",
      link: p.link || "",
      sortOrder: p.sortOrder || 0,
    });
    setProductLogoUrl(p.productLogo || "");
    setBrandLogoUrl(p.brandLogo || "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category) return alert("Title and Category are required.");
    setLoading(true);

    const payload = {
      ...form,
      productLogo: productLogoUrl,
      brandLogo: brandLogoUrl,
    };

    try {
      const url = editingId
        ? `/api/top-angebote-products/${editingId}`
        : "/api/top-angebote-products";
      const method = editingId ? "PUT" : "POST";
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchProducts();
        closeForm();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await adminFetch(`/api/top-angebote-products/${id}`, { method: "DELETE" });
      await fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Settings Save ──
  const handleSettingsSave = async (e: React.FormEvent, _tab?: string) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await adminFetch("/api/top-angebote-settings", {
        method: "PUT",
        body: JSON.stringify(settingsForm),
      });
      const data = await readJsonResponse(res);
      if (res.ok) {
        alert("✅ Settings saved successfully!");
        await fetchSettings();
      } else {
        alert("❌ Save failed: " + (data?.error || "Unknown error") + (data?.details ? `\n\nDetails: ${data.details}` : ""));
      }
    } catch (err: any) {
      console.error(err);
      alert("❌ Network error while saving: " + (err.message || "Please try again."));
    } finally {
      setSavingSettings(false);
    }
  };

  // ── FAQ helpers ──
  const addFaq = () =>
    setSettingsForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));

  const updateFaq = (i: number, field: "question" | "answer", val: string) =>
    setSettingsForm((prev) => {
      const faqs = [...(prev.faqs || [])];
      faqs[i] = { ...faqs[i], [field]: val };
      return { ...prev, faqs };
    });

  const removeFaq = (i: number) =>
    setSettingsForm((prev) => {
      const faqs = [...(prev.faqs || [])];
      faqs.splice(i, 1);
      return { ...prev, faqs };
    });

  // ─────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Top Angebote – Admin</h1>
        <p className="text-gray-500 mt-1">
          Manage products, banner, content, FAQs and SEO for the{" "}
          <a
            href="/topaanbiedingen"
            target="_blank"
            className="text-primary-600 underline"
          >
            /topaanbiedingen
          </a>{" "}
          page.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} className={activeTab === tab.id ? "" : "text-primary-600"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ PRODUCTS TAB ═══════════════ */}
      {activeTab === "products" && (
        <div>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center flex-1">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black w-52"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openCatalog}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                <PackageSearch size={16} className="text-primary-600" /> Choose from Products
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          {/* Product Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {editingId
                        ? <><Edit size={18} className="text-primary-600" /> Edit Product</>
                        : <><Plus size={18} className="text-primary-600" /> Add New Product</>}
                    </span>
                  </h2>
                  <button onClick={closeForm} className="text-gray-400 hover:text-gray-700">
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category / Section Heading <span className="text-red-500">*</span>
                    </label>
                    <input
                      list="category-list"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g. Blitzangebote, Sale Highlights..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <datalist id="category-list">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-400 mt-1">
                      Type a new category or pick existing one
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Product name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  {/* Product Logo */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Image / Logo</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openPicker(setProductLogoUrl)}
                        className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition"
                      >
                        <ImagePlus size={16} /> Choose from Library
                      </button>
                      {productLogoUrl && (
                        <img
                          src={productLogoUrl}
                          alt="product"
                          className="w-14 h-14 object-contain rounded-lg border border-gray-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Sale Value */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sale Value{" "}
                      <span className="text-red-500 font-semibold">(shown in red)</span>
                    </label>
                    <input
                      value={form.saleValue}
                      onChange={(e) => setForm({ ...form, saleValue: e.target.value })}
                      placeholder="e.g. -30% or SALE"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Price</label>
                      <input
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="€ 49,99"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Old Price{" "}
                        <span className="text-gray-400">(strikethrough)</span>
                      </label>
                      <input
                        value={form.oldPrice}
                        onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                        placeholder="€ 79,99"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Brand */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand Name</label>
                      <input
                        value={form.brandName}
                        onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                        placeholder="e.g. IKEA, Amazon"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand Logo</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPicker(setBrandLogoUrl)}
                          className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition"
                        >
                          <ImagePlus size={14} /> Library
                        </button>
                        {brandLogoUrl && (
                          <img
                            src={brandLogoUrl}
                            alt="brand"
                            className="w-10 h-10 object-contain rounded-lg border border-gray-200"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Link{" "}
                      <span className="text-gray-400">(opens in new tab)</span>
                    </label>
                    <div className="relative">
                      <Link2
                        size={16}
                        className="absolute left-3 top-2.5 text-gray-400"
                      />
                      <input
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 transition disabled:opacity-60"
                    >
                      {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products grouped by category */}
          {categories.length === 0 && !searchQuery ? (
            <div className="bg-white rounded-lg p-16 text-center text-gray-400 border border-dashed border-gray-200">
              <Tag size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No products yet.</p>
              <p className="text-sm mt-1">Click "Add Product" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(filterCategory === "all"
                ? Array.from(
                    new Set(filteredProducts.map((p) => p.category))
                  )
                : [filterCategory]
              ).map((cat) => {
                const catProducts = filteredProducts.filter(
                  (p) => p.category === cat
                );
                if (catProducts.length === 0) return null;
                return (
                  <div
                    key={cat}
                    className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-gray-900 font-semibold text-sm">{cat}</h3>
                      <span className="text-gray-400 text-sm">
                        {catProducts.length} product{catProducts.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Product rows */}
                    <div className="divide-y divide-gray-50">
                      {catProducts.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition"
                        >
                          {/* Product image */}
                          <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.productLogo ? (
                              <img
                                src={p.productLogo}
                                alt={p.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-gray-300" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {p.saleValue && (
                                <span className="text-red-600 text-xs font-semibold">
                                  {p.saleValue}
                                </span>
                              )}
                              {p.price && (
                                <span className="text-gray-700 text-sm font-medium">
                                  {p.price}
                                </span>
                              )}
                              {p.oldPrice && (
                                <span className="text-gray-400 text-xs line-through">
                                  {p.oldPrice}
                                </span>
                              )}
                              {p.brandName && (
                                <span className="text-gray-500 text-xs">
                                  · {p.brandName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Brand Logo */}
                          {p.brandLogo && (
                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img
                                src={p.brandLogo}
                                alt={p.brandName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {/* Link badge */}
                          {p.link && (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-500 hover:text-primary-700"
                              title="Open link"
                            >
                              <Link2 size={16} />
                            </a>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center text-gray-400 border border-dashed border-gray-200">
                  <p>No products match your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ BANNER TAB ═══════════════ */}
      {activeTab === "banner" && (
        <form onSubmit={(e) => handleSettingsSave(e, activeTab)}>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-4 flex items-center gap-2"><ImageIcon size={20} className="text-primary-600" /> Banner & Page Settings</h2>

            {/* Banner image */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Banner Image
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (Recommended: 1920×600px)
                </span>
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                {settingsForm.bannerImage ? (
                  <div className="space-y-3">
                    <img
                      src={settingsForm.bannerImage}
                      alt="Banner preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => openPicker((url) => setSettingsForm((prev) => ({ ...prev, bannerImage: url })))}
                      className="text-sm text-primary-600 underline"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setSettingsForm((prev) => ({ ...prev, bannerImage: url })))}
                    className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 w-full"
                  >
                    <ImagePlus size={32} />
                    <span className="text-sm">Choose banner image from library</span>
                    <span className="text-xs text-gray-300">PNG, JPG, WebP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banner Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Banner Title (Big Heading)</label>
              <input
                value={settingsForm.bannerTitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, bannerTitle: e.target.value })
                }
                placeholder="MEGA SOMMERSALE"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Banner Subtitle */}
            <div>
              <label className="block text-sm font-semibold mb-2">Banner Subtitle</label>
              <input
                value={settingsForm.bannerSubtitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, bannerSubtitle: e.target.value })
                }
                placeholder="Bis zu 70% RABATT auf Möbel & Wohnaccessoires"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <hr className="border-gray-100" />

            {/* Page Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Page Main Title</label>
              <input
                value={settingsForm.pageTitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, pageTitle: e.target.value })
                }
                placeholder="Top Angebote"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Page Subtitle */}
            <div>
              <label className="block text-sm font-semibold mb-2">Page Subtitle</label>
              <input
                value={settingsForm.pageSubtitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, pageSubtitle: e.target.value })
                }
                placeholder="Die besten Deals für Ihr Zuhause"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              <Save size={16} />
              {savingSettings ? "Saving..." : "Save Banner Settings"}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════ CONTENT TAB ═══════════════ */}
      {activeTab === "content" && (
        <form onSubmit={(e) => handleSettingsSave(e, activeTab)}>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-4 flex items-center gap-2"><FileText size={20} className="text-primary-600" /> Long Content (Bottom of Page)</h2>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Content{" "}
                <span className="text-gray-400 font-normal">(HTML supported)</span>
              </label>
              <RichTextEditor
                value={settingsForm.longContent || ""}
                onChange={(val) =>
                  setSettingsForm({ ...settingsForm, longContent: val })
                }
                placeholder="Geben Sie hier einen langen Beschreibungstext ein. HTML-Tags wie <h2>, <p>, <strong>, <ul> werden unterstützt..."
              />
              <p className="text-xs text-gray-400 mt-1">
                This content appears at the bottom of the /topaanbiedingen page before FAQs.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              <Save size={16} />
              {savingSettings ? "Saving..." : "Save Content"}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════ FAQs TAB ═══════════════ */}
      {activeTab === "faqs" && (
        <form onSubmit={(e) => handleSettingsSave(e, activeTab)}>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><HelpCircle size={20} className="text-primary-600" /> FAQs</h2>
              <button
                type="button"
                onClick={addFaq}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                <Plus size={15} /> Add FAQ
              </button>
            </div>

            {(settingsForm.faqs || []).length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <HelpCircle size={36} className="mx-auto mb-3 opacity-30" />
                <p>No FAQs yet. Click "Add FAQ" to add one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(settingsForm.faqs || []).map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-xl p-5 space-y-3 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Question
                      </label>
                      <input
                        value={faq.question}
                        onChange={(e) => updateFaq(i, "question", e.target.value)}
                        placeholder="FAQ Question..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Answer
                      </label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(i, "answer", e.target.value)}
                        placeholder="Answer..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              <Save size={16} />
              {savingSettings ? "Saving..." : "Save FAQs"}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════ SEO TAB ═══════════════ */}
      {activeTab === "seo" && (
        <form onSubmit={(e) => handleSettingsSave(e, activeTab)}>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-4 flex items-center gap-2"><Globe size={20} className="text-primary-600" /> SEO Settings</h2>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Meta Title
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (shown in browser tab & Google)
                </span>
              </label>
              <input
                value={settingsForm.seoTitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, seoTitle: e.target.value })
                }
                placeholder="Top Angebote – Beste Möbel-Deals | NL Furniture"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(settingsForm.seoTitle || "").length}/60 chars recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Meta Description</label>
              <textarea
                value={settingsForm.seoDescription}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, seoDescription: e.target.value })
                }
                rows={4}
                placeholder="Entdecken Sie die besten Angebote für Möbel und Wohnaccessoires..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(settingsForm.seoDescription || "").length}/160 chars recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Keywords
                <span className="ml-2 text-xs text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                value={settingsForm.seoKeywords}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, seoKeywords: e.target.value })
                }
                placeholder="Möbel Sale, Wohnen Rabatt, Top Angebote..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Preview card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Google Preview
              </p>
              <div className="space-y-1">
                <p className="text-primary-700 text-base font-medium hover:underline cursor-default truncate">
                  {settingsForm.seoTitle || "Page Title"}
                </p>
                <p className="text-green-700 text-xs">
                  https://www.nl-furniture.nl/topaanbiedingen
                </p>
                <p className="text-gray-600 text-sm leading-snug line-clamp-2">
                  {settingsForm.seoDescription || "Page description will appear here..."}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              <Save size={16} />
              {savingSettings ? "Saving..." : "Save SEO Settings"}
            </button>
          </div>
        </form>
      )}

      {/* ── FURNITURE PRODUCT PICKER MODAL ── */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCatalog(false)}>
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Choose from Furniture Products</h3>
              <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Category / Section Heading <span className="text-red-500">*</span>
                </label>
                <input
                  list="catalog-category-list"
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  placeholder="e.g. Blitzangebote, Sale Highlights..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <datalist id="catalog-category-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">Products you add below go into this category.</p>
              </div>
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
                  {catalogItems.map((p) => {
                    const img = p.merchant_image_url || p.aw_image_url || "";
                    const price = p.display_price || (p.search_price ? `€${p.search_price}` : "");
                    const busy = !!addingIds[p._id];
                    return (
                      <div key={p._id} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                        <div className="relative h-28 bg-gray-50 flex items-center justify-center p-2">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
