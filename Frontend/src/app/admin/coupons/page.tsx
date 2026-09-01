"use client";
import { adminFetch } from "@/lib/adminAuth";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";

import useSWR from "swr";
import { useState } from "react";
import { GripVertical, Plus, Search, Edit2, Trash2, Store, Star, ThumbsUp, ThumbsDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminCoupons() {
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    shortDescription: "",
    discountText: "",
    brand: "",
    brandSlug: "",
    url: "",
    verified: "",
    savedAmount: "",
    avgSaving: "",
    badge: "",
    type: "deal",
    position: 0,
    isExpired: false,
    featured: false,
    expiresAt: "",
    likesBase: 0,
    dislikesBase: 0,
  });

  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [draggedCouponId, setDraggedCouponId] = useState<string | null>(null);

  // Real customer votes — read-only here, visitors vote on the public site.
  const { data: votesData } = useSWR(
    editing?._id ? `/api/coupons/${editing._id}/votes` : null,
    fetcher
  );

  const { data: brandsData } = useSWR("/api/brands", fetcher);
  const brands = brandsData?.brands || [];

  const filteredBrands = brands.filter((b: any) =>
    b.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );

  const { data: couponsData, mutate } = useSWR("/api/coupons", fetcher);
  const coupons = couponsData?.coupons || [];

  // Filtered Coupons
  const filteredCoupons = coupons.filter((c: any) =>
    (storeFilter ? c.brandSlug === storeFilter : true) &&
    (c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brandSlug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.discountText?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const activeCoupons = filteredCoupons.filter((c: any) => !c.isExpired);
  const expiredCoupons = filteredCoupons.filter((c: any) => c.isExpired);

  const resetForm = (selectedStoreSlug = "") => {
    const selectedBrand = brands.find((b: any) => b.slug === selectedStoreSlug);

    setForm({
      code: "",
      title: "",
      description: "",
      shortDescription: "",
      discountText: "",
      brand: selectedBrand?.name || "",
      brandSlug: selectedBrand?.slug || "",
      url: selectedBrand?.url || "",
      verified: "",
      savedAmount: "",
      avgSaving: "",
      badge: "",
      type: "deal",
      position: 0,
      isExpired: false,
      featured: false,
      expiresAt: "",
      likesBase: 0,
      dislikesBase: 0,
    });
  };

  const handleStoreChange = (slug: string) => {
    const selectedBrand = brands.find((b: any) => b.slug === slug);
    setStoreFilter(slug);
    setStoreDropdownOpen(false);
    setStoreSearch("");
    setForm((prev) => ({
      ...prev,
      brand: selectedBrand?.name || "",
      brandSlug: selectedBrand?.slug || "",
      url: selectedBrand?.url || prev.url,
    }));
  };

  const handleTypeChange = (newType: string) => {
    const autoBadge =
      newType === "deal" ? "CODE" :
      newType === "sale" ? "SALE" :
      newType === "free-shipping" ? "OFFER" : "";
    setForm((prev) => ({ ...prev, type: newType, badge: autoBadge }));
  };

  // ================= SUBMIT (Add + Update) =================
  const handleSubmit = async () => {
    const isFreeShipping = form.type === "free-shipping";

    if (!form.code || !form.title || !form.brandSlug || !form.url) {
      alert("Please fill all required fields");
      return;
    }

    if (!isFreeShipping && !form.discountText) {
      alert("Discount text is required for Code and Sale coupons");
      return;
    }

    const method = editing ? "PUT" : "POST";

    const res = await adminFetch("/api/coupons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert(editing ? "Coupon Updated Successfully ✅" : "Coupon Added Successfully ✅");

      resetForm(storeFilter);
      setEditing(null);
      mutate();
      setSearchTerm(""); 
    } else {
      alert("Error saving coupon ❌");
    }
  };

  // ================= EDIT =================
  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code || "",
      title: c.title || "",
      description: c.description || "",
      shortDescription: c.shortDescription || "",
      discountText: c.discountText || "",
      brand: c.brand || "",
      brandSlug: c.brandSlug || "",
      url: c.url || "",
      verified: c.verified || "",
      savedAmount: c.savedAmount || "",
      avgSaving: c.avgSaving || "",
      badge: c.badge || "",
      type: c.type || "deal",
      position: c.position !== undefined ? c.position : 0,
      isExpired: c.isExpired !== undefined ? c.isExpired : false,
      featured: c.featured !== undefined ? c.featured : false,
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : "",
      likesBase: c.likesBase || 0,
      dislikesBase: c.dislikesBase || 0,
    });
    setStoreFilter(c.brandSlug || "");
  };

  // ================= DELETE =================
  const handleDelete = async (code: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    const res = await adminFetch(`/api/coupons?code=${code}`, {
      method: "DELETE",
    });

    if (res.ok) {
      mutate();
    } else {
      alert("Delete failed ❌");
    }
  };

  // -----------------------------------------------------------------
  // Helper functions for expire toggle and manual ordering
  // -----------------------------------------------------------------
  const handleExpireToggle = async (id: string, newStatus: boolean) => {
    try {
      await adminFetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isExpired: newStatus, expiresAt: newStatus ? new Date().toISOString() : null }),
      });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const saveCouponOrder = async (orderedCoupons: any[]) => {
    try {
      await Promise.all(
        orderedCoupons.map((coupon: any, index: number) =>
          adminFetch(`/api/coupons/${coupon._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: index + 1 }),
          })
        )
      );
      mutate();
    } catch (e) {
      console.error(e);
      alert("Could not save coupon order");
    }
  };

  const handlePositionInput = (id: string, value: string) => {
    const position = Number(value);
    if (!Number.isInteger(position) || position < 1) {
      alert("Position must be 1 or higher");
      return;
    }

    const fromIndex = activeCoupons.findIndex((c: any) => c._id === id);
    if (fromIndex === -1) return;

    const toIndex = Math.min(position, activeCoupons.length) - 1;
    const reordered = [...activeCoupons];
    const [movedCoupon] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedCoupon);

    saveCouponOrder(reordered);
  };

  const handleDropCoupon = async (targetCouponId: string) => {
    if (!draggedCouponId || draggedCouponId === targetCouponId) {
      setDraggedCouponId(null);
      return;
    }

    const fromIndex = activeCoupons.findIndex((c: any) => c._id === draggedCouponId);
    const toIndex = activeCoupons.findIndex((c: any) => c._id === targetCouponId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedCouponId(null);
      return;
    }

    const reordered = [...activeCoupons];
    const [draggedCoupon] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedCoupon);

    setDraggedCouponId(null);

    saveCouponOrder(reordered);
  };

  return (
    <div className=" bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* FORM */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-8">
            <Plus className="text-primary-600" />
            <h1 className="text-2xl font-semibold">
              {editing ? "Edit Coupon" : "Add New Coupon"}
            </h1>
          </div>
          
          {/* Store Dropdown — Searchable */}
          <div className="mb-4 relative">
            <button
              type="button"
              onClick={() => { setStoreDropdownOpen((o) => !o); setStoreSearch(""); }}
              className="w-full flex items-center justify-between border rounded-xl px-4 py-3 bg-white text-left hover:border-primary-400 transition focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <span className={`inline-flex items-center gap-2 ${storeFilter ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {storeFilter
                  ? brands.find((b: any) => b.slug === storeFilter)?.name || storeFilter
                  : <><Store size={16} className="text-primary-600" /> Select store / All Stores</>}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${storeDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {storeDropdownOpen && (
              <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search stores..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleStoreChange("")}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition ${storeFilter === "" ? "bg-primary-50 font-semibold text-primary-700" : "text-gray-500"}`}
                  >
                    All Stores
                  </button>
                  {brands
                    .filter((b: any) =>
                      !storeSearch.trim() ||
                      b.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                      b.slug.toLowerCase().includes(storeSearch.toLowerCase())
                    )
                    .map((b: any) => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => handleStoreChange(b.slug)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition flex items-center gap-2 ${
                          storeFilter === b.slug ? "bg-primary-50 font-semibold text-primary-700" : "text-gray-700"
                        }`}
                      >
                        {b.logo && <img src={b.logo} alt="" className="w-5 h-5 object-contain rounded flex-shrink-0" />}
                        {b.name}
                      </button>
                    ))
                  }
                  {brands.filter((b: any) =>
                    !storeSearch.trim() ||
                    b.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                    b.slug.toLowerCase().includes(storeSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400 text-center">No store found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <input
              placeholder="Coupon Code (SAVE10)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border p-3 w-full rounded-xl"
            />

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border p-3 w-full rounded-xl"
            />

            <RichDescriptionEditor
              value={form.shortDescription}
              onChange={(html) => setForm({ ...form, shortDescription: html })}
              placeholder="Short Description (shown as a quick summary of this coupon)"
              minHeight={120}
              headings={false}
            />

            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="border p-3 w-full rounded-xl bg-white"
            >
              <option value="deal">CODE – Discount with a coupon code</option>
              <option value="sale">SALE – Discount without a code (popup)</option>
              <option value="free-shipping">OFFER – Free shipping</option>
            </select>

            <input
              type="text"
              placeholder={form.type === "free-shipping" ? "Discount optional (not shown)" : "Discount (e.g. 20%, 20% OFF)"}
              value={form.discountText}
              onChange={(e) => setForm({ ...form, discountText: e.target.value })}
              className="border p-3 w-full rounded-xl font-medium"
            />

            <input
              type="text"
              placeholder="Badge (optional, e.g. Best Deal)"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="border p-3 w-full rounded-xl"
            />

            {/* Position Input */}
            <input
              type="number"
              placeholder="Position (default 0)"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) })}
              className="border p-3 w-full rounded-xl mt-2"
            />

            {/* Featured Toggle */}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="font-medium">Featured coupon</span>
              <span className="text-xs text-gray-400">(highlighted on the site)</span>
            </label>

            {/* Expire On — always visible, independent of the manual "Mark as Expired" toggle below */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Expire On <span className="text-gray-400">(optional — schedule ahead of time)</span>
              </label>
              <input
                type="date"
                value={form.expiresAt?.split('T')[0] || ''}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="border p-3 w-full rounded-xl"
              />
            </div>

            {/* Expire Toggle — manual override, separate from the date above */}
            <label className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={form.isExpired}
                onChange={(e) => setForm({ ...form, isExpired: e.target.checked })}
              />
              <span>Mark as Expired now</span>
            </label>

            {/* Likes / Dislikes — admin sets a base count; the public site adds real,
                anonymous (Turnstile-verified) visitor votes on top of it. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-gray-600">
                  <ThumbsUp size={14} className="text-emerald-600" /> Likes (base)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.likesBase}
                  onChange={(e) => setForm({ ...form, likesBase: parseInt(e.target.value) || 0 })}
                  className="border p-3 w-full rounded-xl"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-gray-600">
                  <ThumbsDown size={14} className="text-red-500" /> Dislikes (base)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.dislikesBase}
                  onChange={(e) => setForm({ ...form, dislikesBase: parseInt(e.target.value) || 0 })}
                  className="border p-3 w-full rounded-xl"
                />
              </div>
            </div>
            {editing && (
              <p className="text-xs text-gray-400">
                Currently shown on the site: {votesData?.likes ?? form.likesBase} 👍 · {votesData?.dislikes ?? form.dislikesBase} 👎
                {" "}(base + real visitor votes)
              </p>
            )}

            {/* Brand Dropdown (Select Store) */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1"><Store size={14} className="text-primary-600" /> Store for this coupon</label>
              <div 
                className="border p-3 w-full rounded-xl bg-white cursor-pointer flex justify-between items-center hover:border-primary-400 transition"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={form.brand ? "text-gray-900 font-medium" : "text-gray-400"}>
                  {form.brand ? `${form.brand} (${form.brandSlug})` : "Select store"}
                </span>
                <span className="text-gray-400">▼</span>
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-sm max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <input 
                      type="text" 
                      placeholder="Search store..."
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div 
                    className="p-3 text-sm cursor-pointer hover:bg-gray-100 text-gray-500" 
                    onClick={() => {
                      setForm({ ...form, brandSlug: "", brand: "", url: "" });
                      setIsDropdownOpen(false);
                      setBrandSearchTerm("");
                    }}
                  >
                    Clear selection
                  </div>
                  {filteredBrands.map((b: any) => (
                    <div 
                      key={b._id} 
                      className={`p-3 text-sm cursor-pointer hover:bg-primary-50 flex items-center gap-2 ${
                        form.brandSlug === b.slug ? 'bg-primary-100 font-semibold text-primary-700' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setForm({ ...form, brandSlug: b.slug, brand: b.name, url: b.url || form.url });
                        setIsDropdownOpen(false);
                        setBrandSearchTerm("");
                      }}
                    >
                      {b.logo && <img src={b.logo} alt="" className="w-5 h-5 object-contain rounded flex-shrink-0" />}
                      {b.name}
                    </div>
                  ))}
                  {filteredBrands.length === 0 && (
                    <div className="p-3 text-gray-500 text-center text-sm">No store found</div>
                  )}
                </div>
              )}
            </div>

            <input
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="border p-3 w-full rounded-xl"
            />

            <button
              onClick={handleSubmit}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition"
            >
              {editing ? "Update Coupon" : "Add Coupon"}
            </button>

            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  resetForm(storeFilter);
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search coupons by code, title, brand or discount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
          />
        </div>

        {/* COUPONS LIST */}
        <div className="bg-white rounded-lg border divide-y">
          {activeCoupons.length > 0 ? (
            activeCoupons.map((c: any, index: number) => (
              <div
                key={c._id}
                draggable
                onDragStart={() => setDraggedCouponId(c._id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropCoupon(c._id)}
                onDragEnd={() => setDraggedCouponId(null)}
                className={`p-6 flex justify-between items-start gap-4 hover:bg-gray-50 transition ${
                  draggedCouponId === c._id ? "bg-primary-50 opacity-70" : ""
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center gap-2 pt-1 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                    <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                  </div>

                  <div className="flex-1">
                  <p className="font-semibold text-lg flex items-center gap-2">
                    {c.title}
                    {c.featured && (
                      <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Star size={10} className="fill-white" /> Featured
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {c.code} • {c.brandSlug}
                  </p>

                  {c.discountText && (
                    <p className="text-xl font-semibold text-primary-600 mt-2">
                      {c.discountText}
                    </p>
                  )}

                  {c.badge && (
                    <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                      c.badge.toUpperCase() === "CODE"
                        ? "bg-[#F0734C]/10 text-[#F0734C]"
                        : ["SALE", "VERKAUF"].includes(c.badge.toUpperCase())
                        ? "bg-amber-100 text-amber-700"
                        : ["OFFER", "ANGEBOT"].includes(c.badge.toUpperCase())
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {c.badge}
                    </span>
                  )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    Position
                    <input
                      key={`${c._id}-${c.position || index + 1}`}
                      type="number"
                      min={1}
                      defaultValue={c.position || index + 1}
                      onBlur={(e) => handlePositionInput(c._id, e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm text-gray-700"
                    />
                  </label>

                  <a 
                    href={c.url} 
                    target="_blank" 
                    className="text-primary-600 hover:underline text-sm font-medium"
                  >
                    View →
                  </a>

                  <button
                    onClick={() => handleEdit(c)}
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(c.code)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 transition"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>

                  <button
                    onClick={() => handleExpireToggle(c._id, !c.isExpired)}
                    className={`text-sm ${c.isExpired ? 'text-green-600' : 'text-gray-600'} hover:underline`}
                  >
                    {c.isExpired ? 'Unexpire' : 'Mark Expired'}
                  </button>

                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? "No matching coupons found" : "No coupons found. Add your first coupon above."}
            </div>
          )}
        </div>

        {/* Expired Coupons Section */}
        {expiredCoupons.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-gray-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              Expired Coupons
            </h2>
            <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 divide-y divide-gray-200">
              {expiredCoupons.map((c: any) => (
                <div key={c._id} className="p-6 flex justify-between items-start gap-4 grayscale opacity-50 bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg text-gray-500 line-through">{c.title}</p>
                    <p className="text-sm text-gray-400">
                      {c.code} • {c.brandSlug}
                    </p>
                    {c.discountText && (
                      <span className="inline-block mt-2 bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-md font-semibold">
                        {c.discountText}
                      </span>
                    )}
                    {c.badge && (
                      <span className="inline-block mt-2 ml-2 bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-md">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Expired
                    </span>
                    <button
                      onClick={() => handleExpireToggle(c._id, !c.isExpired)}
                      className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors mt-2"
                    >
                      Unexpire / Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
