"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useEffect, useState } from "react";
import {
  Trash2, Edit, ImagePlus, UserCircle, Twitter, Instagram, Linkedin, Globe,
} from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

interface SocialLinks { twitter?: string; instagram?: string; linkedin?: string; website?: string; }
interface Author {
  _id: string;
  name: string;
  avatarUrl: string;
  role: string;
  socialLinks: SocialLinks;
}

const emptySocials = (): SocialLinks => ({ twitter: "", instagram: "", linkedin: "", website: "" });

export default function AuthorsAdmin() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocials());

  const fetchAuthors = async () => {
    try {
      const res = await adminFetch(`/api/authors?t=${Date.now()}`);
      const data = await res.json();
      setAuthors(Array.isArray(data.authors) ? data.authors : []);
    } catch (e) {
      console.error(e);
      setAuthors([]);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setAvatarUrl("");
    setSocialLinks(emptySocials());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Author name is required.");
    setLoading(true);

    const payload = { name, role, avatarUrl, socialLinks };

    try {
      const res = await adminFetch(editingId ? `/api/authors/${editingId}` : "/api/authors", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save author");
      }
      resetForm();
      await fetchAuthors();
    } catch (err: any) {
      alert(err.message || "Failed to save author");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this author? Stores referencing them will show a blank author box until reassigned.")) return;
    try {
      const res = await adminFetch(`/api/authors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (editingId === id) resetForm();
        await fetchAuthors();
      } else {
        alert(data.error || "Failed to delete author");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Authors</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Manage reusable author profiles — name, avatar, role and social links. Select one of
            these authors on a coupon store's Author Box and just add that store's own description.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT: Add/Edit form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary-600" />
              {editingId ? "Edit Author" : "Add New Author"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <UserCircle size={28} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition text-sm text-gray-600"
                >
                  <ImagePlus size={16} className="text-gray-400" /> Choose Avatar
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Deals Expert"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"><Twitter size={12} /> Twitter</label>
                  <input
                    value={socialLinks.twitter || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    placeholder="https://twitter.com/..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"><Instagram size={12} /> Instagram</label>
                  <input
                    value={socialLinks.instagram || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"><Linkedin size={12} /> LinkedIn</label>
                  <input
                    value={socialLinks.linkedin || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"><Globe size={12} /> Website</label>
                  <input
                    value={socialLinks.website || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {loading ? "Saving..." : editingId ? "Update Author" : "Add Author"}
                </button>
                {editingId && (
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

        {/* RIGHT: List of authors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-zinc-950 text-lg">All Authors ({authors.length})</h3>

            {authors.length === 0 ? (
              <p className="text-zinc-400 text-sm">No authors yet. Add one on the left to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authors.map((a) => (
                  <div key={a._id} className="relative border border-zinc-100 rounded-lg p-4 flex gap-4 bg-zinc-50/50 hover:bg-zinc-50 transition">
                    {a.avatarUrl ? (
                      <img src={a.avatarUrl} className="w-16 h-16 rounded-full object-cover border border-zinc-100 flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 flex-shrink-0">
                        <UserCircle size={26} />
                      </div>
                    )}

                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 truncate">{a.name}</h4>
                        {a.role && <span className="text-[11px] text-zinc-400 block mt-0.5 truncate">{a.role}</span>}
                      </div>

                      <div className="flex gap-2 self-end mt-2">
                        <button
                          onClick={() => {
                            setEditingId(a._id);
                            setName(a.name || "");
                            setRole(a.role || "");
                            setAvatarUrl(a.avatarUrl || "");
                            setSocialLinks({ ...emptySocials(), ...(a.socialLinks || {}) });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-primary-600 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
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

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => setAvatarUrl(item.url)}
        title="Select Author Avatar"
      />
    </div>
  );
}
