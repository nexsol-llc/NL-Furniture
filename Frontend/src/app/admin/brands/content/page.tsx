"use client";

import useSWR from "swr";
import { useState } from "react";
import { Search, Save, Upload, CheckCircle } from "lucide-react";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BrandContentAdmin() {
  const { data, mutate } = useSWR("/api/brands", fetcher);
  const brands = data?.brands || [];

  const [selectedSlug, setSelectedSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [description, setDescription] = useState("");
  const [longContent, setLongContent] = useState("");
  const [contentImage, setContentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const filteredBrands = brands.filter((b: any) => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBrandSelect = (slug: string) => {
    setSelectedSlug(slug);
    const brand = brands.find((b: any) => b.slug === slug);
    if (brand) {
      setDescription(brand.description || "");
      setLongContent(brand.longContent || "");
      setImagePreview(brand.contentImage || "");
      setContentImage(null);
      setMessage("");
    }
  };

  const handleSave = async () => {
    if (!selectedSlug) return;
    setLoading(true);
    setMessage("");

    const brand = brands.find((b: any) => b.slug === selectedSlug);
    const formData = new FormData();
    formData.append("name", brand.name);
    formData.append("slug", brand.slug);
    formData.append("description", description);
    formData.append("longContent", longContent);

    if (contentImage) {
      formData.append("contentImage", contentImage);
    } else {
      formData.append("contentImage", imagePreview); // Keep existing
    }

    try {
      const res = await fetch(`/api/brands/${selectedSlug}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setMessage("Content updated successfully!");
        mutate();
      } else {
        setMessage("Failed to update content.");
      }
    } catch (error) {
      setMessage("Error updating content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Brand Page Content</h1>
          <p className="text-gray-500 mt-1">Manage descriptions and feature images for each brand page.</p>
        </div>
        {selectedSlug && (
          <button 
            onClick={() => setSelectedSlug("")}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline flex items-center gap-2"
          >
            ← Back to Brand List
          </button>
        )}
      </div>
      
      {!selectedSlug ? (
        <div className="space-y-8">
          {/* SELECTION ROW */}
          <div className="flex flex-col md:flex-row gap-6 items-end bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            
            {/* QUICK DROPDOWN */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Quick Select Dropdown
              </label>
              <select 
                value={selectedSlug}
                onChange={(e) => handleBrandSelect(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition"
              >
                <option value="">-- Choose a Brand --</option>
                {brands.sort((a:any, b:any) => a.name.localeCompare(b.name)).map((b: any) => (
                  <option key={b._id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="hidden md:block h-12 w-[1px] bg-gray-100" />

            {/* SEARCH BAR */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Search & Filter Grid
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Type to search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* BRAND GRID */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full" />
              All Brands ({filteredBrands.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBrands.map((b: any) => (
                <button
                  key={b._id}
                  onClick={() => handleBrandSelect(b.slug)}
                  className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm hover:shadow-sm hover:border-primary-200 transition-all flex flex-col items-center gap-4 text-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-xl font-semibold text-gray-300">{b.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{b.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{b.slug}</p>
                  </div>
                </button>
              ))}
              {filteredBrands.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                  No brands found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
            <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
              <img src={brands.find((b:any) => b.slug === selectedSlug)?.logo} className="w-full h-full object-contain p-3" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Editing: {brands.find((b:any) => b.slug === selectedSlug)?.name}
              </h2>
              <p className="text-gray-500">Custom content for the bottom of the brand page.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* LEFT: TEXT */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Brand Story / Description
                </label>
                <RichDescriptionEditor
                  value={description}
                  onChange={(html) => setDescription(html)}
                  placeholder="Kurze Beschreibung für den Hero-Bereich..."
                  minHeight={180}
                  headings={false}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Long Description (unter den Coupons)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Koppen, alinea's, afbeeldingen en links — of plak via &bdquo;HTML&ldquo; direct code.
                </p>
                <RichDescriptionEditor
                  value={longContent}
                  onChange={(html) => setLongContent(html)}
                  placeholder="Uw uitgebreide tekst..."
                  minHeight={380}
                />
              </div>
            </div>

            {/* RIGHT: IMAGE */}
            <div className="space-y-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Feature Content Image
              </label>
              
              <div className="relative group rounded-lg overflow-hidden border-2 border-dashed border-gray-200 aspect-[16/10] bg-gray-50 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400 px-6">
                    <Upload size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No feature image uploaded yet.</p>
                  </div>
                )}
                
                <label 
                  htmlFor="content-image-upload"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm"
                >
                  <Upload size={32} className="mb-2" />
                  <span className="font-semibold">Change Picture</span>
                </label>
                <input 
                  type="file" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setContentImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden" 
                  id="content-image-upload"
                />
              </div>
              <p className="text-xs text-gray-400 text-center italic">Best size: 1200 x 800px</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-8 border-t border-gray-100 flex items-center justify-between gap-6">
            <div className="flex-1">
              {message && (
                <div className={`flex items-center gap-3 text-sm font-semibold p-4 rounded-lg ${message.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  <CheckCircle size={20} />
                  {message}
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedSlug("")}
                className="px-8 py-4 font-semibold text-gray-500 hover:text-gray-900 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-primary-600 text-white rounded-lg px-12 py-4 font-semibold hover:bg-primary-700 transition active:scale-95 shadow-sm shadow-primary-200 disabled:bg-gray-300"
              >
                {loading ? "Saving..." : (
                  <>
                    <Save size={20} />
                    Save Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
