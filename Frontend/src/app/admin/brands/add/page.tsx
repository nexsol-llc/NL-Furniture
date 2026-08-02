"use client";
import useSWR from "swr";
import { useState } from "react";
import { Edit2, Trash2, Plus, X } from "lucide-react";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminBrands() {
  const { data, mutate, error } = useSWR("/api/brands", fetcher);

  const [editing, setEditing] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [originalSlug, setOriginalSlug] = useState("");   // 🔥 Important
  const [search, setSearch] = useState("");

  // Slug generator
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const brands = data?.brands || [];

  // Search Filter
  const filteredBrands = brands.filter((b: any) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // DELETE Handler
  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    await fetch(`/api/brands/${slug}`, { method: "DELETE" });
    mutate();
  };

  // EDIT Click Handler
  const handleEditClick = (brand: any) => {
    setEditing({ ...brand });           // Full brand copy
    setOriginalSlug(brand.slug);        // 🔥 Save original slug for update
    setLogoFile(null);
    setLogoPreview(brand.logo || "");
  };

  // ADD NEW
  const handleAddNew = () => {
    setEditing({
      name: "",
      slug: "",
      logo: "",
      verifiedCoupons: "",
      avgSavings: "",
      totalOffers: "",
      lastUpdated: "",
    });
    setOriginalSlug("");
    setLogoFile(null);
    setLogoPreview("");
  };

  // SAVE (Create or Update)
  const handleSave = async () => {
    if (!editing) return;

    const formData = new FormData();
    formData.append("name", editing.name || "");
    formData.append("slug", editing.slug || generateSlug(editing.name || ""));
    formData.append("verifiedCoupons", editing.verifiedCoupons || "");
    formData.append("avgSavings", editing.avgSavings || "");
    formData.append("totalOffers", editing.totalOffers || "");
    formData.append("lastUpdated", editing.lastUpdated || "");

    if (logoFile) {
      formData.append("logo", logoFile);
    } else if (editing.logo) {
      formData.append("logo", editing.logo);
    }

    const isEdit = !!editing._id;
    const url = isEdit 
      ? `/api/brands/${originalSlug}`   // 🔥 Use original slug for update
      : "/api/brands";

    const method = isEdit ? "PUT" : "POST";

    await fetch(url, {
      method,
      body: formData,
    });

    // Reset states
    setEditing(null);
    setLogoFile(null);
    setLogoPreview("");
    setOriginalSlug("");
    mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className=" bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage Brands</h1>
            <p className="text-gray-600">Add, edit and delete brands</p>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
          >
            <Plus size={20} />
            Add New Brand
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands by name or slug..."
            className="w-full md:w-96 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Brands Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No brands found matching your search.
            </div>
          ) : (
            filteredBrands.map((b: any) => (
              <div key={b._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-sm transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-900">{b.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{b.slug}</p>
                  </div>

                  {b.logo && (
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="w-14 h-14 object-contain border rounded-lg p-1 bg-white"
                    />
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleEditClick(b)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-600 py-2.5 rounded-xl transition"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.slug)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl transition"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
            
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <h2 className="text-2xl font-semibold">
                {editing._id ? "Edit Brand" : "Add New Brand"}
              </h2>
              <button 
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  value={editing.name || ""}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditing({
                      ...editing,
                      name: newName,
                      slug: editing._id ? editing.slug : generateSlug(newName), // Auto only on create
                    });
                  }}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="IKEA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  value={editing.slug || ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ikea"
                  disabled={!!editing._id} // Disable editing slug on update (optional)
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo</label>
                
                {(logoPreview || editing.logo) && (
                  <div className="mb-4">
                    <img
                      src={logoPreview || editing.logo}
                      alt="Preview"
                      className="w-20 h-20 object-contain border rounded-xl p-2"
                    />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
              >
                {editing._id ? "Save Changes" : "Create Brand"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 font-medium py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}