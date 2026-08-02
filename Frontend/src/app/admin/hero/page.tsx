'use client';
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";
import { Upload, Link2, AlertCircle, Check } from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

export default function HeroAdmin() {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  // Individual states for each slot — image URL selected from the media library
  const [imageUrl1, setImageUrl1] = useState<string | null>(null);
  const [link1, setLink1] = useState("");

  const [imageUrl2, setImageUrl2] = useState<string | null>(null);
  const [link2, setLink2] = useState("");

  const [imageUrl3, setImageUrl3] = useState<string | null>(null);
  const [link3, setLink3] = useState("");

  const fetchHeroes = async () => {
    try {
      const res = await adminFetch(`/api/hero?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setHeroes(arr);

      // Pre-fill links
      const h1 = arr.find((h: any) => h.slot === 1);
      if (h1) setLink1(h1.link || "");

      const h2 = arr.find((h: any) => h.slot === 2);
      if (h2) setLink2(h2.link || "");

      const h3 = arr.find((h: any) => h.slot === 3);
      if (h3) setLink3(h3.link || "");
    } catch (e) {
      console.error("Error fetching hero slots:", e);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, []);

  const handleMediaSelect = (item: MediaItem) => {
    if (pickerSlot === 1) setImageUrl1(item.url);
    else if (pickerSlot === 2) setImageUrl2(item.url);
    else if (pickerSlot === 3) setImageUrl3(item.url);
  };

  const handleSave = async (slot: number) => {
    setLoadingMap((prev) => ({ ...prev, [slot]: true }));

    const formData = new FormData();
    formData.append("slot", slot.toString());
    formData.append("title", "");
    formData.append("subtitle", "");

    if (slot === 1) {
      if (imageUrl1) formData.append("image", imageUrl1);
      formData.append("link", link1);
    } else if (slot === 2) {
      if (imageUrl2) formData.append("image", imageUrl2);
      formData.append("link", link2);
    } else if (slot === 3) {
      if (imageUrl3) formData.append("image", imageUrl3);
      formData.append("link", link3);
    }

    try {
      const res = await adminFetch("/api/hero", {
        method: "POST",
        body: formData,
      });

      let resData: any = null;
      try { resData = await res.json(); } catch {}

      if (!res.ok) {
        throw new Error(resData?.error || resData?.details || "Upload Failed");
      }

      alert(`Card ${slot} Updated Successfully ✅`);
      // Clear pending selections
      if (slot === 1) setImageUrl1(null);
      else if (slot === 2) setImageUrl2(null);
      else if (slot === 3) setImageUrl3(null);
      await fetchHeroes();
    } catch (err: any) {
      alert(err.message || "Upload Failed ❌");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const getHeroBySlot = (slot: number) => {
    return heroes.find((h: any) => h.slot === slot);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 hidden -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Hero Section Manager</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Configure the 3 home page hero slot images and redirection links. Each section has a dedicated form and specific sizing rules.
          </p>
        </div>
      </div>

      {/* THREE INDEPENDENT EDITING CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARD 1 - LEFT LARGE */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm hover:shadow-sm transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-lg text-zinc-950">Slot 1 (Left Large)</h3>
              <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                16:9 Aspect
              </span>
            </div>

            {/* Size alert badge */}
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>Recommended size: 680x380px</span>
            </div>

            {/* Image Picker Area */}
            <button
              type="button"
              onClick={() => setPickerSlot(1)}
              className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-4 min-h-[220px] bg-zinc-50 hover:bg-zinc-100/60 transition flex flex-col items-center justify-center overflow-hidden group"
            >
              {imageUrl1 ? (
                <img src={imageUrl1} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10" />
              ) : getHeroBySlot(1)?.image ? (
                <img src={getHeroBySlot(1)?.image} alt="Current" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              <div className="relative z-20 flex flex-col items-center text-center p-4 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-white/20 max-w-[85%] group-hover:scale-95 transition-all">
                <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs font-semibold text-zinc-900">Choose Image</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Select from media library</span>
              </div>
            </button>
            {imageUrl1 && (
              <p className="text-xs text-primary-600 font-semibold text-center flex items-center justify-center gap-1">
                <Check size={14} /> New image selected — save to apply
              </p>
            )}

            {/* Link input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} /> Redirection Link (URL)
              </label>
              <input
                type="text"
                value={link1}
                onChange={(e) => setLink1(e.target.value)}
                placeholder="/categorie/moebel"
                className="border border-zinc-200 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 text-sm font-medium transition"
              />
            </div>
          </div>

          <button
            onClick={() => handleSave(1)}
            disabled={loadingMap[1]}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg w-full text-sm transition-all shadow hover:shadow-sm"
          >
            {loadingMap[1] ? "Saving changes..." : "Save Card 1"}
          </button>
        </div>

        {/* CARD 2 - RIGHT TOP */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm hover:shadow-sm transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-lg text-zinc-950">Slot 2 (Right Top)</h3>
              <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                ~16:4 Aspect
              </span>
            </div>

            {/* Size alert badge */}
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>Recommended size: 680x182px</span>
            </div>

            {/* Image Picker Area */}
            <button
              type="button"
              onClick={() => setPickerSlot(2)}
              className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-4 min-h-[220px] bg-zinc-50 hover:bg-zinc-100/60 transition flex flex-col items-center justify-center overflow-hidden group"
            >
              {imageUrl2 ? (
                <img src={imageUrl2} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10" />
              ) : getHeroBySlot(2)?.image ? (
                <img src={getHeroBySlot(2)?.image} alt="Current" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              <div className="relative z-20 flex flex-col items-center text-center p-4 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-white/20 max-w-[85%] group-hover:scale-95 transition-all">
                <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs font-semibold text-zinc-900">Choose Image</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Select from media library</span>
              </div>
            </button>
            {imageUrl2 && (
              <p className="text-xs text-primary-600 font-semibold text-center flex items-center justify-center gap-1">
                <Check size={14} /> New image selected — save to apply
              </p>
            )}

            {/* Link input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} /> Redirection Link (URL)
              </label>
              <input
                type="text"
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="/categorie/outdoor"
                className="border border-zinc-200 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 text-sm font-medium transition"
              />
            </div>
          </div>

          <button
            onClick={() => handleSave(2)}
            disabled={loadingMap[2]}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg w-full text-sm transition-all shadow hover:shadow-sm"
          >
            {loadingMap[2] ? "Saving changes..." : "Save Card 2"}
          </button>
        </div>

        {/* CARD 3 - RIGHT BOTTOM */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm hover:shadow-sm transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-lg text-zinc-950">Slot 3 (Right Bottom)</h3>
              <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                ~16:4 Aspect
              </span>
            </div>

            {/* Size alert badge */}
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>Recommended size: 680x182px</span>
            </div>

            {/* Image Picker Area */}
            <button
              type="button"
              onClick={() => setPickerSlot(3)}
              className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-4 min-h-[220px] bg-zinc-50 hover:bg-zinc-100/60 transition flex flex-col items-center justify-center overflow-hidden group"
            >
              {imageUrl3 ? (
                <img src={imageUrl3} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10" />
              ) : getHeroBySlot(3)?.image ? (
                <img src={getHeroBySlot(3)?.image} alt="Current" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              <div className="relative z-20 flex flex-col items-center text-center p-4 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-white/20 max-w-[85%] group-hover:scale-95 transition-all">
                <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs font-semibold text-zinc-900">Choose Image</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Select from media library</span>
              </div>
            </button>
            {imageUrl3 && (
              <p className="text-xs text-primary-600 font-semibold text-center flex items-center justify-center gap-1">
                <Check size={14} /> New image selected — save to apply
              </p>
            )}

            {/* Link input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} /> Redirection Link (URL)
              </label>
              <input
                type="text"
                value={link3}
                onChange={(e) => setLink3(e.target.value)}
                placeholder="/categorie/accessories"
                className="border border-zinc-200 rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 text-sm font-medium transition"
              />
            </div>
          </div>

          <button
            onClick={() => handleSave(3)}
            disabled={loadingMap[3]}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg w-full text-sm transition-all shadow hover:shadow-sm"
          >
            {loadingMap[3] ? "Saving changes..." : "Save Card 3"}
          </button>
        </div>

      </div>

      {/* MEDIA LIBRARY PICKER */}
      <MediaPicker
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={handleMediaSelect}
        title={pickerSlot ? `Select image for Slot ${pickerSlot}` : "Media Library"}
      />
    </div>
  );
}