'use client';
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";
import { Link2, DollarSign, Image as ImageIcon, Check, ImagePlus } from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

export default function HomeInfluencerAdmin() {
  const [loading, setLoading] = useState(false);
  const [mainTitle, setMainTitle] = useState("");
  const [mainLink, setMainLink] = useState("");
  const [mainImageUrl, setMainImageUrl] = useState("");

  // Product items states (6 slots)
  const [productImages, setProductImages] = useState<Record<number, string>>({
    0: "", 1: "", 2: "", 3: "", 4: "", 5: ""
  });
  const [productPrices, setProductPrices] = useState<Record<number, string>>({
    0: "", 1: "", 2: "", 3: "", 4: "", 5: ""
  });
  const [productLinks, setProductLinks] = useState<Record<number, string>>({
    0: "", 1: "", 2: "", 3: "", 4: "", 5: ""
  });

  // Media picker target: "main" for the featured photo, or a slot index (0-5).
  const [pickerTarget, setPickerTarget] = useState<"main" | number | null>(null);

  const fetchData = async () => {
    try {
      const res = await adminFetch(`/api/home-influencer?t=${Date.now()}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        const item = resData.data;
        setMainTitle(item.mainImageTitle || "");
        setMainLink(item.mainImageLink || "");
        setMainImageUrl(item.mainImage || "");

        const prices: Record<number, string> = {};
        const links: Record<number, string> = {};
        const imgs: Record<number, string> = {};

        // Load 6 product slots
        for (let i = 0; i < 6; i++) {
          const prod = item.products?.[i] || {};
          prices[i] = prod.price || "";
          links[i] = prod.link || "";
          imgs[i] = prod.image || "";
        }
        setProductPrices(prices);
        setProductLinks(links);
        setProductImages(imgs);
      }
    } catch (e) {
      console.error("Error fetching home influencer look:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMediaSelect = (item: MediaItem) => {
    if (pickerTarget === "main") {
      setMainImageUrl(item.url);
    } else if (typeof pickerTarget === "number") {
      setProductImages(prev => ({ ...prev, [pickerTarget]: item.url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("mainImageTitle", mainTitle);
    formData.append("mainImageLink", mainLink);
    formData.append("mainImage", mainImageUrl);
    formData.append("productCount", "6");

    for (let i = 0; i < 6; i++) {
      formData.append(`image_${i}`, productImages[i] || "");
      formData.append(`price_${i}`, productPrices[i] || "");
      formData.append(`link_${i}`, productLinks[i] || "");
    }

    try {
      const res = await adminFetch("/api/home-influencer", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Update Failed");
      }

      alert("Home Influencer Look Updated Successfully ✅");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save look");
    } finally {
      setLoading(false);
    }
  };

  const pickerTitle =
    pickerTarget === "main"
      ? "Select Main Featured Photo"
      : typeof pickerTarget === "number"
      ? `Select image for Product #${pickerTarget + 1}`
      : "Media Library";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 hidden -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Home Influencer Look</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Configure the main featured look (big photo on the left) and the 6 shoppable products displayed on the right for the homepage "Influencer-Looks" section.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* LAYOUT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* LEFT: MAIN IMAGE CONFIGURATION */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 md:p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-zinc-950 text-lg">1. Main Featured Look Photo</h3>
                <p className="text-xs text-zinc-500 mt-1">Recommended size: 600x800px (Portrait) or similar.</p>
              </div>

              {/* Media Library Picker */}
              <button
                type="button"
                onClick={() => setPickerTarget("main")}
                className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl p-4 min-h-[350px] bg-zinc-50 hover:bg-zinc-100/60 transition flex items-center justify-center overflow-hidden group"
              >
                {mainImageUrl ? (
                  <img src={mainImageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Main" />
                ) : null}

                <div className="relative z-20 flex flex-col items-center text-center p-4 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-zinc-100 max-w-[80%] group-hover:scale-95 transition-all">
                  <ImagePlus className="w-8 h-8 text-zinc-500 mb-2" />
                  <span className="text-xs font-semibold text-zinc-900">Choose Main Photo</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Select from media library</span>
                </div>
              </button>

              {mainImageUrl && (
                <p className="text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1">
                  <Check size={14} /> Main photo selected
                </p>
              )}

              {/* Title & Link */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Look Caption/Title
                  </label>
                  <input
                    type="text"
                    value={mainTitle}
                    onChange={(e) => setMainTitle(e.target.value)}
                    placeholder="e.g. Coastal Cozy Bedroom"
                    className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5" /> Main Image Link
                  </label>
                  <input
                    type="text"
                    value={mainLink}
                    onChange={(e) => setMainLink(e.target.value)}
                    placeholder="e.g. /influencer/sherricalnanhome"
                    className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: 6 PRODUCTS CONFIGURATION */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 md:p-6 shadow-sm space-y-6">
            <div className="border-b pb-3">
              <h3 className="font-semibold text-zinc-950 text-lg">2. Shoppable Products (6 slots)</h3>
              <p className="text-xs text-zinc-500 mt-1">Configure images, prices and unique landing page links for all six slots.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-1 py-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="border border-zinc-100 rounded-lg p-4 space-y-4 bg-zinc-50/30">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-xs text-zinc-900">Product #{index + 1}</span>
                    <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-semibold uppercase">
                      Slot {index + 1}
                    </span>
                  </div>

                  {/* Image Selector */}
                  <button
                    type="button"
                    onClick={() => setPickerTarget(index)}
                    className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl p-2 min-h-[110px] bg-white flex items-center justify-center overflow-hidden transition group"
                  >
                    {productImages[index] ? (
                      <img src={productImages[index]} className="absolute inset-0 w-full h-full object-contain p-1" alt={`Product ${index + 1}`} />
                    ) : (
                      <div className="text-center text-[10px] text-zinc-400 flex flex-col items-center gap-1">
                        <ImagePlus className="w-5 h-5" />
                        No image
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-semibold z-20">
                      Choose from media library
                    </div>
                  </button>

                  {/* Input Fields */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Price
                      </label>
                      <input
                        type="text"
                        value={productPrices[index] || ""}
                        onChange={(e) => setProductPrices(prev => ({ ...prev, [index]: e.target.value }))}
                        placeholder="e.g. €89"
                        className="w-full border border-zinc-200 rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Link
                      </label>
                      <input
                        type="text"
                        value={productLinks[index] || ""}
                        onChange={(e) => setProductLinks(prev => ({ ...prev, [index]: e.target.value }))}
                        placeholder="e.g. /product-slug"
                        className="w-full border border-zinc-200 rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm py-4 rounded-lg transition shadow hover:shadow-sm"
        >
          {loading ? "Saving Influencer Look..." : "Save Home Influencer Look"}
        </button>

      </form>

      {/* MEDIA LIBRARY PICKER */}
      <MediaPicker
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleMediaSelect}
        title={pickerTitle}
      />
    </div>
  );
}
