'use client';
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, FolderPlus, Tag, DollarSign, Link as LinkIcon, Award,
  Edit, Search, PackageSearch, X, Loader2, ImagePlus, GripVertical,
} from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

// A furniture product as returned by /api/products.
type FurnitureProduct = {
  _id: string;
  product_name?: string;
  brand_name?: string;
  category_name?: string;
  search_price?: number;
  display_price?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
};

const PICKER_PAGE_SIZE = 12;

// Parse a German-formatted price string ("€ 1.000,99" → 1000.99): dots are
// thousands separators, the comma is the decimal separator.
function parseGermanPrice(raw: string): number | null {
  const s = String(raw ?? "").replace(/[^0-9.,]/g, "");
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Auto-derive the discount badge ("-33%") from current + old price.
function computeSaleValue(price: string, oldPrice: string): string {
  const p = parseGermanPrice(price);
  const o = parseGermanPrice(oldPrice);
  if (!p || !o || o <= p) return "";
  return `-${Math.round(((o - p) / o) * 100)}%`;
}

// Build the home_products snapshot payload from a furniture product.
function snapshotFromFurniture(p: FurnitureProduct, resolveLogo: (name?: string) => string) {
  return {
    title: p.product_name || "Unbenanntes Produkt",
    price: p.display_price || (p.search_price ? `€${p.search_price}` : ""),
    link: p.aw_deep_link || p.merchant_deep_link || "#",
    brandName: p.brand_name || "",
    brandLogo: resolveLogo(p.brand_name),
    image: p.merchant_image_url || p.aw_image_url || "",
    sourceProductId: p._id,
  };
}

export default function IndoorOutdoorAdmin() {
  const [activeSection, setActiveSection] = useState<"indoor" | "outdoor">("indoor");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  // Snapshotted products shown in the selected category.
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Brand-name → logo map, so snapshots carry a logo for the homepage cards.
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});

  // Category form (name only — the slug is derived on the backend).
  const [newCatName, setNewCatName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Drag-to-reorder for the category list. List order is the order the category
  // pills appear on the home page, so dragging a row is what sets its position.
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Manual product form (also creates a real furniture product).
  // When `editingProductId` is set, the same form edits an existing snapshot instead.
  const [showManual, setShowManual] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOldPrice, setProdOldPrice] = useState("");
  const [prodLink, setProdLink] = useState("");
  const [prodBrandName, setProdBrandName] = useState("");
  const [prodBrandLogo, setProdBrandLogo] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [pickerOpenFor, setPickerOpenFor] = useState<"manual" | "brandLogo" | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  // Furniture-product picker modal.
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogItems, setCatalogItems] = useState<FurnitureProduct[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSearchInput, setCatalogSearchInput] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPages, setCatalogPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});

  const resolveLogo = useCallback(
    (name?: string) => (name ? brandLogos[name.toLowerCase()] || "" : ""),
    [brandLogos]
  );

  // Discount is derived automatically from the two price fields.
  const prodSaleValue = computeSaleValue(prodPrice, prodOldPrice);

  const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);

  // ── Data loading ────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/home-categories?section=${activeSection}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setSelectedCategorySlug((prev) => {
          const stillExists = data.categories.some((c: any) => c.slug === prev);
          if (stillExists) return prev;
          return data.categories[0]?.slug || "";
        });
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  }, [activeSection]);

  const fetchProducts = useCallback(async () => {
    if (!selectedCategorySlug) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const res = await adminFetch(
        `/api/home-products?categorySlug=${encodeURIComponent(selectedCategorySlug)}&section=${activeSection}`
      );
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCategorySlug, activeSection]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Brand logos for snapshots (best-effort; missing logos just render without one).
  useEffect(() => {
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

  // ── Categories ──────────────────────────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return alert("Please enter a category name.");
    setAddingCategory(true);
    try {
      const res = editingCategoryId
        ? await adminFetch(`/api/home-categories/${editingCategoryId}`, {
            method: "PUT",
            body: JSON.stringify({ name: newCatName.trim() }),
          })
        : await adminFetch("/api/home-categories", {
            method: "POST",
            body: JSON.stringify({ name: newCatName.trim(), section: activeSection }),
          });
      const data = await res.json();
      if (data.success) {
        setNewCatName("");
        setEditingCategoryId(null);
        await fetchCategories();
        if (data.category?.slug) setSelectedCategorySlug(data.category.slug);
      } else {
        alert(data.error || "Failed to save category");
      }
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, slug: string) => {
    if (!confirm("Delete this category? Its products in this section will be unlinked.")) return;
    try {
      const res = await adminFetch(`/api/home-categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (selectedCategorySlug === slug) setSelectedCategorySlug("");
        await fetchCategories();
      } else {
        alert(data.error || "Failed to delete category");
      }
    } catch (e) {
      console.error("Error deleting category:", e);
    }
  };

  // Persist the new order as 1-based positions. Written per category because
  // /api/home-categories has no bulk endpoint; the list is small enough that a
  // handful of parallel PUTs is fine.
  const saveCategoryOrder = async (ordered: any[]) => {
    setSavingOrder(true);
    try {
      const results = await Promise.all(
        ordered.map((cat: any, index: number) =>
          adminFetch(`/api/home-categories/${cat._id}`, {
            method: "PUT",
            body: JSON.stringify({ position: index + 1 }),
          })
        )
      );
      if (results.some((r) => !r.ok)) throw new Error("One or more categories failed to save");
    } catch (e) {
      console.error("Error saving category order:", e);
      alert("Could not save the category order.");
      // A partial write would leave the UI lying about the real order.
      await fetchCategories();
    } finally {
      setSavingOrder(false);
    }
  };

  // dragover fires continuously, so skip redundant state writes.
  const handleDragOverCategory = (id: string) => {
    setDragOverCatId((prev) => (prev === id ? prev : id));
  };

  const handleDropCategory = (targetId: string) => {
    const draggedId = draggedCatId;
    setDraggedCatId(null);
    setDragOverCatId(null);
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = categories.findIndex((c: any) => c._id === draggedId);
    const toIndex = categories.findIndex((c: any) => c._id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setCategories(reordered);
    saveCategoryOrder(reordered);
  };

  // ── Products: shared snapshot writer ─────────────────────────────────────────
  const snapshotToCategory = async (payload: Record<string, any>) => {
    const res = await adminFetch("/api/home-products", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        categorySlug: selectedCategorySlug,
        section: activeSection,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to add product");
    return data;
  };

  // ── Products: pick from the furniture catalog ────────────────────────────────
  const fetchCatalog = useCallback(async () => {
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
  }, [catalogPage, catalogSearch]);

  useEffect(() => {
    if (showCatalog) fetchCatalog();
  }, [showCatalog, fetchCatalog]);

  const addFromCatalog = async (p: FurnitureProduct) => {
    setAddingIds((prev) => ({ ...prev, [p._id]: true }));
    try {
      await snapshotToCategory(snapshotFromFurniture(p, resolveLogo));
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

  // ── Products: manual add (also creates a furniture product) ──────────────────
  const resetManualForm = () => {
    setEditingProductId(null);
    setProdTitle(""); setProdPrice(""); setProdOldPrice("");
    setProdLink(""); setProdBrandName(""); setProdBrandLogo(""); setProdImage("");
  };

  const openEditProduct = (prod: any) => {
    setEditingProductId(prod._id);
    setProdTitle(prod.title || "");
    setProdPrice(prod.price || "");
    setProdOldPrice(prod.oldPrice || "");
    setProdLink(prod.link && prod.link !== "#" ? prod.link : "");
    setProdBrandName(prod.brandName || "");
    setProdBrandLogo(prod.brandLogo || "");
    setProdImage(prod.image || "");
    setShowManual(true);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategorySlug) return alert("Please select or create a category first!");
    if (!prodTitle.trim() || !prodLink.trim()) return alert("Product title and link are required.");
    if (!prodImage) return alert("Please choose a product image.");

    setAddingProduct(true);
    try {
      if (editingProductId) {
        // Update the snapshot shown in this category (the furniture product is untouched).
        const res = await adminFetch(`/api/home-products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: prodTitle.trim(),
            price: prodPrice.trim(),
            oldPrice: prodOldPrice.trim(),
            saleValue: prodSaleValue.trim(),
            link: prodLink.trim(),
            brandName: prodBrandName.trim(),
            brandLogo: prodBrandLogo || resolveLogo(prodBrandName.trim()),
            image: prodImage,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update product");
      } else {
        // 1) Persist it into the shared furniture products table.
        const searchPrice = parseGermanPrice(prodPrice) || 0;
        const prodRes = await adminFetch("/api/products", {
          method: "POST",
          body: JSON.stringify({
            product_name: prodTitle.trim(),
            brand_name: prodBrandName.trim(),
            category_name: selectedCategory?.name || "",
            search_price: searchPrice,
            display_price: prodPrice.trim(),
            aw_deep_link: prodLink.trim(),
            merchant_deep_link: prodLink.trim(),
            merchant_image_url: prodImage,
          }),
        });
        const prodData = await prodRes.json();
        if (!prodData.success) throw new Error(prodData.error || "Failed to create product");

        // 2) Snapshot it into this Indoor/Outdoor category (with the discount fields).
        const snapshot = snapshotFromFurniture(prodData.product as FurnitureProduct, resolveLogo);
        await snapshotToCategory({
          ...snapshot,
          brandLogo: prodBrandLogo || snapshot.brandLogo,
          oldPrice: prodOldPrice.trim(),
          saleValue: prodSaleValue.trim(),
        });
      }

      resetManualForm();
      setShowManual(false);
      await fetchProducts();
    } catch (err: any) {
      console.error("Error saving manual product:", err);
      alert(err.message || "Failed to save product");
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remove this product from the category? (The furniture product itself is kept.)")) return;
    try {
      const res = await adminFetch(`/api/home-products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) await fetchProducts();
      else alert(data.error || "Failed to remove product");
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Indoor & Outdoor Library</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Create categories (name only) for the Indoor and Outdoor homepage sections, then fill
            them with products picked from your furniture catalog.
          </p>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex bg-zinc-200/60 p-1.5 rounded-lg w-full max-w-[400px]">
        {(["indoor", "outdoor"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-all ${
              activeSection === s
                ? "bg-white text-zinc-950 shadow-sm scale-[1.02]"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white/40"
            }`}
          >
            {s === "indoor" ? "Indoor (Innenbereich)" : "Outdoor (Außenbereich)"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT: CATEGORY MANAGER */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary-600" />
              {editingCategoryId ? "Edit Category" : "Add New Category"}
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Category Name (e.g. Betten)
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Sofa & Lounges"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="flex-grow bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  {addingCategory ? "Saving..." : editingCategoryId ? "Update Category" : "Add Category"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => { setEditingCategoryId(null); setNewCatName(""); }}
                    className="px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
                Categories List
                {savingOrder && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
              </h3>
              <p className="text-xs text-zinc-500">
                The numbered order is the order these categories appear on the home page.
                Drag a row onto another to reorder it — the new order saves right away.
              </p>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-400">No categories found in this section.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat, idx) => {
                  const isSelected = selectedCategorySlug === cat.slug;
                  const isDragged = draggedCatId === cat._id;
                  const isDropTarget = !!draggedCatId && !isDragged && dragOverCatId === cat._id;
                  return (
                  <div
                    key={cat._id}
                    draggable
                    onDragStart={() => setDraggedCatId(cat._id)}
                    onDragEnd={() => { setDraggedCatId(null); setDragOverCatId(null); }}
                    onDragOver={(e) => { e.preventDefault(); handleDragOverCategory(cat._id); }}
                    onDrop={(e) => { e.preventDefault(); handleDropCategory(cat._id); }}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={[
                      "flex items-center justify-between p-3.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all",
                      isSelected ? "bg-primary-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-800",
                      isDropTarget
                        ? "border-primary-500 ring-2 ring-primary-500/30"
                        : isSelected
                        ? "border-primary-600"
                        : "border-zinc-100",
                      isDragged ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        title="Drag to change the home page order"
                        className={`flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0 ${
                          isSelected ? "text-primary-100" : "text-zinc-400"
                        }`}
                      >
                        <GripVertical size={14} />
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold truncate">{cat.name}</span>
                    </span>
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategoryId(cat._id);
                          setNewCatName(cat.name || "");
                        }}
                        className={`p-2 rounded-xl transition ${
                          isSelected
                            ? "hover:bg-primary-700 text-primary-100 hover:text-white"
                            : "hover:bg-zinc-100 text-zinc-400 hover:text-primary-500"
                        }`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id, cat.slug); }}
                        className={`p-2 rounded-xl transition ${
                          isSelected
                            ? "hover:bg-primary-700 text-primary-100 hover:text-red-200"
                            : "hover:bg-zinc-100 text-zinc-400 hover:text-red-500"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: PRODUCT MANAGER */}
        <div className="lg:col-span-2 space-y-8">
          {selectedCategorySlug ? (
            <>
              {/* Action bar */}
              <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-zinc-950 text-lg">
                    Products in{" "}
                    <span className="underline text-primary-600">{selectedCategory?.name}</span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCatalogPage(1); setCatalogSearch(""); setCatalogSearchInput(""); setShowCatalog(true); }}
                      className="inline-flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <PackageSearch className="w-4 h-4" /> Choose from Products
                    </button>
                    <button
                      onClick={() => {
                        if (showManual) { resetManualForm(); setShowManual(false); }
                        else { resetManualForm(); setShowManual(true); }
                      }}
                      className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Manually
                    </button>
                  </div>
                </div>

                {/* Manual form (also creates a furniture product) */}
                {showManual && (
                  <form onSubmit={handleManualAdd} className="border-t border-zinc-100 pt-5 space-y-5">
                    <p className="text-[11px] text-zinc-500">
                      {editingProductId ? (
                        <>Editing this category&rsquo;s product card (the underlying furniture product is not changed).</>
                      ) : (
                        <>This creates a new product in <strong>Furniture &rsaquo; Products</strong> and
                        adds it to this category.</>
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Product Title
                        </label>
                        <input
                          type="text" value={prodTitle} onChange={(e) => setProdTitle(e.target.value)}
                          placeholder="e.g. Luxus Kingsize-Bett"
                          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Price (e.g. €89)
                        </label>
                        <input
                          type="text" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)}
                          placeholder="e.g. €89"
                          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Old Price <span className="text-zinc-400 normal-case">(strikethrough)</span>
                        </label>
                        <input
                          type="text" value={prodOldPrice} onChange={(e) => setProdOldPrice(e.target.value)}
                          placeholder="e.g. €129"
                          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Discount <span className="text-zinc-400 normal-case">(auto-calculated)</span>
                        </label>
                        <div className="w-full border border-zinc-200 bg-zinc-50 rounded-xl p-3 text-sm font-medium">
                          {prodSaleValue ? (
                            <span className="text-red-600 font-bold">{prodSaleValue}</span>
                          ) : (
                            <span className="text-zinc-400">Fill both prices (e.g. 599,00 &amp; 899,00)</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Brand Name
                        </label>
                        <input
                          type="text" value={prodBrandName} onChange={(e) => setProdBrandName(e.target.value)}
                          placeholder="e.g. IKEA"
                          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <ImagePlus className="w-3.5 h-3.5" /> Brand Logo
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                            {prodBrandLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={prodBrandLogo} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              <Award className="w-4 h-4 text-zinc-300" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickerOpenFor("brandLogo")}
                            className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition"
                          >
                            {prodBrandLogo ? "Change" : "Choose"}
                          </button>
                          {prodBrandLogo && (
                            <button
                              type="button"
                              onClick={() => setProdBrandLogo("")}
                              className="px-3 py-2.5 bg-zinc-100 hover:bg-red-100 text-zinc-500 hover:text-red-600 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <LinkIcon className="w-3.5 h-3.5" /> Product Link
                        </label>
                        <input
                          type="text" value={prodLink} onChange={(e) => setProdLink(e.target.value)}
                          placeholder="https://... or /productdetail?id=..."
                          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <ImagePlus className="w-3.5 h-3.5" /> Product Image
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                          {prodImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={prodImage} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <ImagePlus className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPickerOpenFor("manual")}
                          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold uppercase tracking-wider transition"
                        >
                          {prodImage ? "Change Image" : "Choose Image"}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit" disabled={addingProduct}
                        className="flex-grow inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        {addingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                        {addingProduct ? "Saving..." : editingProductId ? "Save Changes" : "Create & Add to Category"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { resetManualForm(); setShowManual(false); }}
                        className="px-6 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Products list */}
              <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-6">
                <h3 className="font-semibold text-zinc-950 text-lg">Current Products ({products.length})</h3>
                {loadingProducts ? (
                  <div className="space-y-4">
                    <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
                    <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No products yet. Use “Choose from Products” to add some.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((prod) => (
                      <div key={prod._id} className="relative border border-zinc-100 rounded-lg p-4 flex gap-4 bg-zinc-50/50 hover:bg-zinc-50 transition">
                        <div className="relative w-20 h-20 bg-white border border-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={prod.image} className="w-full h-full object-contain p-1" alt="" />
                        </div>
                        <div className="flex flex-col justify-between flex-grow min-w-0">
                          <div>
                            <h4 className="font-semibold text-sm text-zinc-900 truncate pr-14">{prod.title}</h4>
                            {prod.brandName && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {prod.brandLogo && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={prod.brandLogo} className="w-5 h-5 rounded-full object-contain border bg-white" alt="" />
                                )}
                                <span className="text-[10px] text-zinc-500 font-semibold uppercase truncate">{prod.brandName}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="flex items-baseline gap-1.5">
                              <span className={`text-xs font-semibold ${prod.saleValue ? "text-red-600" : "text-zinc-950"}`}>{prod.price}</span>
                              {prod.oldPrice && (
                                <span className="text-[10px] text-zinc-400 line-through">{prod.oldPrice}</span>
                              )}
                              {prod.saleValue && (
                                <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded">{prod.saleValue}</span>
                              )}
                            </span>
                            {prod.link && prod.link !== "#" && (
                              <a href={prod.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-600 hover:underline truncate max-w-[150px]">
                                View Link &rarr;
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-0.5">
                          <button
                            onClick={() => openEditProduct(prod)}
                            className="p-1.5 hover:bg-zinc-200/50 hover:text-primary-600 text-zinc-400 rounded-lg transition"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod._id)}
                            className="p-1.5 hover:bg-zinc-200/50 hover:text-red-600 text-zinc-400 rounded-lg transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-12 text-center text-zinc-400">
              <FolderPlus size={36} className="mx-auto text-zinc-300 mb-3" />
              <p className="font-semibold text-sm">No Category Selected</p>
              <p className="text-xs mt-1">Create or choose a category from the left panel to start managing its products.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── FURNITURE PRODUCT PICKER MODAL ── */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCatalog(false)}>
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-950">Choose from Furniture Products</h3>
                <p className="text-xs text-zinc-500">Adds to “{selectedCategory?.name}”</p>
              </div>
              <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-zinc-100">
              <form
                onSubmit={(e) => { e.preventDefault(); setCatalogPage(1); setCatalogSearch(catalogSearchInput.trim()); }}
                className="flex gap-2"
              >
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    value={catalogSearchInput}
                    onChange={(e) => setCatalogSearchInput(e.target.value)}
                    placeholder="Search products by name or brand..."
                    className="w-full pl-9 pr-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900"
                  />
                </div>
                <button type="submit" className="px-4 bg-zinc-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider">
                  Search
                </button>
              </form>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : catalogItems.length === 0 ? (
                <p className="text-center text-sm text-zinc-400 py-20">No products found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {catalogItems.map((p) => {
                    const img = p.merchant_image_url || p.aw_image_url || "";
                    const price = p.display_price || (p.search_price ? `€${p.search_price}` : "");
                    const busy = !!addingIds[p._id];
                    return (
                      <div key={p._id} className="border border-zinc-100 rounded-xl overflow-hidden flex flex-col">
                        <div className="relative h-28 bg-zinc-50 flex items-center justify-center p-2">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <ImagePlus className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow">
                          <p className="text-xs font-semibold text-zinc-900 line-clamp-2 min-h-[2rem]">{p.product_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-zinc-500 uppercase truncate">{p.brand_name}</span>
                            <span className="text-xs font-bold text-zinc-900">{price}</span>
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
              <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  disabled={catalogPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-zinc-500">Page {catalogPage} of {catalogPages}</span>
                <button
                  onClick={() => setCatalogPage((p) => Math.min(catalogPages, p + 1))}
                  disabled={catalogPage >= catalogPages}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media picker for the manual form's product image / brand logo */}
      <MediaPicker
        open={pickerOpenFor !== null}
        onClose={() => setPickerOpenFor(null)}
        onSelect={(item: MediaItem) => {
          if (pickerOpenFor === "brandLogo") setProdBrandLogo(item.url);
          else setProdImage(item.url);
          setPickerOpenFor(null);
        }}
        title={pickerOpenFor === "brandLogo" ? "Choose Brand Logo" : "Choose Product Image"}
      />
    </div>
  );
}
