'use client';
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";
import { Trash2, Link2, Settings, AlertCircle, Sparkles, Edit, ImagePlus } from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

export default function GadgetAdmin() {
  const [gadgets, setGadgets] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingGadgetId, setEditingGadgetId] = useState<string | null>(null);

  // Section configuration states
  const [sectionTitle, setSectionTitle] = useState("Ermäßigte Gadgets");
  const [sectionSlug, setSectionSlug] = useState("Aktuell im Trend");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchGadgets = async () => {
    try {
      const res = await adminFetch(`/api/gadgets?t=${Date.now()}`);
      const data = await res.json();
      setGadgets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setGadgets([]);
    }
  };

  const fetchSectionSettings = async () => {
    try {
      const res = await adminFetch(`/api/section-settings?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.settings && data.settings.gadgets) {
        setSectionTitle(data.settings.gadgets.title);
        setSectionSlug(data.settings.gadgets.slug);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGadgets();
    fetchSectionSettings();
  }, []);

  const resetForm = () => {
    setEditingGadgetId(null);
    setImageUrl("");
    setTitle("");
    setDesc("");
    setPrice("");
    setLink("");
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await adminFetch("/api/section-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: "gadgets",
          title: sectionTitle,
          slug: sectionSlug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Section header updated successfully ✅");
      } else {
        alert("Failed to update section header");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return alert("Please choose an image from the media library first.");
    setLoading(true);

    const payload = { image: imageUrl, title, desc, price, link };

    try {
      let res;
      if (editingGadgetId) {
        res = await adminFetch(`/api/gadgets/${editingGadgetId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch("/api/gadgets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save gadget");
      }

      alert(editingGadgetId ? "Gadget Updated Successfully ✅" : "Gadget Uploaded Successfully ✅");
      resetForm();
      await fetchGadgets();
    } catch (err: any) {
      alert(err.message || "Failed to save gadget");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gadget?")) return;
    try {
      const res = await adminFetch(`/api/gadgets/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Gadget Deleted Successfully ✅");
        await fetchGadgets();
      } else {
        alert(data.error || "Failed to delete gadget");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 hidden -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Gadgets Manager</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Configure dynamic gadgets cards for the homepage, along with customized Titles and Slugs/Subtitles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* LEFT COLUMN: SECTION SETTINGS & ADD GADGET */}
        <div className="lg:col-span-1 space-y-6">

          {/* Edit Section Header Settings */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              Configure Section Header
            </h3>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Section Title</label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Ermäßigte Gadgets"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Section Slug / Subtitle</label>
                <input
                  type="text"
                  value={sectionSlug}
                  onChange={(e) => setSectionSlug(e.target.value)}
                  placeholder="e.g. Aktuell im Trend"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
              >
                {savingSettings ? "Updating..." : "Save Section Header"}
              </button>
            </form>
          </div>

          {/* Add/Edit Gadget Form */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              {editingGadgetId ? "Edit Gadget" : "Add New Gadget"}
            </h3>

            {/* Size Recommendation Alert */}
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-3.5 rounded-lg text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>Recommended size: <strong>900 × 1200 px</strong> &mdash; Aspect ratio <strong>3:4 (portrait)</strong> &mdash; PNG, JPG, WebP</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Media Library Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gadget Image</label>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="relative w-full border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg p-4 min-h-[160px] bg-zinc-50 hover:bg-zinc-100/40 transition flex flex-col items-center justify-center overflow-hidden group"
                >
                  {imageUrl ? (
                    <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Gadget" />
                  ) : null}

                  <div className="relative z-20 flex flex-col items-center text-center p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border group-hover:scale-95 transition-all">
                    <ImagePlus className="w-6 h-6 text-zinc-500 mb-1" />
                    <span className="text-[10px] font-semibold text-zinc-900">Choose Image</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">Select from media library</span>
                  </div>
                </button>
              </div>

              {/* Title & Link */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gadget Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gadget Name"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Redirect Link</label>
                <div className="relative flex items-center">
                  <Link2 size={16} className="absolute left-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. /external-link"
                    className="w-full border border-zinc-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {loading ? "Saving..." : editingGadgetId ? "Update Gadget" : "Upload Gadget"}
                </button>
                {editingGadgetId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST OF GADGETS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-100 p-6 md:p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-zinc-950 text-lg">Current Gadgets ({gadgets.length})</h3>

            {gadgets.length === 0 ? (
              <p className="text-zinc-400 text-sm">No gadgets found. Click add on the left to add one.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gadgets.map((gd) => (
                  <div key={gd._id} className="relative border border-zinc-100 rounded-lg p-4 flex gap-4 bg-zinc-50/50 hover:bg-zinc-50 transition">
                    <div className="relative w-20 h-20 bg-white border border-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={gd.image} className="w-full h-full object-cover" alt="" />
                    </div>

                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 truncate">{gd.title || "Gadget Card"}</h4>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[180px] block mt-1">
                          Link: {gd.link || "None"}
                        </span>
                      </div>

                      <div className="flex gap-2 self-end mt-2">
                        <button
                          onClick={() => {
                            setEditingGadgetId(gd._id);
                            setTitle(gd.title || "");
                            setDesc(gd.desc || "");
                            setPrice(gd.price || "");
                            setLink(gd.link || "");
                            setImageUrl(gd.image || "");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-primary-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(gd._id)}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-red-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MEDIA LIBRARY PICKER */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => setImageUrl(item.url)}
        title="Select Gadget Image"
      />
    </div>
  );
}
