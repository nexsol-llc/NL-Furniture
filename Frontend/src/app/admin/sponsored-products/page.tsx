"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2 } from "lucide-react";

export default function SponsoredProductsAdmin() {
  const categories = [
    { label: "Beds (Betten)", value: "Beds" },
    { label: "Sofas", value: "Sofas" },
    { label: "Chairs (Sessel)", value: "Chairs" },
    { label: "Tables (Tische)", value: "Tables" },
    { label: "Outdoor Möbel", value: "Outdoor" },
    { label: "Wardrobes", value: "Wardrobes" },
    { label: "Kitchen", value: "Kitchen" },
    { label: "Lighting", value: "Lighting" },
    { label: "Office", value: "Office" },
    { label: "Kids", value: "Kids" },
    { label: "Living Room", value: "LivingRoom" },
    { label: "Bedroom", value: "Bedroom" },
    { label: "Storage", value: "Storage" },
  ];

  const { data, mutate } = useSWR("/api/sponsored-products", (url) => fetch(url).then(r => r.json()));
  
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    product_name: "",
    category_name: "",
    display_price: "",
    brand_name: "",
    aw_deep_link: "",
    image_url: "",
  });
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');

  const handleSubmit = async () => {
    if (!form.product_name || !form.category_name) {
      return alert("Title and Category are required");
    }

    let res: Response;

    if (uploadMode === 'file' && file) {
      // FormData with file
      const formData = new FormData();
      formData.append("image", file);
      formData.append("product_name", form.product_name);
      formData.append("category_name", form.category_name);
      formData.append("display_price", form.display_price);
      formData.append("brand_name", form.brand_name);
      formData.append("aw_deep_link", form.aw_deep_link);
      res = await adminFetch("/api/sponsored-products", { method: "POST", body: formData });
    } else {
      // JSON with image URL (no file — avoids 413 error)
      res = await adminFetch("/api/sponsored-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
    }

    if (res.ok) {
      alert("Sponsored Product Added to First Row ✅");
      setForm({ product_name: "", category_name: "", display_price: "", brand_name: "", aw_deep_link: "", image_url: "" });
      setFile(null);
      mutate();
    } else {
      alert("Error adding product");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this sponsored product?")) return;
    await adminFetch(`/api/sponsored-products?id=${id}`, { method: "DELETE" });
    mutate();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-semibold flex items-center mb-6">
          <Plus className="text-primary-600 mr-2" /> Add Sponsored Product (First Row)
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product Image</label>
            <div className="flex gap-3 mb-3">
              <button type="button" onClick={() => setUploadMode('url')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${uploadMode === 'url' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Paste Image URL
              </button>
              <button type="button" onClick={() => setUploadMode('file')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${uploadMode === 'file' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Upload File
              </button>
            </div>
            {uploadMode === 'url' ? (
              <div>
                <input 
                  type="text" 
                  placeholder="https://example.com/product-image.jpg" 
                  value={form.image_url}
                  onChange={(e) => setForm({...form, image_url: e.target.value})}
                  className="border p-3 w-full rounded-xl"
                />
                {form.image_url && <img src={form.image_url} alt="preview" className="h-32 mt-2 object-contain rounded-lg border" />}
                <p className="text-xs text-gray-400 mt-1">Recommended: paste a direct image link (avoids upload size limit)</p>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded-lg" />
                {file && <img src={URL.createObjectURL(file)} className="h-32 mt-2 object-contain" />}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Select Category</label>
            <select 
              value={form.category_name} 
              onChange={(e) => setForm({...form, category_name: e.target.value})}
              className="border p-3 w-full rounded-xl"
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">This product will appear at the TOP (first row) of this category.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input placeholder="e.g. Luxury Oak Table" value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} className="border p-3 w-full rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input placeholder="e.g. IKEA" value={form.brand_name} onChange={(e) => setForm({...form, brand_name: e.target.value})} className="border p-3 w-full rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input placeholder="e.g. 199,00 €" value={form.display_price} onChange={(e) => setForm({...form, display_price: e.target.value})} className="border p-3 w-full rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Affiliate Link / Button Link</label>
            <input placeholder="https://example.com" value={form.aw_deep_link} onChange={(e) => setForm({...form, aw_deep_link: e.target.value})} className="border p-3 w-full rounded-xl" />
          </div>

          <button onClick={handleSubmit} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 mt-4 rounded-xl transition">
            Add Product to First Row
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Current Sponsored Products</h2>
        <div className="divide-y text-sm">
          {data?.sponsored?.length > 0 ? data.sponsored.map((p: any) => (
             <div key={p._id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {p.merchant_image_url && (
                    <img src={p.merchant_image_url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">{p.product_name}</p>
                    <p className="text-gray-500">{p.category_name} • {p.display_price} • {p.brand_name}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                  <Trash2 size={20} />
                </button>
             </div>
          )) : (
            <p className="text-gray-500 text-center py-6">No sponsored products added yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
