"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useState, useEffect, lazy, Suspense } from "react";
import { Edit2, Trash2, X, Save, Rocket, Plus, ImagePlus } from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import PlaceholderImage from "@/app/components/PlaceholderImage";

// Lazy load heavy RichTextEditor — only loads when form is opened
const RichTextEditor = lazy(() => import("@/app/components/RichTextEditor"));

type Product = {
  _id: string;
  product_name: string;
  merchant_name?: string;
  image?: string;
  display_price?: string;
  aw_deep_link?: string;
};

type BlogSection = {
  _id?: string;
  title: string;
  content: string;
  image: string;
  products: Product[];
};

type Blog = {
  _id: string;
  title: string;
  subHeading: string;
  category: string;
  author: string;
  intro: string;
  heroImage: string;
  thumbnail: string;
  heroImageBy: string;
  sections: BlogSection[];
  faqs?: BlogFAQ[];
  seo?: BlogSEO;
  createdAt?: string;
};

type BlogFAQ = {
  question: string;
  answer: string;
};

type BlogSEO = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
};

export default function BlogAdminPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  // Category names come from the Categories Manager (Kategorie Main Page —
  // Innenbereich + Außenbereich lists), not a blog-specific list.
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subHeading, setSubHeading] = useState("");
  const [category, setCategory] = useState("Betten");
  const [author, setAuthor] = useState("");
  const [intro, setIntro] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [heroImageBy, setHeroImageBy] = useState("");
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [faqs, setFaqs] = useState<BlogFAQ[]>([]);

  // Media library picker — holds the callback that receives the selected URL.
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => setPickerCallback(() => cb);
  const [seo, setSeo] = useState<BlogSEO>({
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
  });

  useEffect(() => {
    fetchBlogs();
    fetchCategories(true);
  }, []);

  const fetchCategories = async (autoSelect = false) => {
    try {
      // Categories are managed on the Categories Manager (Kategorie Main Page).
      // Combine the Innenbereich + Außenbereich items, keep unique names in order.
      const res = await adminFetch("/api/kategorie-settings");
      const data = await res.json();
      const s = data?.settings ?? {};
      // Unified categories[] (each item has type: "indoor" | "outdoor") replaces
      // the old separate indoorCategories/outdoorCategories arrays; fall back to
      // those for any un-migrated environment.
      const combined: any[] = Array.isArray(s.categories)
        ? s.categories
        : [
            ...(Array.isArray(s.indoorCategories) ? s.indoorCategories : []),
            ...(Array.isArray(s.outdoorCategories) ? s.outdoorCategories : []),
          ];
      const names = combined
        .map((cat: any) => (typeof cat === "string" ? cat : cat?.name))
        .filter((name: unknown): name is string => typeof name === "string" && name.trim() !== "");
      const uniqueNames = Array.from(new Set(names));
      setCategoriesList(uniqueNames);
      if (autoSelect && uniqueNames.length > 0 && category === "Betten") {
        setCategory(uniqueNames[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // ?summary=true only returns title/category/author/heroImage/createdAt
      // sections/content/products are not included — much faster!
      const res = await adminFetch("/api/blog?summary=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlogs(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    setSections([...sections, { title: "", content: "", image: "", products: [] }]);
  };

  const handleUpdateSection = (index: number, field: keyof BlogSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleRemoveSection = (index: number) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated);
  };

  const createManualProduct = (): Product => ({
    _id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_name: "",
    merchant_name: "",
    image: "",
    display_price: "",
    aw_deep_link: "",
  });

  const handleAddProductToSection = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].products.push(createManualProduct());
    setSections(updated);
  };

  const handleUpdateProductInSection = (
    sectionIndex: number,
    productIndex: number,
    field: keyof Product,
    value: string
  ) => {
    const updated = [...sections];
    updated[sectionIndex].products[productIndex] = {
      ...updated[sectionIndex].products[productIndex],
      [field]: value,
    };
    setSections(updated);
  };

  const handleRemoveProductFromSection = (productIndex: number, sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].products.splice(productIndex, 1);
    setSections(updated);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleUpdateFaq = (index: number, field: keyof BlogFAQ, value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleRemoveFaq = (index: number) => {
    const updated = [...faqs];
    updated.splice(index, 1);
    setFaqs(updated);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubHeading("");
    setCategory(categoriesList[0] || "Betten");
    setAuthor("");
    setIntro("");
    setHeroImage("");
    setThumbnail("");
    setHeroImageBy("");
    setSections([]);
    setFaqs([]);
    setSeo({
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
    });
    setShowForm(false);
  };

  const handleEdit = async (blog: Blog) => {
    // summary mode only has basic fields; full data is needed for editing
    setEditingId(blog._id);
    setShowForm(true);
    setEditLoading(true);
    setTitle(blog.title);
    setSubHeading(blog.subHeading || "");
    setCategory(blog.category);
    setAuthor(blog.author || "");

    // Fetch full data from the API (only on edit click)
    try {
      const res = await adminFetch(`/api/blog/${blog._id}`);
      const full = await res.json();
      setIntro(full.intro || "");
      setHeroImage(full.heroImage || "");
      setThumbnail(full.thumbnail || "");
      setHeroImageBy(full.heroImageBy || "");
      setSections(full.sections || []);
      setFaqs(full.faqs || []);
      setSeo({
        metaTitle: full.seo?.metaTitle || "",
        metaDescription: full.seo?.metaDescription || "",
        keywords: full.seo?.keywords || "",
        focusKeyword: full.seo?.focusKeyword || "",
        canonicalUrl: full.seo?.canonicalUrl || "",
        ogTitle: full.seo?.ogTitle || "",
        ogDescription: full.seo?.ogDescription || "",
      });
    } catch (err) {
      console.error("Full blog fetch failed:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is missing!");

    const payload = {
      title,
      subHeading,
      category,
      author,
      intro,
      heroImage,
      thumbnail,
      heroImageBy,
      sections: sections.map((sec) => ({
        title: sec.title,
        content: sec.content,
        image: sec.image,
        products: sec.products
          .filter(
            (p) => p.product_name.trim() || p.image || p.display_price || p.aw_deep_link
          )
          .map((p) => ({
            _id: p._id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            product_name: p.product_name,
            merchant_name: p.merchant_name || "",
            image: p.image || "",
            display_price: p.display_price || "",
            aw_deep_link: p.aw_deep_link || "",
          })),
      })),
      faqs: faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
      seo,
    };

    try {
      const url = editingId ? `/api/blog/${editingId}` : "/api/blog";
      const method = editingId ? "PUT" : "POST";
      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchBlogs();
      } else {
        alert("Error while saving");
      }
    } catch (error) {
      console.error(error);
      alert("Error while saving");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      await adminFetch(`/api/blog/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      fetchBlogs();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const query = adminSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-0">
      {/* ── LEFT PANEL: Blog Library ── */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          showForm ? "w-[340px] min-w-[260px]" : "flex-1"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Blog Library</h1>
            <p className="text-xs text-gray-500 mt-0.5">{blogs.length} blogs saved</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-primary-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-primary-700 transition whitespace-nowrap flex items-center gap-1"
          >
            <span className="text-base leading-none">+</span> New Blog
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b flex-shrink-0">
          <input
            type="search"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder="Search by title or category..."
            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Blog List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-500">Loading blogs...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">No blogs found</p>
              <p className="text-xs mt-1">Create your first blog!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredBlogs.map((blog) => (
                <li
                  key={blog._id}
                  className={`p-4 cursor-pointer hover:bg-primary-50 transition-colors group ${
                    editingId === blog._id ? "bg-primary-50 border-l-4 border-l-primary-500" : ""
                  }`}
                >
                  {/* Category badge */}
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full mb-1">
                    {blog.category}
                  </span>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {blog.title}
                  </h3>

                  {/* Meta */}
                  <p className="text-xs text-gray-400">
                    {blog.sections?.length || 0} sections
                    {blog.author ? ` · ${blog.author}` : ""}
                    {blog.createdAt
                      ? ` · ${new Date(blog.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : ""}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:underline"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 font-medium hover:underline"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      {showForm && (
        <div className="flex-1 overflow-y-auto bg-gray-50 relative">
          {/* Edit loading overlay */}
          {editLoading && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-primary-600">Loading blog…</p>
            </div>
          )}
          <div className="max-w-4xl mx-auto p-6">
            {/* Form Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                {editingId
                  ? <><Edit2 size={20} className="text-primary-600" /> Edit Blog</>
                  : <><Plus size={20} className="text-primary-600" /> Create New Blog</>}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <X size={16} /> Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Heading *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Heading</label>
                    <input
                      type="text"
                      value={subHeading}
                      onChange={(e) => setSubHeading(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                      {categoriesList.length === 0 && (
                        <option value="">No categories yet — add them in Categories Manager</option>
                      )}
                      {/* Keep the current value selectable even if it's no longer in the list. */}
                      {category && !categoriesList.includes(category) && (
                        <option value={category}>{category}</option>
                      )}
                      {categoriesList.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Image <span className="text-gray-400 font-normal text-xs">(recommended 1600×900px)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        className="flex-1 border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        placeholder="URL or Upload..."
                      />
                      <button
                        type="button"
                        onClick={() => openPicker(setHeroImage)}
                        className="bg-gray-100 px-3 py-2 rounded-lg border hover:bg-gray-200 text-sm flex items-center gap-1 whitespace-nowrap"
                      >
                        <ImagePlus size={15} /> Library
                      </button>
                    </div>
                    {heroImage && (
                      <img src={heroImage} alt="Hero" className="mt-2 h-20 w-full object-cover rounded-lg border" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image By (Picture By)</label>
                    <input
                      type="text"
                      value={heroImageBy}
                      onChange={(e) => setHeroImageBy(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="e.g. GENEVA GARCIA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail <span className="text-gray-400 font-normal text-xs">(3:4 portrait, e.g. 600×800px — used on cards)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)}
                        className="flex-1 border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        placeholder="URL or Upload... (falls back to Hero Image)"
                      />
                      <button
                        type="button"
                        onClick={() => openPicker(setThumbnail)}
                        className="bg-gray-100 px-3 py-2 rounded-lg border hover:bg-gray-200 text-sm flex items-center gap-1 whitespace-nowrap"
                      >
                        <ImagePlus size={15} /> Library
                      </button>
                    </div>
                    {thumbnail && (
                      <img src={thumbnail} alt="Thumbnail" className="mt-2 h-40 object-cover rounded-lg border" style={{ aspectRatio: "3 / 4" }} />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro / Introduction</label>
                  <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
                    <RichTextEditor
                      value={intro}
                      onChange={setIntro}
                      placeholder="Write the description / intro here..."
                    />
                  </Suspense>
                </div>
              </div>

              {/* Sections */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Blog Sections ({sections.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="text-primary-600 font-medium hover:underline text-sm"
                  >
                    + Add Section
                  </button>
                </div>

                {sections.length === 0 && (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                    No sections yet. Click &quot;+ Add Section&quot;.
                  </div>
                )}

                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <div key={index} className="border rounded-lg bg-gray-50 p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Section {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleUpdateSection(index, "title", e.target.value)}
                            className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section Image</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={section.image}
                              onChange={(e) => handleUpdateSection(index, "image", e.target.value)}
                              className="flex-1 border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                              placeholder="URL or Upload..."
                            />
                            <button
                              type="button"
                              onClick={() => openPicker((url) => handleUpdateSection(index, "image", url))}
                              className="bg-gray-100 px-3 py-2 rounded-lg border hover:bg-gray-200 text-sm flex items-center gap-1 whitespace-nowrap"
                            >
                              <ImagePlus size={15} /> Library
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content <span className="text-gray-400 font-normal text-xs">(H2/H3, Links, Lists)</span>
                        </label>
                        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
                          <RichTextEditor
                            value={section.content}
                            onChange={(val) => handleUpdateSection(index, "content", val)}
                            placeholder="Write the section content here..."
                          />
                        </Suspense>
                      </div>

                      {/* Products */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Products ({section.products.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddProductToSection(index)}
                            className="text-primary-600 hover:underline text-sm font-medium"
                          >
                            + Add Product
                          </button>
                        </div>

                        {section.products.length === 0 ? (
                          <p className="text-sm text-gray-400 border border-dashed border-gray-300 rounded p-3 bg-white">
                            No products yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {section.products.map((p, productIndex) => (
                              <div key={p._id || productIndex} className="relative border p-3 rounded-lg bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromSection(productIndex, index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                                <div className="grid grid-cols-[80px_1fr] gap-3">
                                  <div>
                                    <PlaceholderImage
                                      src={p.image}
                                      alt=""
                                      width={80}
                                      height={80}
                                      className="w-20 h-20 object-contain bg-gray-100 rounded border mb-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPicker((url) =>
                                          handleUpdateProductInSection(index, productIndex, "image", url)
                                        )
                                      }
                                      className="bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200 text-xs inline-flex items-center gap-1"
                                    >
                                      <ImagePlus size={13} /> Library
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 pr-4">
                                    <input
                                      type="text"
                                      value={p.product_name}
                                      onChange={(e) => handleUpdateProductInSection(index, productIndex, "product_name", e.target.value)}
                                      className="w-full border p-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
                                      placeholder="Product Name"
                                    />
                                    <input
                                      type="text"
                                      value={p.image || ""}
                                      onChange={(e) => handleUpdateProductInSection(index, productIndex, "image", e.target.value)}
                                      className="w-full border p-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
                                      placeholder="Image URL"
                                    />
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <input
                                        type="text"
                                        value={p.display_price || ""}
                                        onChange={(e) => handleUpdateProductInSection(index, productIndex, "display_price", e.target.value)}
                                        className="w-full border p-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
                                        placeholder="Price"
                                      />
                                      <input
                                        type="text"
                                        value={p.merchant_name || ""}
                                        onChange={(e) => handleUpdateProductInSection(index, productIndex, "merchant_name", e.target.value)}
                                        className="w-full border p-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
                                        placeholder="Shop / Brand"
                                      />
                                    </div>
                                    <input
                                      type="url"
                                      value={p.aw_deep_link || ""}
                                      onChange={(e) => handleUpdateProductInSection(index, productIndex, "aw_deep_link", e.target.value)}
                                      className="w-full border p-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
                                      placeholder="Product Link"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">FAQs ({faqs.length})</h3>
                  <button type="button" onClick={handleAddFaq} className="text-primary-600 font-medium hover:underline text-sm">
                    + Add FAQ
                  </button>
                </div>

                {faqs.length === 0 && (
                  <p className="text-sm text-gray-400">No FAQs added yet.</p>
                )}

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border p-4 rounded-lg bg-gray-50 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(index, "question", e.target.value)}
                            className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => handleUpdateFaq(index, "answer", e.target.value)}
                            className="w-full border rounded-lg p-2.5 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-primary-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">SEO</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={seo.metaTitle}
                      onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                    <input
                      type="text"
                      value={seo.keywords}
                      onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="sofa, wohnzimmer, trends"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={seo.focusKeyword || ""}
                      onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="haupt keyword"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={seo.canonicalUrl || ""}
                      onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="https://nl-furniture.nl/blog/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
                    <input
                      type="text"
                      value={seo.ogTitle || ""}
                      onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
                    <input
                      type="text"
                      value={seo.ogDescription || ""}
                      onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    className="w-full border rounded-lg p-2.5 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pb-8">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition shadow-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    {editingId
                      ? <><Save size={17} /> Save Blog</>
                      : <><Rocket size={17} /> Create Blog</>}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state when no form is open */}
      {!showForm && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-lg font-medium">Select a blog</p>
            <p className="text-sm mt-1">or create a new blog</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-4 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
            >
              + New Blog
            </button>
          </div>
        </div>
      )}

      {/* ── Media Library Picker ── */}
      <MediaPicker
        open={pickerCallback !== null}
        onClose={() => setPickerCallback(null)}
        onSelect={(item: MediaItem) => {
          pickerCallback?.(item.url);
          setPickerCallback(null);
        }}
        title="Select Image"
      />
    </div>
  );
}
