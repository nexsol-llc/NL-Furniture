"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect } from "react";

export default function AdminOffersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const [data, setData] = useState({
    title: "",
    subtitle: "",
    price: "",
    oldPrice: "",
    discount: "",
    brand: "",
    section: "banner",
  });

  const [offers, setOffers] = useState<any[]>([]);

  const fetchOffers = async () => {
    try {
      const res = await adminFetch("/api/offers", { cache: "no-store" });
      const result = await res.json();
      if (Array.isArray(result)) {
        setOffers(result);
      } else {
        console.error("API did not return an array:", result);
      }
    } catch (err) {
      console.error("Failed to fetch offers:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setData({
      title: "",
      subtitle: "",
      price: "",
      oldPrice: "",
      discount: "",
      brand: "",
      section: "banner",
    });
    setFile(null);
    setEditingId(null);
    setCurrentImage(null);
    setError("");
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setCurrentImage(item.image);
    setData({
      title: item.title || "",
      subtitle: item.subtitle || "",
      price: item.price || "",
      oldPrice: item.oldPrice || "",
      discount: item.discount?.toString() || "",
      brand: item.brand || "",
      section: item.section || "banner",
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!file && !editingId) return alert("Please select an image");
    
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (file) {
        formData.append("image", file);
      }
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const url = editingId ? `/api/offers/${editingId}` : "/api/offers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        alert(editingId ? "Offer updated successfully! ✅" : "Offer uploaded successfully! ✅");
        resetForm();
        fetchOffers();
      } else {
        setError(result.error || "Failed to process offer");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const res = await adminFetch(`/api/offers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOffers();
      } else {
        alert("Failed to delete offer");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto bg-gray-50">
      <h1 className="text-2xl font-semibold mb-8 text-gray-900">Admin Offers Panel</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-12 border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          {editingId ? "Edit Offer" : "Add New Offer"}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IMAGE PREVIEW */}
          {(file || (editingId && currentImage)) && (
            <div className="col-span-1 md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {file ? "New Image Preview" : "Current Image"}
              </label>
              <img
                src={file ? URL.createObjectURL(file) : currentImage!}
                className="w-full h-56 object-cover rounded-xl shadow-inner border border-gray-200"
              />
              {file && (
                <button 
                  onClick={() => setFile(null)}
                  className="absolute top-8 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* IMAGE UPLOAD */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editingId ? "Replace Image (Optional)" : "Offer Image"}
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input 
              placeholder="e.g. Mega Sale" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input 
              placeholder="e.g. Up to 70% Off" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.subtitle}
              onChange={(e) => setData({ ...data, subtitle: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input 
              placeholder="e.g. 199.00€" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Old Price (optional)</label>
            <input 
              placeholder="e.g. 299.00€" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.oldPrice}
              onChange={(e) => setData({ ...data, oldPrice: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount % (numbers only)</label>
            <input 
              placeholder="e.g. 30" 
              type="number"
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.discount}
              onChange={(e) => setData({ ...data, discount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input 
              placeholder="e.g. IKEA" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={data.brand}
              onChange={(e) => setData({ ...data, brand: e.target.value })}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Section</label>
            <select
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-all"
              value={data.section}
              onChange={(e) => setData({ ...data, section: e.target.value })}
            >
              <option value="banner">Banner</option>
              <option value="flash">Flash Deals</option>
              <option value="sale">Sale Highlights</option>
              <option value="outdoor">Outdoor</option>
              <option value="bedroom">Bedroom</option>
              <option value="living">Living</option>
              <option value="lighting">Lighting</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 py-4 rounded-xl font-semibold text-white shadow-sm transition-all ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 active:scale-95"
              }`}
            >
              {loading ? "Processing..." : editingId ? "Update Offer" : "Upload Offer"}
            </button>
            
            {editingId && (
              <button
                onClick={resetForm}
                className="px-8 py-4 rounded-xl font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Current Offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {offers.length === 0 && !loading && (
          <p className="text-gray-500 col-span-full py-10 text-center bg-white rounded-lg border border-dashed border-gray-300">
            No offers found.
          </p>
        )}
        {offers.map((item: any) => (
          <div key={item._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-sm transition-shadow border border-gray-100 group">
            <div className="relative h-48 w-full overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-primary-700 shadow-sm">
                {item.section.toUpperCase()}
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1 truncate">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-3 truncate">{item.subtitle}</p>
              
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-primary-600">{item.price}</span>
                  <span className="text-xs text-gray-400">{item.brand}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-primary-50 text-primary-600 py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}