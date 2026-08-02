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
  Globe,
  Package,
  Images,
  Store,
  Percent,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";

// ─────────── Types ───────────
type Product = {
  _id: string;
  section: string;
  name: string;
  image?: string;
  discount?: string;
  price?: string;
  oldPrice?: string;
  brandName?: string;
  brandLogo?: string;
  link?: string;
  sortOrder?: number;
};

type FAQ = { question: string; answer: string };
type BannerSlide = { image: string; link?: string };
type BestCoupon = { title: string; description: string; image: string; link?: string; buttonText?: string };
type CashbackStore = { name: string; logo: string; link?: string };
type SliderGroup = {
  key: string;
  heading: string;
  subtitle?: string;
  brandName?: string;
  brandLogo?: string;
  sortOrder?: number;
};
type DesignerSection = {
  enabled: boolean;
  image: string;
  bgColor: string;
  smallHeading: string;
  title: string;
  subtitle: string;
  priceText: string;
  rightHeading: string;
  rightDescription: string;
  buttonText: string;
  buttonLink: string;
};

type Settings = {
  bannerSlides: BannerSlide[];
  bestCouponsHeading: string;
  bestCoupons: BestCoupon[];
  cashbackHeading: string;
  cashbackSubheading: string;
  cashbackStores: CashbackStore[];
  sliderGroups: SliderGroup[];
  designerSection: DesignerSection;
  dealsHeading: string;
  longContent: string;
  faqs: FAQ[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const EMPTY_DESIGNER_SECTION: DesignerSection = {
  enabled: true,
  image: "",
  bgColor: "#d97706",
  smallHeading: "5 Designer-empfohlen",
  title: "MÖBEL",
  subtitle: "Angebote",
  priceText: "Alle unter 499€",
  rightHeading: "5 Designer-empfohlene Möbelangebote — Alle unter 499€",
  rightDescription: "Exklusive Sparmöglichkeiten bei Premium-Möbeln freischalten",
  buttonText: "DESIGNER-TIPPS ANSEHEN",
  buttonLink: "",
};

const EMPTY_SETTINGS: Settings = {
  bannerSlides: [],
  bestCouponsHeading: "",
  bestCoupons: [],
  cashbackHeading: "",
  cashbackSubheading: "",
  cashbackStores: [],
  sliderGroups: [],
  designerSection: { ...EMPTY_DESIGNER_SECTION },
  dealsHeading: "",
  longContent: "",
  faqs: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

const DEALS_SECTION = "deals";

const EMPTY_PRODUCT = {
  name: "",
  image: "",
  discount: "",
  price: "",
  oldPrice: "",
  brandName: "",
  brandLogo: "",
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

const TABS = [
  { id: "banner", label: "Banner Slides", icon: Images },
  { id: "sliders", label: "Offer Sliders", icon: Package },
  { id: "designer", label: "Designer Section", icon: Sparkles },
  { id: "deals", label: "Mega Deals", icon: Tag },
  { id: "best", label: "Best Coupons", icon: Percent },
  { id: "cashback", label: "Cashback", icon: Store },
  { id: "content", label: "Long Content", icon: FileText },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "seo", label: "SEO", icon: Globe },
];

// ─────────── Reusable input ───────────
const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black";

export default function CouponsHomeAdmin() {
  const [activeTab, setActiveTab] = useState("banner");
  const [settingsForm, setSettingsForm] = useState<Settings>({ ...EMPTY_SETTINGS });
  const [products, setProducts] = useState<Product[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Product form (used by sliders + deals)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSection, setFormSection] = useState<string>("");
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });

  // Media picker
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => setPickerCallback(() => cb);

  // ── Fetch ──
  const fetchSettings = async () => {
    try {
      const res = await adminFetch(`/api/coupon-home-settings?t=${Date.now()}`, { cache: "no-store" });
      const data = await readJsonResponse(res);
      if (!res.ok) throw new Error(data?.error || `Server returned ${res.status}`);
      setSettingsForm({
        ...EMPTY_SETTINGS,
        ...data,
        designerSection: { ...EMPTY_DESIGNER_SECTION, ...(data?.designerSection || {}) },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await adminFetch(`/api/coupon-home-products?t=${Date.now()}`, { cache: "no-store" });
      const data = await readJsonResponse(res);
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  // ── Settings save ──
  const saveSettings = async (label: string) => {
    setSavingSettings(true);
    try {
      const res = await adminFetch("/api/coupon-home-settings", {
        method: "PUT",
        body: JSON.stringify(settingsForm),
      });
      const data = await readJsonResponse(res);
      if (res.ok) {
        await fetchSettings();
        alert(`✅ ${label} saved!`);
      } else {
        alert("❌ Error: " + (data?.error || "Unknown"));
      }
    } catch (err: any) {
      alert("❌ Network error: " + (err.message || "Please try again."));
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Product handlers ──
  const openAddProduct = (section: string) => {
    setEditingId(null);
    setFormSection(section);
    setForm({ ...EMPTY_PRODUCT });
    setShowForm(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingId(p._id);
    setFormSection(p.section);
    setForm({
      name: p.name || "",
      image: p.image || "",
      discount: p.discount || "",
      price: p.price || "",
      oldPrice: p.oldPrice || "",
      brandName: p.brandName || "",
      brandLogo: p.brandLogo || "",
      link: p.link || "",
      sortOrder: p.sortOrder || 0,
    });
    setShowForm(true);
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Name is required.");
    setLoadingProduct(true);
    const payload = { ...form, section: formSection };
    try {
      const url = editingId
        ? `/api/coupon-home-products/${editingId}`
        : "/api/coupon-home-products";
      const res = await adminFetch(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(res);
      if (res.ok) {
        await fetchProducts();
        setShowForm(false);
        setEditingId(null);
      } else {
        alert("❌ Error: " + (data?.error || "Unknown"));
      }
    } catch (err) {
      alert("❌ Network error.");
    } finally {
      setLoadingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await adminFetch(`/api/coupon-home-products/${id}`, { method: "DELETE" });
    await fetchProducts();
  };

  // ── Slider group helpers (live in settings.sliderGroups) ──
  const addGroup = () => {
    const key = `group-${Date.now().toString(36)}`;
    setSettingsForm((prev) => ({
      ...prev,
      sliderGroups: [
        ...prev.sliderGroups,
        { key, heading: "Top Angebote des Tages", subtitle: "", brandName: "", brandLogo: "", sortOrder: prev.sliderGroups.length },
      ],
    }));
  };

  const updateGroup = (i: number, patch: Partial<SliderGroup>) =>
    setSettingsForm((prev) => {
      const sliderGroups = [...prev.sliderGroups];
      sliderGroups[i] = { ...sliderGroups[i], ...patch };
      return { ...prev, sliderGroups };
    });

  const removeGroup = (i: number) => {
    const group = settingsForm.sliderGroups[i];
    const inUse = products.filter((p) => p.section === group.key).length;
    if (inUse > 0 && !confirm(`This group has ${inUse} product(s). Remove the group anyway? (Products stay until you delete them individually.)`)) return;
    setSettingsForm((prev) => ({
      ...prev,
      sliderGroups: prev.sliderGroups.filter((_, idx) => idx !== i),
    }));
  };

  const moveGroup = (i: number, dir: -1 | 1) => {
    setSettingsForm((prev) => {
      const arr = [...prev.sliderGroups];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, sliderGroups: arr.map((g, idx) => ({ ...g, sortOrder: idx })) };
    });
  };

  // ── Generic array-of-object helpers for settings lists ──
  function listAdd<K extends keyof Settings>(key: K, item: any) {
    setSettingsForm((prev) => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));
  }
  function listUpdate<K extends keyof Settings>(key: K, i: number, patch: any) {
    setSettingsForm((prev) => {
      const arr = [...(prev[key] as any[])];
      arr[i] = { ...arr[i], ...patch };
      return { ...prev, [key]: arr };
    });
  }
  function listRemove<K extends keyof Settings>(key: K, i: number) {
    setSettingsForm((prev) => {
      const arr = [...(prev[key] as any[])];
      arr.splice(i, 1);
      return { ...prev, [key]: arr };
    });
  }

  const updateDesigner = (patch: Partial<DesignerSection>) =>
    setSettingsForm((prev) => ({ ...prev, designerSection: { ...prev.designerSection, ...patch } }));

  // ─────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Coupons Home – Admin</h1>
        <p className="text-gray-500 mt-1">
          Manage all content on the{" "}
          <a href="/kortingscodes" target="_blank" className="text-primary-600 underline">/kortingscodes</a>{" "}
          page — banner, sliders, deals, FAQs and SEO.
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

      {/* ═══════════════ BANNER SLIDES ═══════════════ */}
      {activeTab === "banner" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Images size={20} className="text-primary-600" /> Banner Slides
            </h2>
            <button
              type="button"
              onClick={() => listAdd("bannerSlides", { image: "", link: "" })}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
            >
              <Plus size={15} /> Add Slide
            </button>
          </div>

          {settingsForm.bannerSlides.length === 0 ? (
            <EmptyState icon={Images} text="No slides yet. Add your first one." />
          ) : (
            <div className="space-y-4">
              {settingsForm.bannerSlides.map((slide, i) => (
                <div key={i} className="flex items-center gap-4 border border-gray-100 rounded-xl p-4">
                  <ImageThumb url={slide.image} onPick={() => openPicker((url) => listUpdate("bannerSlides", i, { image: url }))} />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Link (optional)</label>
                    <input
                      value={slide.link || ""}
                      onChange={(e) => listUpdate("bannerSlides", i, { link: e.target.value })}
                      placeholder="https://..."
                      className={inputCls}
                    />
                  </div>
                  <button type="button" onClick={() => listRemove("bannerSlides", i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <SaveButton onClick={() => saveSettings("Banner")} saving={savingSettings} label="Save Banner" />
        </div>
      )}

      {/* ═══════════════ SLIDERS ═══════════════ */}
      {activeTab === "sliders" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package size={20} className="text-primary-600" /> Offer Slider Groups
              </h2>
              <p className="text-sm text-gray-500 mt-1">Each group is its own carousel section with its own brand header.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={addGroup} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
                <Plus size={15} /> Group
              </button>
              <SaveButton onClick={() => saveSettings("Slider groups")} saving={savingSettings} label="Save Groups" small />
            </div>
          </div>

          {settingsForm.sliderGroups.length === 0 && (
            <EmptyState icon={Package} text="No slider groups yet. Add one and save." />
          )}

          {settingsForm.sliderGroups.map((group, i) => {
            const groupProducts = products
              .filter((p) => p.section === group.key)
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            return (
              <div key={group.key} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {/* Group meta */}
                <div className="p-6 border-b border-gray-100 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Heading</label>
                        <input value={group.heading} onChange={(e) => updateGroup(i, { heading: e.target.value })} placeholder="Top Angebote des Tages" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle</label>
                        <input value={group.subtitle || ""} onChange={(e) => updateGroup(i, { subtitle: e.target.value })} placeholder="PRÄSENTIERT VON HOME 24" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Brand Name</label>
                        <input value={group.brandName || ""} onChange={(e) => updateGroup(i, { brandName: e.target.value })} placeholder="Home 24" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Brand Logo</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => openPicker((url) => updateGroup(i, { brandLogo: url }))} className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                            <ImagePlus size={14} /> Library
                          </button>
                          {group.brandLogo && <img src={group.brandLogo} alt="" className="w-9 h-9 object-contain rounded-lg border border-gray-200" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveGroup(i, -1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => moveGroup(i, 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500"><ArrowDown size={14} /></button>
                      <button type="button" onClick={() => removeGroup(i)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Note: after changing heading/brand, click <strong>“Save Groups”</strong>. Products are saved instantly.
                  </p>
                </div>

                {/* Group products */}
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{groupProducts.length} product(s)</span>
                  <button type="button" onClick={() => openAddProduct(group.key)} className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700">
                    <Plus size={14} /> Product
                  </button>
                </div>
                <ProductRows products={groupProducts} onEdit={openEditProduct} onDelete={deleteProduct} />
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ DESIGNER SECTION ═══════════════ */}
      {activeTab === "designer" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles size={20} className="text-primary-600" /> Designer Section
            </h2>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.designerSection.enabled}
                onChange={(e) => updateDesigner({ enabled: e.target.checked })}
                className="w-4 h-4 accent-primary-600"
              />
              Show on page
            </label>
          </div>

          <p className="text-sm text-gray-500">
            The promo banner block (image on the left, headline + button on the right) shown between the sliders and the Mega Deals.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <ImageThumb url={settingsForm.designerSection.image} onPick={() => openPicker((url) => updateDesigner({ image: url }))} />
              <div>
                <p className="text-sm font-semibold text-gray-700">Left Image</p>
                <p className="text-xs text-gray-400">Pick from the media library.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">Right Background Color</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settingsForm.designerSection.bgColor || "#d97706"}
                  onChange={(e) => updateDesigner({ bgColor: e.target.value })}
                  className="w-11 h-11 rounded-lg border border-gray-200 cursor-pointer bg-white p-0.5"
                />
                <input
                  value={settingsForm.designerSection.bgColor}
                  onChange={(e) => updateDesigner({ bgColor: e.target.value })}
                  placeholder="#d97706"
                  className={`${inputCls} w-32`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Small Heading</label>
              <input value={settingsForm.designerSection.smallHeading} onChange={(e) => updateDesigner({ smallHeading: e.target.value })} placeholder="5 Designer-empfohlen" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Title (large)</label>
              <input value={settingsForm.designerSection.title} onChange={(e) => updateDesigner({ title: e.target.value })} placeholder="MÖBEL" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle</label>
              <input value={settingsForm.designerSection.subtitle} onChange={(e) => updateDesigner({ subtitle: e.target.value })} placeholder="Angebote" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Price Text</label>
              <input value={settingsForm.designerSection.priceText} onChange={(e) => updateDesigner({ priceText: e.target.value })} placeholder="Alle unter 499€" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Right Heading</label>
              <input value={settingsForm.designerSection.rightHeading} onChange={(e) => updateDesigner({ rightHeading: e.target.value })} placeholder="5 Designer-empfohlene Möbelangebote — Alle unter 499€" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Right Description</label>
              <textarea value={settingsForm.designerSection.rightDescription} onChange={(e) => updateDesigner({ rightDescription: e.target.value })} rows={2} placeholder="Exklusive Sparmöglichkeiten bei Premium-Möbeln freischalten" className={`${inputCls} resize-y`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button Text</label>
              <input value={settingsForm.designerSection.buttonText} onChange={(e) => updateDesigner({ buttonText: e.target.value })} placeholder="DESIGNER-TIPPS ANSEHEN" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button Link <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={settingsForm.designerSection.buttonLink} onChange={(e) => updateDesigner({ buttonLink: e.target.value })} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          <SaveButton onClick={() => saveSettings("Designer Section")} saving={savingSettings} label="Save Designer Section" />
        </div>
      )}

      {/* ═══════════════ DEALS ═══════════════ */}
      {activeTab === "deals" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Tag size={20} className="text-primary-600" /> Mega Deals</h2>
            <div>
              <label className="block text-sm font-semibold mb-2">Section Heading</label>
              <input value={settingsForm.dealsHeading} onChange={(e) => setSettingsForm({ ...settingsForm, dealsHeading: e.target.value })} placeholder="Möbel Mega Angebote" className={inputCls} />
            </div>
            <SaveButton onClick={() => saveSettings("Deals heading")} saving={savingSettings} label="Save Heading" small />
          </div>

          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {products.filter((p) => p.section === DEALS_SECTION).length} deal(s)
              </span>
              <button type="button" onClick={() => openAddProduct(DEALS_SECTION)} className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700">
                <Plus size={14} /> Deal
              </button>
            </div>
            <ProductRows
              products={products.filter((p) => p.section === DEALS_SECTION).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))}
              onEdit={openEditProduct}
              onDelete={deleteProduct}
            />
          </div>
        </div>
      )}

      {/* ═══════════════ BEST COUPONS ═══════════════ */}
      {activeTab === "best" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-4"><Percent size={20} className="text-primary-600" /> Best Coupons</h2>
          <div>
            <label className="block text-sm font-semibold mb-2">Section Heading</label>
            <input value={settingsForm.bestCouponsHeading} onChange={(e) => setSettingsForm({ ...settingsForm, bestCouponsHeading: e.target.value })} className={inputCls} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Curated cards (title, image, text, link).</p>
            <button type="button" onClick={() => listAdd("bestCoupons", { title: "", description: "", image: "", link: "", buttonText: "Jetzt shoppen" })} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
              <Plus size={15} /> Card
            </button>
          </div>

          {settingsForm.bestCoupons.length === 0 ? (
            <EmptyState icon={Percent} text="No cards yet." />
          ) : (
            <div className="space-y-4">
              {settingsForm.bestCoupons.map((card, i) => (
                <div key={i} className="flex items-start gap-4 border border-gray-100 rounded-xl p-4">
                  <ImageThumb url={card.image} onPick={() => openPicker((url) => listUpdate("bestCoupons", i, { image: url }))} />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={card.title} onChange={(e) => listUpdate("bestCoupons", i, { title: e.target.value })} placeholder="Title (e.g. Home24)" className={inputCls} />
                    <input value={card.buttonText || ""} onChange={(e) => listUpdate("bestCoupons", i, { buttonText: e.target.value })} placeholder="Button text" className={inputCls} />
                    <input value={card.description} onChange={(e) => listUpdate("bestCoupons", i, { description: e.target.value })} placeholder="Description" className={`${inputCls} md:col-span-2`} />
                    <input value={card.link || ""} onChange={(e) => listUpdate("bestCoupons", i, { link: e.target.value })} placeholder="Link https://..." className={`${inputCls} md:col-span-2`} />
                  </div>
                  <button type="button" onClick={() => listRemove("bestCoupons", i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          )}

          <SaveButton onClick={() => saveSettings("Best Coupons")} saving={savingSettings} label="Save Best Coupons" />
        </div>
      )}

      {/* ═══════════════ CASHBACK ═══════════════ */}
      {activeTab === "cashback" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-4"><Store size={20} className="text-primary-600" /> Cashback</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Small heading (top)</label>
              <input value={settingsForm.cashbackSubheading} onChange={(e) => setSettingsForm({ ...settingsForm, cashbackSubheading: e.target.value })} placeholder="Unsere Vertrauenswürdigen Marken" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Heading</label>
              <input value={settingsForm.cashbackHeading} onChange={(e) => setSettingsForm({ ...settingsForm, cashbackHeading: e.target.value })} placeholder="Cashback bei unseren Lieblingsgeschäften" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Brand logos in the row.</p>
            <button type="button" onClick={() => listAdd("cashbackStores", { name: "", logo: "", link: "" })} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
              <Plus size={15} /> Brand
            </button>
          </div>

          {settingsForm.cashbackStores.length === 0 ? (
            <EmptyState icon={Store} text="No brands yet." />
          ) : (
            <div className="space-y-3">
              {settingsForm.cashbackStores.map((store, i) => (
                <div key={i} className="flex items-center gap-4 border border-gray-100 rounded-xl p-4">
                  <ImageThumb url={store.logo} onPick={() => openPicker((url) => listUpdate("cashbackStores", i, { logo: url }))} small />
                  <input value={store.name} onChange={(e) => listUpdate("cashbackStores", i, { name: e.target.value })} placeholder="Brand name" className={inputCls} />
                  <input value={store.link || ""} onChange={(e) => listUpdate("cashbackStores", i, { link: e.target.value })} placeholder="Link (optional)" className={inputCls} />
                  <button type="button" onClick={() => listRemove("cashbackStores", i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          )}

          <SaveButton onClick={() => saveSettings("Cashback")} saving={savingSettings} label="Save Cashback" />
        </div>
      )}

      {/* ═══════════════ CONTENT ═══════════════ */}
      {activeTab === "content" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4 flex items-center gap-2"><FileText size={20} className="text-primary-600" /> Long Content (bottom of page)</h2>
          <RichTextEditor
            value={settingsForm.longContent}
            onChange={(val) => setSettingsForm({ ...settingsForm, longContent: val })}
            placeholder="Long description text. HTML tags like <h2>, <p>, <strong>, <ul> are supported..."
          />
          <SaveButton onClick={() => saveSettings("Content")} saving={savingSettings} label="Save Content" />
        </div>
      )}

      {/* ═══════════════ FAQs ═══════════════ */}
      {activeTab === "faqs" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><HelpCircle size={20} className="text-primary-600" /> FAQs</h2>
            <button type="button" onClick={() => listAdd("faqs", { question: "", answer: "" })} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
              <Plus size={15} /> FAQ
            </button>
          </div>

          {settingsForm.faqs.length === 0 ? (
            <EmptyState icon={HelpCircle} text="No FAQs yet." />
          ) : (
            <div className="space-y-4">
              {settingsForm.faqs.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-5 space-y-3 relative">
                  <button type="button" onClick={() => listRemove("faqs", i)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Question</label>
                    <input value={faq.question} onChange={(e) => listUpdate("faqs", i, { question: e.target.value })} placeholder="FAQ question..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Answer</label>
                    <textarea value={faq.answer} onChange={(e) => listUpdate("faqs", i, { answer: e.target.value })} rows={3} placeholder="Answer..." className={`${inputCls} resize-y`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <SaveButton onClick={() => saveSettings("FAQs")} saving={savingSettings} label="Save FAQs" />
        </div>
      )}

      {/* ═══════════════ SEO ═══════════════ */}
      {activeTab === "seo" && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4 flex items-center gap-2"><Globe size={20} className="text-primary-600" /> SEO Settings</h2>
          <div>
            <label className="block text-sm font-semibold mb-2">Meta Title</label>
            <input value={settingsForm.seoTitle} onChange={(e) => setSettingsForm({ ...settingsForm, seoTitle: e.target.value })} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">{(settingsForm.seoTitle || "").length}/60 chars recommended</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Meta Description</label>
            <textarea value={settingsForm.seoDescription} onChange={(e) => setSettingsForm({ ...settingsForm, seoDescription: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
            <p className="text-xs text-gray-400 mt-1">{(settingsForm.seoDescription || "").length}/160 chars recommended</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Keywords <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></label>
            <input value={settingsForm.seoKeywords} onChange={(e) => setSettingsForm({ ...settingsForm, seoKeywords: e.target.value })} className={inputCls} />
          </div>
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Google Preview</p>
            <p className="text-primary-700 text-base font-medium truncate">{settingsForm.seoTitle || "Page title"}</p>
            <p className="text-green-700 text-xs">https://www.nl-furniture.nl/kortingscodes</p>
            <p className="text-gray-600 text-sm leading-snug line-clamp-2">{settingsForm.seoDescription || "Description will appear here..."}</p>
          </div>
          <SaveButton onClick={() => saveSettings("SEO")} saving={savingSettings} label="Save SEO" />
        </div>
      )}

      {/* ── Product form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold inline-flex items-center gap-2">
                {editingId ? <><Edit size={18} className="text-primary-600" /> Edit Product</> : <><Plus size={18} className="text-primary-600" /> New Product</>}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
            </div>

            <form onSubmit={submitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => openPicker((url) => setForm((f) => ({ ...f, image: url })))} className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                    <ImagePlus size={16} /> From Library
                  </button>
                  {form.image && <img src={form.image} alt="" className="w-14 h-14 object-contain rounded-lg border border-gray-200" />}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="25%" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="€ 49,99" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Old Price</label>
                  <input value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="€ 79,99" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Brand Name</label>
                  <input value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="IKEA" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand Logo</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openPicker((url) => setForm((f) => ({ ...f, brandLogo: url })))} className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                      <ImagePlus size={14} /> Library
                    </button>
                    {form.brandLogo && <img src={form.brandLogo} alt="" className="w-10 h-10 object-contain rounded-lg border border-gray-200" />}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link <span className="text-gray-400">(new tab)</span></label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." className={`${inputCls} pl-9`} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className={`${inputCls} w-24`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loadingProduct} className="flex-1 bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 disabled:opacity-60">
                  {loadingProduct ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPicker
        open={pickerCallback !== null}
        onClose={() => setPickerCallback(null)}
        onSelect={(item: MediaItem) => { pickerCallback?.(item.url); setPickerCallback(null); }}
        title="Select Image"
      />
    </div>
  );
}

// ─────────── Small presentational helpers ───────────
function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <Icon size={36} className="mx-auto mb-3 opacity-30" />
      <p>{text}</p>
    </div>
  );
}

function SaveButton({ onClick, saving, label, small }: { onClick: () => void; saving: boolean; label: string; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-60 ${small ? "px-5 py-2 text-sm" : "px-8 py-3"}`}
    >
      <Save size={16} />
      {saving ? "Saving..." : label}
    </button>
  );
}

function ImageThumb({ url, onPick, small }: { url?: string; onPick: () => void; small?: boolean }) {
  const size = small ? "w-12 h-12" : "w-20 h-16";
  return (
    <button type="button" onClick={onPick} className={`${size} shrink-0 rounded-lg border border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 hover:border-gray-400`}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={18} className="text-gray-400" />}
    </button>
  );
}

function ProductRows({ products, onEdit, onDelete }: { products: Product[]; onEdit: (p: Product) => void; onDelete: (id: string) => void }) {
  if (products.length === 0) {
    return <div className="px-6 py-8 text-center text-gray-400 text-sm">No products yet.</div>;
  }
  return (
    <div className="divide-y divide-gray-50">
      {products.map((p) => (
        <div key={p._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
          <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{p.name}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {p.discount && <span className="text-red-600 text-xs font-semibold">{p.discount}</span>}
              {p.price && <span className="text-gray-700 text-sm font-medium">{p.price}</span>}
              {p.oldPrice && <span className="text-gray-400 text-xs line-through">{p.oldPrice}</span>}
              {p.brandName && <span className="text-gray-500 text-xs">· {p.brandName}</span>}
            </div>
          </div>
          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700" title="Open link"><Link2 size={16} /></a>}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(p)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"><Edit size={16} /></button>
            <button onClick={() => onDelete(p._id)} className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
