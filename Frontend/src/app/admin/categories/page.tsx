"use client";
import { adminFetch } from "@/lib/adminAuth";

import React, { useState, useEffect, useMemo } from "react";
import {
  ImagePlus,
  Trash2,
  Plus,
  Edit,
  Settings,
  HelpCircle,
  Layers,
  Save,
  Globe,
  FolderPlus,
  ChevronRight,
  Info,
  Star,
  Home,
  X,
  Search,
  GripVertical,
  FolderTree,
  Link2,
  Unlink
} from "lucide-react";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";
import PlaceholderImage from "@/app/components/PlaceholderImage";

type Faq = { question: string; answer: string };

// Inline FAQ editor — replaces the old browser prompt() flow with proper
// question/answer fields plus an editable list. Reused for the main page,
// catalog and childCategory FAQ sections.
function FaqEditor({
  faqs,
  onChange,
  compact = false,
}: {
  faqs: Faq[];
  onChange: (faqs: Faq[]) => void;
  compact?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const addFaq = () => {
    if (!question.trim() || !answer.trim()) return;
    onChange([...faqs, { question: question.trim(), answer: answer.trim() }]);
    setQuestion("");
    setAnswer("");
  };

  return (
    <div className="space-y-4">
      {/* Existing FAQ list */}
      <div className={`space-y-2 ${compact ? "max-h-[180px] overflow-y-auto pr-1" : ""}`}>
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="border border-zinc-100 rounded-lg p-3.5 bg-zinc-50/40 flex justify-between items-start gap-4"
          >
            <div className="space-y-0.5 min-w-0">
              <h5 className="font-semibold text-xs text-black uppercase tracking-wider break-words">F: {faq.question}</h5>
              <p className="text-xs text-black break-words">A: {faq.answer}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(faqs.filter((_, i) => i !== idx))}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-xs text-zinc-400 py-2 italic">No FAQs added yet.</p>
        )}
      </div>

      {/* Add new FAQ */}
      <div className="border border-dashed border-zinc-200 rounded-lg p-4 bg-zinc-50/30 space-y-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFaq();
            }
          }}
          placeholder="FAQ question…"
          className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-medium"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="FAQ answer…"
          rows={2}
          className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-medium"
        />
        <button
          type="button"
          onClick={addFaq}
          disabled={!question.trim() || !answer.trim()}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>
    </div>
  );
}

// Stable serialization of each tab's persisted fields, used to detect whether
// the form has unsaved changes (current snapshot !== last-saved baseline).
const serializeMain = (v: {
  seoTitle: string;
  seoDescription: string;
  longContent: string;
  faqs: any[];
  sections: any[];
  categories: any[];
}) => JSON.stringify(v);

const serializeCatalog = (v: {
  name: string;
  aliases: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  image: string;
  priceUnder: string;
  featured: boolean;
  faqs: any[];
  childCategories: any[];
}) => JSON.stringify(v);

export default function CategoriesAdmin() {
  const [activeTab, setActiveTab] = useState<"mainPage" | "catalog">("mainPage");

  // Last-saved snapshots of each tab, for unsaved-changes detection.
  const [mainBaseline, setMainBaseline] = useState("");
  const [catalogBaseline, setCatalogBaseline] = useState("");

  // ==========================================
  // TAB 1: KATEGORIE MAIN PAGE STATES
  // ==========================================
  const [mainSeoTitle, setMainSeoTitle] = useState("");
  const [mainSeoDescription, setMainSeoDescription] = useState("");
  const [mainLongContent, setMainLongContent] = useState("");
  const [mainFaqs, setMainFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [mainSections, setMainSections] = useState<{ key: string; title: string; desc: string }[]>([]);
  // One flat, untyped list — the old indoor/outdoor split is retired.
  const [mainCategories, setMainCategories] = useState<{ name: string; slug: string; image: string; featured?: boolean; showOnHome?: boolean }[]>([]);
  const [savingMainSettings, setSavingMainSettings] = useState(false);

  // Modal / Form states for Main Page sections/grids & category groups
  const [editingGroup, setEditingGroup] = useState<{ index: number } | null>(null);
  const [groupForm, setGroupForm] = useState<{ name: string; slug: string; image: string; featured: boolean; showOnHome: boolean }>({ name: "", slug: "", image: "", featured: false, showOnHome: false });
  const [groupImagePreview, setGroupImagePreview] = useState("");

  // Drag-to-reorder state for the category list. List order is the display
  // order on the home page and /categorie, so dragging a tile is what sets a
  // category's position.
  const [draggedGroup, setDraggedGroup] = useState<{ index: number } | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<{ index: number } | null>(null);

  // Media library picker — holds the callback that receives the selected URL.
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => setPickerCallback(() => cb);

  const [editingSec, setEditingSec] = useState<number | null>(null);
  const [secForm, setSecForm] = useState({ key: "", title: "", desc: "" });

  // ==========================================
  // PARENT CATEGORIES STATES
  // ==========================================
  // Parent categories group Category Catalog entries (e.g. "Wohnzimmer" holds
  // "Sofas", "Couchtische", ...). Membership lives on the catalog entry itself
  // (catalogEntry.parentCategoryId) so a category can only ever sit under one
  // parent at a time — assigning it elsewhere automatically un-assigns it here.
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [loadingParentCategories, setLoadingParentCategories] = useState(true);
  const [editingParentCategory, setEditingParentCategory] = useState<{ index: number } | null>(null);
  const [parentCategoryForm, setParentCategoryForm] = useState<{
    name: string;
    slug: string;
    image: string;
    featured: boolean;
    seoTitle: string;
    seoDescription: string;
    description: string;
  }>({ name: "", slug: "", image: "", featured: false, seoTitle: "", seoDescription: "", description: "" });
  const [parentCategoryFaqs, setParentCategoryFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [parentCategoryImagePreview, setParentCategoryImagePreview] = useState("");
  const [savingParentCategory, setSavingParentCategory] = useState(false);
  const [assigningParentId, setAssigningParentId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  // Drag-to-reorder state for the Parent Category grid — mirrors
  // draggedGroup/dragOverGroup used by the Category Lists section, but
  // persists immediately (Parent Categories save per-item, not staged).
  const [draggedParentCategory, setDraggedParentCategory] = useState<{ index: number } | null>(null);
  const [dragOverParentCategory, setDragOverParentCategory] = useState<{ index: number } | null>(null);
  const [parentCategorySearch, setParentCategorySearch] = useState("");
  const [togglingAssignSlug, setTogglingAssignSlug] = useState<string | null>(null);
  const [togglingFeaturedParentId, setTogglingFeaturedParentId] = useState<string | null>(null);

  // ==========================================
  // TAB 2: CATEGORY CATALOG STATES
  // ==========================================
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [selectedCatalogSlug, setSelectedCatalogSlug] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<any>(null);
  const [loadingCatalogList, setLoadingCatalogList] = useState(true);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [creatingNewCatalog, setCreatingNewCatalog] = useState(false);

  // New Catalog Form
  const [newCatForm, setNewCatForm] = useState({ name: "", slug: "" });

  // Search filter for the Category Pages list.
  const [catalogSearch, setCatalogSearch] = useState("");

  // Catalog item editing states
  const [catalogName, setCatalogName] = useState("");
  const [catalogAliases, setCatalogAliases] = useState("");
  const [catalogSeoTitle, setCatalogSeoTitle] = useState("");
  const [catalogSeoDescription, setCatalogSeoDescription] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [catalogImage, setCatalogImage] = useState("");
  const [catalogPriceUnder, setCatalogPriceUnder] = useState("");
  const [catalogFeatured, setCatalogFeatured] = useState(false);
  const [catalogFaqs, setCatalogFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [catalogChildCategories, setCatalogChildCategories] = useState<any[]>([]);

  // ChildCategory modal / form states
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subForm, setSubForm] = useState({
    slug: "",
    name: "",
    imageUrl: "",
    iconName: "Layers",
    seoTitle: "",
    seoDescription: "",
    description: "",
    searchTerms: "",
  });
  const [subImagePreview, setSubImagePreview] = useState("");
  const [subFaqs, setSubFaqs] = useState<{ question: string; answer: string }[]>([]);

  // ==========================================
  // GENERAL INITIALIZATION
  // ==========================================
  useEffect(() => {
    fetchMainSettings();
    fetchCatalogList();
    fetchParentCategories();
  }, []);

  const fetchMainSettings = async () => {
    try {
      const res = await adminFetch(`/api/kategorie-settings?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.success && data.settings ? data.settings : {};
        // Prefer the flat categories[]. Falls back to the legacy
        // indoorCategories/outdoorCategories arrays for any environment that
        // hasn't been migrated yet, merging them into one list. The retired
        // per-item `type` is dropped either way.
        const rawCategories: any[] = Array.isArray(s.categories)
          ? s.categories
          : [
              ...(Array.isArray(s.indoorCategories) ? s.indoorCategories : []),
              ...(Array.isArray(s.outdoorCategories) ? s.outdoorCategories : []),
            ];
        const categories: any[] = rawCategories.map(({ type: _type, ...rest }: any) => rest);
        const loaded = {
          seoTitle: s.seoTitle || "",
          seoDescription: s.seoDescription || "",
          longContent: s.longContent || "",
          faqs: Array.isArray(s.faqs) ? s.faqs : [],
          sections: Array.isArray(s.sections) ? s.sections : [],
          categories,
        };
        setMainSeoTitle(loaded.seoTitle);
        setMainSeoDescription(loaded.seoDescription);
        setMainLongContent(loaded.longContent);
        setMainFaqs(loaded.faqs);
        setMainSections(loaded.sections);
        setMainCategories(loaded.categories);
        setMainBaseline(serializeMain(loaded));
      }
    } catch (err) {
      console.error("Failed to fetch Kategorie main settings:", err);
    }
  };

  const fetchCatalogList = async () => {
    setLoadingCatalogList(true);
    try {
      const res = await adminFetch(`/api/category-catalog?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCatalogList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch catalog list:", err);
      setCatalogList([]);
    } finally {
      setLoadingCatalogList(false);
    }
  };

  const fetchParentCategories = async () => {
    setLoadingParentCategories(true);
    try {
      const res = await adminFetch(`/api/parent-categories?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setParentCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch parent categories:", err);
      setParentCategories([]);
    } finally {
      setLoadingParentCategories(false);
    }
  };

  const fetchCatalogDetails = async (slug: string) => {
    try {
      const res = await adminFetch(`/api/category-catalog/${slug}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.category) {
          const cat = data.category;
          const loaded = {
            name: cat.name || "",
            aliases: Array.isArray(cat.aliases) ? cat.aliases.join(", ") : "",
            seoTitle: cat.seoTitle || "",
            seoDescription: cat.seoDescription || "",
            description: cat.description || "",
            image: cat.image || cat.logo || "",
            priceUnder: cat.priceUnder ? String(cat.priceUnder) : "",
            featured: cat.featured === true || cat.featured === "true",
            faqs: Array.isArray(cat.faqs) ? cat.faqs : [],
            childCategories: Array.isArray(cat.childCategories) ? cat.childCategories : [],
          };
          setSelectedCatalog(cat);
          setCatalogName(loaded.name);
          setCatalogAliases(loaded.aliases);
          setCatalogSeoTitle(loaded.seoTitle);
          setCatalogSeoDescription(loaded.seoDescription);
          setCatalogDescription(loaded.description);
          setCatalogImage(loaded.image);
          setCatalogPriceUnder(loaded.priceUnder);
          setCatalogFeatured(loaded.featured);
          setCatalogFaqs(loaded.faqs);
          setCatalogChildCategories(loaded.childCategories);
          setCatalogBaseline(serializeCatalog(loaded));
        }
      }
    } catch (err) {
      console.error("Failed to fetch catalog details:", err);
    }
  };

  useEffect(() => {
    if (selectedCatalogSlug) {
      fetchCatalogDetails(selectedCatalogSlug);
    } else {
      setSelectedCatalog(null);
      setCatalogBaseline("");
    }
  }, [selectedCatalogSlug]);

  // ==========================================
  // TAB 1 actions (Main Kategorie Settings)
  // ==========================================
  const handleSaveMainSettings = async () => {
    setSavingMainSettings(true);
    try {
      const res = await adminFetch("/api/kategorie-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: mainSeoTitle,
          seoDescription: mainSeoDescription,
          longContent: mainLongContent,
          faqs: mainFaqs,
          sections: mainSections,
          categories: mainCategories,
          // Purge the legacy split arrays (json_patch/merge-patch semantics:
          // a null value deletes the key) now that everything lives in the
          // unified categories[] above.
          indoorCategories: null,
          outdoorCategories: null,
        }),
      });

      if (res.ok) {
        alert("Kategorie Main Page settings saved successfully! ✅");
        fetchMainSettings();
      } else {
        const data = await res.json();
        alert("Failed to save main settings: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving main settings: " + err.message);
    } finally {
      setSavingMainSettings(false);
    }
  };

  const saveGroupItem = async () => {
    if (!groupForm.name || !groupForm.slug) {
      return alert("Name and slug are required");
    }

    if (!editingGroup) return;

    const normalizedSlug = groupForm.slug.trim().toLowerCase();

    if (editingGroup.index >= 0) {
      setMainCategories(mainCategories.map((c, i) => (i === editingGroup.index ? { ...groupForm } : c)));
    } else {
      setMainCategories([...mainCategories, { ...groupForm }]);
    }

    // Also create a matching Category Catalog Manager page (if none exists yet
    // for this slug) so the category is fully manageable in the other tab.
    const catalogExists = catalogList.some(
      (c) => (c.slug || "").toLowerCase() === normalizedSlug
    );
    if (!catalogExists) {
      try {
        const res = await adminFetch("/api/category-catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupForm.name,
            slug: normalizedSlug,
            aliases: [normalizedSlug],
            image: groupForm.image || "",
            featured: !!groupForm.featured,
            showOnHome: !!groupForm.showOnHome,
          }),
        });
        if (res.ok) {
          await fetchCatalogList();
        } else {
          const data = await res.json().catch(() => ({}));
          console.error("Failed to auto-create category catalog page:", data?.error);
        }
      } catch (err) {
        console.error("Failed to auto-create category catalog page:", err);
      }
    }

    setEditingGroup(null);
    setGroupForm({ name: "", slug: "", image: "", featured: false, showOnHome: false });
    setGroupImagePreview("");
  };

  const deleteGroupItem = (idx: number) => {
    if (!confirm("Are you sure you want to delete this category group?")) return;
    setMainCategories(mainCategories.filter((_, i) => i !== idx));
  };

  // ==========================================
  // PARENT CATEGORIES actions
  // ==========================================
  // Parent category CRUD saves immediately (no staged "unsaved changes" bar,
  // unlike the sections above) since it's a separate backend resource, not
  // part of the Kategorie main-page settings blob.
  const saveParentCategory = async () => {
    if (!parentCategoryForm.name.trim() || !parentCategoryForm.slug.trim()) {
      return alert("Name and slug are required");
    }
    const slug = parentCategoryForm.slug.trim().toLowerCase();

    setSavingParentCategory(true);
    try {
      const isEditing = editingParentCategory && editingParentCategory.index >= 0;
      const existing = isEditing ? parentCategories[editingParentCategory!.index] : null;

      const res = await adminFetch(
        isEditing ? `/api/parent-categories/${existing._id}` : "/api/parent-categories",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parentCategoryForm.name.trim(),
            slug,
            image: parentCategoryForm.image || "",
            featured: parentCategoryForm.featured,
            seoTitle: parentCategoryForm.seoTitle,
            seoDescription: parentCategoryForm.seoDescription,
            description: parentCategoryForm.description,
            faqs: parentCategoryFaqs,
          }),
        }
      );

      if (res.ok) {
        await fetchParentCategories();
        setEditingParentCategory(null);
        setParentCategoryForm({ name: "", slug: "", image: "", featured: false, seoTitle: "", seoDescription: "", description: "" });
        setParentCategoryFaqs([]);
        setParentCategoryImagePreview("");
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Failed to save parent category: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving parent category: " + err.message);
    } finally {
      setSavingParentCategory(false);
    }
  };

  const deleteParentCategory = async (parentCategory: any) => {
    if (
      !confirm(
        `Delete parent category "${parentCategory.name}"? Categories assigned to it will become unassigned.`
      )
    )
      return;
    try {
      const res = await adminFetch(`/api/parent-categories/${parentCategory._id}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchParentCategories(), fetchCatalogList()]);
        if (assigningParentId === parentCategory._id) setAssigningParentId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Failed to delete parent category: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error deleting parent category: " + err.message);
    }
  };

  // Quick shortcut for the "featured" flag right on the grid tile — toggles
  // without opening the full Edit modal. Same optimistic-update pattern as
  // assignCategoryToParent below.
  const toggleParentCategoryFeatured = async (pc: any) => {
    setTogglingFeaturedParentId(pc._id);
    const nextFeatured = !pc.featured;
    setParentCategories((prev) =>
      prev.map((p) => (p._id === pc._id ? { ...p, featured: nextFeatured } : p))
    );
    try {
      const res = await adminFetch(`/api/parent-categories/${pc._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });
      if (!res.ok) {
        setParentCategories((prev) =>
          prev.map((p) => (p._id === pc._id ? { ...p, featured: pc.featured } : p))
        );
        const data = await res.json().catch(() => ({}));
        alert("Failed to update featured flag: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setParentCategories((prev) =>
        prev.map((p) => (p._id === pc._id ? { ...p, featured: pc.featured } : p))
      );
      alert("Error updating featured flag: " + err.message);
    } finally {
      setTogglingFeaturedParentId(null);
    }
  };

  // dragover fires continuously, so reuse the previous state object when the
  // hovered tile hasn't changed — a fresh object would re-render on every event.
  const handleDragOverParentCategory = (idx: number) => {
    setDragOverParentCategory((prev) => (prev && prev.index === idx ? prev : { index: idx }));
  };

  // Move a dragged tile to the slot it was dropped on, then persist the new
  // order immediately (Parent Categories save per-item, unlike the Kategorie
  // main-page settings blob, which stages changes until "Save").
  const handleDropParentCategory = async (targetIdx: number) => {
    const dragged = draggedParentCategory;
    setDraggedParentCategory(null);
    setDragOverParentCategory(null);

    if (!dragged || dragged.index === targetIdx) return;

    if (dragged.index < 0 || dragged.index >= parentCategories.length) return;
    if (targetIdx < 0 || targetIdx >= parentCategories.length) return;

    const reordered = [...parentCategories];
    const [moved] = reordered.splice(dragged.index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistic local update so the grid reflects the new order instantly.
    const sortOrderById = new Map(reordered.map((p, i) => [p._id, i]));
    setParentCategories((prev) =>
      prev.map((p) => (sortOrderById.has(p._id) ? { ...p, sortOrder: sortOrderById.get(p._id) } : p))
    );

    try {
      await Promise.all(
        reordered.map((p, i) =>
          adminFetch(`/api/parent-categories/${p._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      );
    } catch (err) {
      console.error("Failed to save parent category order:", err);
    } finally {
      fetchParentCategories();
    }
  };

  // Assigns (or unassigns, when parentId is null) a Category Catalog entry to
  // a parent category. Since parentCategoryId is a single field on the
  // catalog entry, assigning it to a new parent automatically removes it from
  // whichever parent it was previously under — a category can never belong to
  // more than one parent.
  const assignCategoryToParent = async (catalogSlug: string, parentId: string | null) => {
    setTogglingAssignSlug(catalogSlug);
    // Optimistic local update so the checkbox list feels instant.
    const prevList = catalogList;
    setCatalogList((list) =>
      list.map((c) => (c.slug === catalogSlug ? { ...c, parentCategoryId: parentId } : c))
    );
    try {
      const res = await adminFetch(`/api/category-catalog/${catalogSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentCategoryId: parentId }),
      });
      if (!res.ok) {
        setCatalogList(prevList);
        const data = await res.json().catch(() => ({}));
        alert("Failed to update category assignment: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setCatalogList(prevList);
      alert("Error updating category assignment: " + err.message);
    } finally {
      setTogglingAssignSlug(null);
    }
  };

  // dragover fires continuously, so reuse the previous state object when the
  // hovered tile hasn't changed — a fresh object would re-render on every event.
  const handleDragOverGroup = (idx: number) => {
    setDragOverGroup((prev) => (prev && prev.index === idx ? prev : { index: idx }));
  };

  // Move a dragged tile to the slot it was dropped on. Like every other edit
  // on this tab, the new order is staged locally until "Save" is pressed.
  const handleDropGroupItem = (targetIdx: number) => {
    const dragged = draggedGroup;
    setDraggedGroup(null);
    setDragOverGroup(null);

    if (!dragged || dragged.index === targetIdx) return;
    if (dragged.index < 0 || dragged.index >= mainCategories.length) return;
    if (targetIdx < 0 || targetIdx >= mainCategories.length) return;

    const next = [...mainCategories];
    const [moved] = next.splice(dragged.index, 1);
    next.splice(targetIdx, 0, moved);
    setMainCategories(next);
  };

  const saveSectionGrid = () => {
    if (!secForm.key || !secForm.title || !secForm.desc) {
      return alert("All section grid fields are required");
    }

    const list = [...mainSections];
    if (editingSec !== null && editingSec >= 0) {
      list[editingSec] = { ...secForm };
    } else {
      list.push({ ...secForm });
    }

    setMainSections(list);
    setEditingSec(null);
    setSecForm({ key: "", title: "", desc: "" });
  };

  const deleteSectionGrid = (idx: number) => {
    if (!confirm("Are you sure you want to delete this grid section?")) return;
    setMainSections(mainSections.filter((_, i) => i !== idx));
  };

  // ==========================================
  // TAB 2 actions (Category Catalog Manager)
  // ==========================================
  const handleCreateNewCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatForm.name || !newCatForm.slug) {
      return alert("Name and Slug are required!");
    }

    try {
      const res = await adminFetch("/api/category-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatForm.name,
          slug: newCatForm.slug,
          aliases: [newCatForm.slug],
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        alert(
          `Category created ✅\n\nIts page will live at /<parent-category>/${saved.category.slug}. ` +
          `Assign it to a parent category to publish it, then add childCategories, description and SEO below.`
        );
        setCreatingNewCatalog(false);
        await fetchCatalogList();
        setSelectedCatalogSlug(saved.category.slug);
        setNewCatForm({ name: "", slug: "" });
      } else {
        const error = await res.json();
        alert("Failed to create category: " + (error.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveCatalogDetails = async () => {
    if (!selectedCatalogSlug) return;
    setSavingCatalog(true);
    try {
      const aliasesArray = catalogAliases
        .split(",")
        .map(a => a.trim())
        .filter(Boolean);

      const res = await adminFetch(`/api/category-catalog/${selectedCatalogSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catalogName,
          aliases: aliasesArray,
          seoTitle: catalogSeoTitle,
          seoDescription: catalogSeoDescription,
          description: catalogDescription,
          image: catalogImage,
          priceUnder: catalogPriceUnder ? Number(catalogPriceUnder) : 0,
          featured: catalogFeatured,
          faqs: catalogFaqs,
          childCategories: catalogChildCategories,
        }),
      });

      if (res.ok) {
        alert("Category Catalog saved successfully! ✅");
        fetchCatalogDetails(selectedCatalogSlug);
        fetchCatalogList();
      } else {
        const data = await res.json();
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteCatalog = async () => {
    if (!selectedCatalogSlug) return;
    if (!confirm(`Are you sure you want to delete the catalog configuration for ${catalogName}? This cannot be undone!`)) return;

    try {
      const res = await adminFetch(`/api/category-catalog/${selectedCatalogSlug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Category catalog deleted successfully! 🗑️");
        setSelectedCatalogSlug(null);
        fetchCatalogList();
      } else {
        const error = await res.json();
        alert("Failed to delete: " + (error.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const saveChildCategory = () => {
    if (!subForm.name || !subForm.slug) {
      return alert("Child category name and slug are required!");
    }

    const termsArray = subForm.searchTerms
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const formattedSub = {
      ...subForm,
      searchTerms: termsArray,
      faqs: subFaqs,
    };

    const list = [...catalogChildCategories];
    if (editingSubIndex !== null && editingSubIndex >= 0) {
      list[editingSubIndex] = formattedSub;
    } else {
      list.push(formattedSub);
    }

    setCatalogChildCategories(list);
    setEditingSubIndex(null);
    setSubForm({
      slug: "",
      name: "",
      imageUrl: "",
      iconName: "Layers",
      seoTitle: "",
      seoDescription: "",
      description: "",
      searchTerms: "",
    });
    setSubImagePreview("");
    setSubFaqs([]);
  };

  const deleteChildCategory = (idx: number) => {
    if (!confirm("Are you sure you want to delete this child category?")) return;
    setCatalogChildCategories(catalogChildCategories.filter((_, i) => i !== idx));
  };

  // ==========================================
  // UNSAVED-CHANGES DETECTION
  // ==========================================
  const mainSnapshot = useMemo(
    () =>
      serializeMain({
        seoTitle: mainSeoTitle,
        seoDescription: mainSeoDescription,
        longContent: mainLongContent,
        faqs: mainFaqs,
        sections: mainSections,
        categories: mainCategories,
      }),
    [mainSeoTitle, mainSeoDescription, mainLongContent, mainFaqs, mainSections, mainCategories]
  );

  const catalogSnapshot = useMemo(
    () =>
      serializeCatalog({
        name: catalogName,
        aliases: catalogAliases,
        seoTitle: catalogSeoTitle,
        seoDescription: catalogSeoDescription,
        description: catalogDescription,
        image: catalogImage,
        priceUnder: catalogPriceUnder,
        featured: catalogFeatured,
        faqs: catalogFaqs,
        childCategories: catalogChildCategories,
      }),
    [catalogName, catalogAliases, catalogSeoTitle, catalogSeoDescription, catalogDescription, catalogImage, catalogPriceUnder, catalogFeatured, catalogFaqs, catalogChildCategories]
  );

  // Category Catalog entries grouped by the parent category they're assigned
  // to, keyed by parent _id — drives the "N categories" count and the
  // assignment checklist.
  const categoriesByParentId = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const cat of catalogList) {
      if (!cat.parentCategoryId) continue;
      const arr = map.get(cat.parentCategoryId) || [];
      arr.push(cat);
      map.set(cat.parentCategoryId, arr);
    }
    return map;
  }, [catalogList]);

  // Case-insensitive filter of the Parent Categories grid by name or slug.
  // When a search is active, non-matches are hidden but drag-reordering is
  // disabled (see the tile's `draggable` prop) since reordering a filtered
  // subset can't be mapped back to a stable full-list order.
  const visibleParentCategories = useMemo(() => {
    const q = parentCategorySearch.trim().toLowerCase();
    if (!q) return parentCategories;
    return parentCategories.filter(
      (p) => (p.name || "").toLowerCase().includes(q) || (p.slug || "").toLowerCase().includes(q)
    );
  }, [parentCategories, parentCategorySearch]);

  // Search filter for the parent-category assignment checklist. Every catalog
  // entry is assignable to every parent — parents are one flat list now, so
  // there is no Indoor/Outdoor type to match against.
  const assignableCatalogList = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return catalogList;
    return catalogList.filter(
      (c) => (c.name || "").toLowerCase().includes(q) || (c.slug || "").toLowerCase().includes(q)
    );
  }, [catalogList, assignSearch]);

  // Case-insensitive filter of the Category Pages list by name or slug.
  const filteredCatalogList = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogList;
    return catalogList.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.slug || "").toLowerCase().includes(q)
    );
  }, [catalogList, catalogSearch]);

  const mainDirty = mainBaseline !== "" && mainSnapshot !== mainBaseline;
  const catalogDirty = !!selectedCatalog && catalogBaseline !== "" && catalogSnapshot !== catalogBaseline;
  const hasUnsavedChanges = mainDirty || catalogDirty;

  // Warn before closing/reloading the browser tab if anything is unsaved.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Warn when leaving a tab that has unsaved changes.
  const switchTab = (next: "mainPage" | "catalog") => {
    if (next === activeTab) return;
    const leavingDirty = activeTab === "mainPage" ? mainDirty : catalogDirty;
    if (
      leavingDirty &&
      !confirm("You have unsaved changes on this tab. Discard them and switch tabs?")
    ) {
      return;
    }
    setActiveTab(next);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 hidden -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Categories Manager</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            Configure layout of `/categorie` main page, and manage metadata, FAQs, and childCategories for individual main category pages.
          </p>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex flex-wrap bg-zinc-200/50 backdrop-blur-md p-1 rounded-lg max-w-2xl gap-1">
        <button
          onClick={() => switchTab("mainPage")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "mainPage" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Kategorie Main Page
          {mainDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />}
        </button>
        <button
          onClick={() => switchTab("catalog")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "catalog" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Category Catalog Manager
          {catalogDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />}
        </button>
      </div>

      {/* TAB 1: KATEGORIE MAIN PAGE SETTINGS */}
      {activeTab === "mainPage" && (
        <div className="space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-600" />
              General SEO & Info Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Title</label>
                <input
                  type="text"
                  value={mainSeoTitle}
                  onChange={(e) => setMainSeoTitle(e.target.value)}
                  placeholder="e.g. Kategorien | NL FURNITURE"
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Description / Meta</label>
                <input
                  type="text"
                  value={mainSeoDescription}
                  onChange={(e) => setMainSeoDescription(e.target.value)}
                  placeholder="Meta description text..."
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Long Content (At bottom of /categorie)</label>
              <textarea
                value={mainLongContent}
                onChange={(e) => setMainLongContent(e.target.value)}
                placeholder="Write description text..."
                rows={5}
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium whitespace-pre-line"
              />
            </div>
          </div>

          {/* Grids Layout */}
          <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              Product Sections / Grids
            </h3>

            {/* List sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mainSections.map((sec, idx) => (
                <div key={sec.key} className="border border-zinc-100 bg-zinc-50/50 rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-900">{sec.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Slug: <span className="font-semibold text-primary-600">{sec.key}</span></p>
                    <p className="text-xs text-zinc-400 mt-1">{sec.desc}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSec(idx);
                        setSecForm({ ...sec });
                      }}
                      className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSectionGrid(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {mainSections.length === 0 && (
                <p className="text-xs text-zinc-400 col-span-2 py-4">No grids configured. Static defaults will show.</p>
              )}
            </div>

            {/* Grid Form */}
            <div className="border border-dashed border-zinc-200 rounded-lg p-5 bg-zinc-50/30 space-y-4">
              <h4 className="font-semibold text-xs text-zinc-800 uppercase tracking-wider">
                {editingSec !== null ? "Edit Section Grid" : "Add Section Grid"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Key (e.g. sofas, beds)"
                  value={secForm.key}
                  onChange={(e) => setSecForm(prev => ({ ...prev, key: e.target.value }))}
                  className="border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none bg-white font-medium"
                />
                <input
                  type="text"
                  placeholder="Display Title (e.g. Sofas)"
                  value={secForm.title}
                  onChange={(e) => setSecForm(prev => ({ ...prev, title: e.target.value }))}
                  className="border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none bg-white font-medium"
                />
                <input
                  type="text"
                  placeholder="Short Description"
                  value={secForm.desc}
                  onChange={(e) => setSecForm(prev => ({ ...prev, desc: e.target.value }))}
                  className="border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none bg-white font-medium"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSectionGrid}
                  className="bg-primary-600 text-white hover:bg-primary-700 text-[11px] font-semibold uppercase tracking-wider py-2.5 px-6 rounded-xl transition"
                >
                  Save Section Grid
                </button>
                {editingSec !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSec(null);
                      setSecForm({ key: "", title: "", desc: "" });
                    }}
                    className="border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider py-2.5 px-6 rounded-xl transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Parent Categories — group Category Catalog pages under a top-level parent */}
          <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-8">
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary-600" />
                Parent Categories
              </h3>
              <p className="text-xs text-zinc-500 max-w-2xl">
                Group Category Catalog pages under a higher-level parent (e.g. "Wohnzimmer" holding "Sofas", "Couchtische"…).
                A category can only belong to one parent at a time. Drag a tile onto another to reorder it — Featured parent
                categories (star) appear, in this order, on the home page, /categorie and /kortingscodes.
              </p>
            </div>

            {/* Search filter */}
            {!loadingParentCategories && parentCategories.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={parentCategorySearch}
                  onChange={(e) => setParentCategorySearch(e.target.value)}
                  placeholder="Search parent categories…"
                  className="w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
                {parentCategorySearch && (
                  <button
                    type="button"
                    onClick={() => setParentCategorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {parentCategorySearch && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1.5">Clear the search to drag-reorder tiles.</p>
                )}
              </div>
            )}

            {loadingParentCategories ? (
              <p className="text-xs text-zinc-400">Loading parent categories...</p>
            ) : parentCategories.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2 italic">No parent categories yet. Add one to start grouping categories.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-semibold text-sm text-zinc-900">All Parent Categories</h4>
                  <button
                    onClick={() => {
                      setEditingParentCategory({ index: -1 });
                      setParentCategoryForm({ name: "", slug: "", image: "", featured: false, seoTitle: "", seoDescription: "", description: "" });
                      setParentCategoryFaqs([]);
                      setParentCategoryImagePreview("");
                    }}
                    className="bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Parent Category
                  </button>
                </div>

                      {visibleParentCategories.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-2 italic">No matches.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                          {visibleParentCategories.map((pc, idx) => {
                            const realIdx = parentCategories.findIndex((p) => p._id === pc._id);
                            const assigned = categoriesByParentId.get(pc._id) || [];
                            const draggable = !parentCategorySearch;
                            return (
                              <div
                                key={pc._id}
                                draggable={draggable}
                                onDragStart={() => draggable && setDraggedParentCategory({ index: idx })}
                                onDragEnd={() => { setDraggedParentCategory(null); setDragOverParentCategory(null); }}
                                onDragOver={(e) => { if (draggable) { e.preventDefault(); handleDragOverParentCategory(idx); } }}
                                onDrop={(e) => { if (draggable) { e.preventDefault(); handleDropParentCategory(idx); } }}
                                className={`relative group border bg-zinc-50 rounded-xl p-3 flex flex-col items-center text-center shadow-xs transition ${
                                  draggable ? "cursor-grab active:cursor-grabbing" : ""
                                } ${
                                  draggedParentCategory?.index === idx
                                    ? "opacity-40 border-zinc-100"
                                    : dragOverParentCategory?.index === idx && draggedParentCategory
                                    ? "border-primary-500 ring-2 ring-primary-500/30"
                                    : "border-zinc-100"
                                }`}
                              >
                                <div className="absolute top-2 left-2 flex items-center gap-1">
                                  <span className="flex items-center gap-0.5 rounded bg-zinc-900/80 text-white text-[9px] font-bold pl-0.5 pr-1.5 py-0.5" title="Drag to change the display order">
                                    <GripVertical className="w-3 h-3" />
                                    {idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleParentCategoryFeatured(pc);
                                    }}
                                    disabled={togglingFeaturedParentId === pc._id}
                                    className={`p-0.5 rounded transition disabled:opacity-50 ${
                                      pc.featured ? "" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                    title={pc.featured ? "Featured — click to unfeature" : "Click to feature"}
                                  >
                                    <Star
                                      className={`w-3.5 h-3.5 ${
                                        pc.featured
                                          ? "fill-amber-400 text-amber-400"
                                          : "fill-none text-zinc-400 hover:text-amber-400"
                                      }`}
                                    />
                                  </button>
                                </div>
                                <div className="w-16 h-16 bg-white rounded-lg border border-zinc-100 flex items-center justify-center overflow-hidden mb-2">
                                  {pc.image ? (
                                    <img src={pc.image} draggable={false} className="object-contain w-full h-full p-1" />
                                  ) : (
                                    <FolderTree className="w-6 h-6 text-zinc-300" />
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-zinc-950 line-clamp-1">{pc.name}</span>
                                <span className="text-[9px] text-zinc-400 mt-0.5">/{pc.slug}</span>
                                <span className="text-[9px] text-primary-600 font-semibold mt-0.5">
                                  {assigned.length} categor{assigned.length === 1 ? "y" : "ies"}
                                </span>
                                {assigned.length > 0 && (
                                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                                    {assigned.slice(0, 4).map((c) => (
                                      <span key={c.slug} className="text-[8px] font-semibold bg-white border border-zinc-200 text-zinc-600 rounded-full px-1.5 py-0.5">
                                        {c.name}
                                      </span>
                                    ))}
                                    {assigned.length > 4 && (
                                      <span className="text-[8px] font-semibold text-zinc-400 px-0.5 py-0.5">+{assigned.length - 4}</span>
                                    )}
                                  </div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-md rounded-md p-1 shadow">
                                  <button
                                    onClick={() => {
                                      setAssigningParentId(pc._id);
                                      setAssignSearch("");
                                    }}
                                    className="text-zinc-600 hover:text-black p-0.5"
                                    title="Assign Categories"
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingParentCategory({ index: realIdx });
                                      setParentCategoryForm({
                                        name: pc.name,
                                        slug: pc.slug,
                                        image: pc.image || "",
                                        featured: !!pc.featured,
                                        seoTitle: pc.seoTitle || "",
                                        seoDescription: pc.seoDescription || "",
                                        description: pc.description || "",
                                      });
                                      setParentCategoryFaqs(Array.isArray(pc.faqs) ? pc.faqs : []);
                                      setParentCategoryImagePreview(pc.image || "");
                                    }}
                                    className="text-zinc-600 hover:text-black p-0.5"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteParentCategory(pc)}
                                    className="text-red-500 hover:text-red-700 p-0.5"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
              </div>
            )}

            {/* Parent Category Add/Edit Modal */}
            {editingParentCategory && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full border border-zinc-100 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h4 className="font-semibold text-zinc-900 text-lg uppercase tracking-wider">
                      {editingParentCategory.index >= 0 ? "Edit Parent Category" : "Add Parent Category"}
                    </h4>
                    <button onClick={() => setEditingParentCategory(null)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Featured flag — controls visibility (and, via drag order, position)
                      in the curated parent-category section on the home page, /categorie
                      and /kortingscodes. Non-featured parent categories are still usable
                      as grouping for their assigned categories. */}
                  <label className="flex items-start gap-3 bg-primary-50/40 border border-primary-100 rounded-xl p-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={parentCategoryForm.featured}
                      onChange={(e) => setParentCategoryForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-primary-600 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider block">
                        Featured
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        Show this parent category on the home page, /categorie and /kortingscodes — ordered by its drag position above.
                      </span>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={parentCategoryForm.name}
                        onChange={(e) => setParentCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Wohnzimmer"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Slug Path</label>
                      <input
                        type="text"
                        value={parentCategoryForm.slug}
                        onChange={(e) => setParentCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g. wohnzimmer"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Title</label>
                      <input
                        type="text"
                        value={parentCategoryForm.seoTitle}
                        onChange={(e) => setParentCategoryForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder="Title for browser tab..."
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Description / Meta</label>
                      <input
                        type="text"
                        value={parentCategoryForm.seoDescription}
                        onChange={(e) => setParentCategoryForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder="Search engine snippet..."
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Long Content (Displayed at the bottom)</label>
                    <textarea
                      value={parentCategoryForm.description}
                      onChange={(e) => setParentCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write description/SEO text..."
                      rows={4}
                      className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Icon / Image (optional)</label>
                    <button
                      type="button"
                      onClick={() => openPicker((url) => { setParentCategoryForm(prev => ({ ...prev, image: url })); setParentCategoryImagePreview(url); })}
                      className="relative w-full border-2 border-dashed border-zinc-200 hover:border-primary-400 rounded-lg p-4 min-h-[100px] bg-zinc-50 hover:bg-zinc-100/60 flex flex-col items-center justify-center overflow-hidden transition"
                    >
                      {parentCategoryImagePreview ? (
                        <img src={parentCategoryImagePreview} className="absolute inset-0 w-full h-full object-contain p-2 z-10" />
                      ) : null}
                      <div className="relative z-20 flex flex-col items-center text-center p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xs border">
                        <ImagePlus className="w-5 h-5 text-zinc-500 mb-1" />
                        <span className="text-[10px] font-semibold text-zinc-900">Choose Icon</span>
                        <span className="text-[8px] text-zinc-400 mt-0.5">From media library</span>
                      </div>
                    </button>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h5 className="font-semibold text-[11px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-primary-600" /> FAQs
                    </h5>
                    <FaqEditor faqs={parentCategoryFaqs} onChange={setParentCategoryFaqs} compact />
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    <button
                      type="button"
                      onClick={saveParentCategory}
                      disabled={savingParentCategory}
                      className="flex-grow bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl transition"
                    >
                      {savingParentCategory ? "Saving..." : "Save Parent Category"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingParentCategory(null)}
                      className="border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assign Categories Modal */}
            {assigningParentId && (() => {
              const parent = parentCategories.find(p => p._id === assigningParentId);
              if (!parent) return null;
              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-6 max-w-lg w-full border border-zinc-100 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
                    <div className="flex justify-between items-center pb-2 border-b flex-shrink-0">
                      <h4 className="font-semibold text-zinc-900 text-lg uppercase tracking-wider">
                        Assign Categories to {parent.name}
                      </h4>
                      <button onClick={() => setAssigningParentId(null)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative flex-shrink-0">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search categories…"
                        className="w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5 overflow-y-auto pr-1 flex-grow">
                      {assignableCatalogList.length === 0 && (
                        <p className="text-xs text-zinc-400 py-4 text-center">No categories match.</p>
                      )}
                      {assignableCatalogList.map((cat) => {
                        const isInThisParent = cat.parentCategoryId === parent._id;
                        const otherParent = !isInThisParent && cat.parentCategoryId
                          ? parentCategories.find(p => p._id === cat.parentCategoryId)
                          : null;
                        const busy = togglingAssignSlug === cat.slug;
                        return (
                          <label
                            key={cat.slug}
                            className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              isInThisParent ? "bg-primary-50/60 border-primary-200" : "bg-zinc-50/50 border-zinc-100 hover:bg-zinc-100/60"
                            } ${busy ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isInThisParent}
                                onChange={(e) => assignCategoryToParent(cat.slug, e.target.checked ? parent._id : null)}
                                className="w-4 h-4 accent-primary-600 cursor-pointer flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-semibold text-zinc-900 truncate">{cat.name}</span>
                                </div>
                                {otherParent && (
                                  <span className="text-[9px] text-amber-600 font-medium block">
                                    Currently in "{otherParent.name}" — checking moves it here
                                  </span>
                                )}
                              </div>
                            </div>
                            {isInThisParent && <Unlink className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex-shrink-0 border-t pt-4">
                      <button
                        type="button"
                        onClick={() => setAssigningParentId(null)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl transition"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Category Group Slider */}
          <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-8">
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600" />
                Category Lists (Slider/Grids)
              </h3>
              <p className="text-xs text-zinc-500">
                The numbered order is the order categories appear on the home page, /categorie and
                /kortingscodes. Drag a tile onto another to reorder it, then press Save.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-semibold text-sm text-zinc-900">Categories</h4>
                <button
                  onClick={() => {
                    setEditingGroup({ index: -1 });
                    setGroupForm({ name: "", slug: "", image: "", featured: false, showOnHome: false });
                    setGroupImagePreview("");
                  }}
                  className="bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {mainCategories.map((cat, idx) => (
                  <div
                    key={cat.slug + idx}
                    draggable
                    onDragStart={() => setDraggedGroup({ index: idx })}
                    onDragEnd={() => { setDraggedGroup(null); setDragOverGroup(null); }}
                    onDragOver={(e) => { e.preventDefault(); handleDragOverGroup(idx); }}
                    onDrop={(e) => { e.preventDefault(); handleDropGroupItem(idx); }}
                    className={`relative group border bg-zinc-50 rounded-xl p-3 flex flex-col items-center text-center shadow-xs cursor-grab active:cursor-grabbing transition ${
                      draggedGroup?.index === idx
                        ? "opacity-40 border-zinc-100"
                        : dragOverGroup?.index === idx && draggedGroup
                        ? "border-primary-500 ring-2 ring-primary-500/30"
                        : "border-zinc-100"
                    }`}
                  >
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="flex items-center gap-0.5 rounded bg-zinc-900/80 text-white text-[9px] font-bold pl-0.5 pr-1.5 py-0.5" title="Drag to change the home page order">
                        <GripVertical className="w-3 h-3" />
                        {idx + 1}
                      </span>
                      {cat.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      {cat.showOnHome && <Home className="w-3.5 h-3.5 text-primary-600" />}
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg border border-zinc-100 flex items-center justify-center overflow-hidden mb-2">
                      <PlaceholderImage src={cat.image} alt={cat.name} width={64} height={64} className="object-contain w-full h-full p-1" iconClassName="w-1/2 h-1/2" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-950 line-clamp-1">{cat.name}</span>
                    <span className="text-[9px] text-zinc-400 mt-0.5">/{cat.slug}</span>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-md rounded-md p-1 shadow">
                      <button
                        onClick={() => {
                          setEditingGroup({ index: idx });
                          setGroupForm({ featured: false, showOnHome: false, ...cat });
                          setGroupImagePreview(cat.image);
                        }}
                        className="text-zinc-600 hover:text-black p-0.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGroupItem(idx)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Group Modal / Overlay */}
            {editingGroup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full border border-zinc-100 shadow-xl space-y-5">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h4 className="font-semibold text-zinc-900 text-lg uppercase tracking-wider">
                      {editingGroup.index >= 0 ? "Edit Item" : "Add Item"}
                    </h4>
                    <button onClick={() => setEditingGroup(null)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Category Name</label>
                      <input
                        type="text"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Betten"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Slug Path</label>
                      <input
                        type="text"
                        value={groupForm.slug}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g. beds"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                      />
                    </div>

                    {/* Image Upload for Category Group */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        Category Icon
                      </label>
                      {/* size badge */}
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-[11px] font-semibold">
                        <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        Recommended: <strong>120 × 120 px</strong>&nbsp;(Square)
                      </div>
                      <button
                        type="button"
                        onClick={() => openPicker((url) => { setGroupForm(prev => ({ ...prev, image: url })); setGroupImagePreview(url); })}
                        className="relative w-full border-2 border-dashed border-zinc-200 hover:border-primary-400 rounded-lg p-4 min-h-[120px] bg-zinc-50 hover:bg-zinc-100/60 flex flex-col items-center justify-center overflow-hidden transition"
                      >
                        {groupImagePreview ? (
                          <img src={groupImagePreview} className="absolute inset-0 w-full h-full object-contain p-2 z-10" />
                        ) : null}

                        <div className="relative z-20 flex flex-col items-center text-center p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xs border">
                          <ImagePlus className="w-5 h-5 text-zinc-500 mb-1" />
                          <span className="text-[10px] font-semibold text-zinc-900">Choose Icon</span>
                          <span className="text-[8px] text-zinc-400 mt-0.5">From media library</span>
                        </div>
                      </button>
                    </div>

                    {/* Featured toggle */}
                    <label className="flex items-start gap-3 bg-primary-50/40 border border-primary-100 rounded-xl p-3.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!groupForm.featured}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, featured: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 accent-primary-600 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider block">
                          Featured Category
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          Highlight this category in featured category listings.
                        </span>
                      </div>
                    </label>

                    {/* Show on home page toggle */}
                    <label className="flex items-start gap-3 bg-primary-50/40 border border-primary-100 rounded-xl p-3.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!groupForm.showOnHome}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, showOnHome: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 accent-primary-600 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider block">
                          Show on Home Page
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          Display this category in the home page category grid.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    <button
                      type="button"
                      onClick={saveGroupItem}
                      className="flex-grow bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl transition"
                    >
                      Save Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroup(null)}
                      className="border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Page FAQs */}
          <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
            <div className="border-b pb-3">
              <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-600" />
                Kategorie Page FAQs
              </h3>
            </div>

            <FaqEditor faqs={mainFaqs} onChange={setMainFaqs} />
          </div>

          {/* SAVE BAR (sticky) */}
          <div className="sticky bottom-4 z-30 flex items-center justify-end gap-3 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-xl px-4 py-3 shadow-lg">
            {mainDirty ? (
              <span className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="mr-auto text-xs font-medium text-zinc-400">All changes saved</span>
            )}
            <button
              onClick={handleSaveMainSettings}
              disabled={savingMainSettings || !mainDirty}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              {savingMainSettings ? "Saving Settings..." : "Save Main Page Settings"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY CATALOG MANAGER */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMN 1: CATEGORIES SELECTOR / ADD */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-zinc-150 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-zinc-950 text-md flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-primary-600" />
                  Category Pages
                </h3>
                <button
                  onClick={() => setCreatingNewCatalog(true)}
                  className="bg-primary-50 text-primary-700 hover:bg-primary-100 p-1.5 rounded-lg transition"
                  title="Create new Category catalog entry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search filter */}
              {!loadingCatalogList && catalogList.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search categories…"
                    className="w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* List */}
              {loadingCatalogList ? (
                <p className="text-xs text-zinc-400">Loading catalog list...</p>
              ) : (
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {filteredCatalogList.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        if (cat.slug === selectedCatalogSlug) return;
                        if (
                          catalogDirty &&
                          !confirm("You have unsaved changes on this category. Discard them and switch?")
                        ) {
                          return;
                        }
                        setSelectedCatalogSlug(cat.slug);
                        setCreatingNewCatalog(false);
                      }}
                      className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl transition font-medium text-xs ${
                        selectedCatalogSlug === cat.slug
                          ? "bg-primary-600 text-white shadow-sm font-semibold"
                          : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {(cat.featured === true || cat.featured === "true") && (
                          <Star className={`w-3.5 h-3.5 flex-shrink-0 ${selectedCatalogSlug === cat.slug ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                        )}
                        {cat.name} ({cat.childCategories?.length || 0})
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                  {catalogList.length === 0 && (
                    <p className="text-xs text-zinc-400 py-4">No category catalog configured yet.</p>
                  )}
                  {catalogList.length > 0 && filteredCatalogList.length === 0 && (
                    <p className="text-xs text-zinc-400 py-4">No categories match “{catalogSearch}”.</p>
                  )}
                </div>
              )}
            </div>

            {/* CREATE NEW DIALOG CONTAINER */}
            {creatingNewCatalog && (
              <div className="bg-white rounded-xl border border-zinc-150 p-6 shadow-sm space-y-4">
                <h4 className="font-semibold text-zinc-950 text-sm uppercase tracking-wider flex items-center gap-1">
                  <FolderPlus className="w-4 h-4 text-primary-600" />
                  Create Category Page
                </h4>
                <form onSubmit={handleCreateNewCatalog} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Betten"
                      value={newCatForm.name}
                      onChange={(e) => setNewCatForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Category Slug (lowercase, URL path)</label>
                    <input
                      type="text"
                      placeholder="e.g. beds"
                      value={newCatForm.slug}
                      onChange={(e) => setNewCatForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Create Category Catalog Page
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* COLUMN 2 & 3: DETAILS EDITOR */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedCatalog ? (
              <div className="bg-white rounded-xl border border-zinc-150 p-12 shadow-sm text-center">
                <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h4 className="font-semibold text-zinc-900">Select Category Catalog</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-2">
                  Select an existing Category catalog from the list on the left to edit its details, manage childCategories, long content, FAQs, and SEO configurations.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Auto-created page notice + empty-data warning */}
                {(() => {
                  const isEmpty =
                    catalogChildCategories.length === 0 &&
                    !catalogDescription.trim() &&
                    !catalogSeoTitle.trim() &&
                    !catalogSeoDescription.trim();
                  // Public URL is /<parentSlug>/<categorySlug>. A category with
                  // no parent assigned has no public page at all, so we say so
                  // instead of linking somewhere that 404s.
                  const catalogParent = parentCategories.find(
                    (p) => p._id === selectedCatalog?.parentCategoryId
                  );
                  const publicHref = catalogParent
                    ? `/${catalogParent.slug}/${selectedCatalogSlug}`
                    : null;
                  return (
                    <div className={`rounded-xl border p-4 flex items-start gap-3 ${!publicHref || isEmpty ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                      <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!publicHref || isEmpty ? "text-amber-600" : "text-emerald-600"}`} />
                      <div className="space-y-1">
                        <p className={`text-sm font-semibold ${!publicHref || isEmpty ? "text-amber-800" : "text-emerald-800"}`}>
                          {!publicHref
                            ? "⚠️ This category has no public page yet"
                            : isEmpty
                            ? "⚠️ This category page is live but mostly empty"
                            : "This category page is live"}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {!publicHref
                            ? `Category pages live at /<parent-category>/${selectedCatalogSlug}. Assign "${catalogName}" to a parent category below — until then the page returns 404.`
                            : isEmpty
                            ? `The public page ${publicHref} already exists and shows the title "${catalogName}", but has no childCategories, description or SEO yet. Add content below so visitors see useful information.`
                            : "Changes you save here are reflected on the public page."}
                        </p>
                        {publicHref && (
                          <a
                            href={publicHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                          >
                            View live page ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 1. Meta / Aliases Settings */}
                <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary-600" />
                      Configure Category: <span className="underline text-primary-600 font-semibold">{catalogName}</span>
                    </h3>
                    <button
                      onClick={handleDeleteCatalog}
                      className="bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Page
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Display Name</label>
                      <input
                        type="text"
                        value={catalogName}
                        onChange={(e) => setCatalogName(e.target.value)}
                        className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Aliases (comma-separated)</label>
                      <input
                        type="text"
                        value={catalogAliases}
                        onChange={(e) => setCatalogAliases(e.target.value)}
                        placeholder="e.g. bed, betten, bett"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Title</label>
                      <input
                        type="text"
                        value={catalogSeoTitle}
                        onChange={(e) => setCatalogSeoTitle(e.target.value)}
                        placeholder="Title for browser tab..."
                        className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Description / Meta Description</label>
                      <input
                        type="text"
                        value={catalogSeoDescription}
                        onChange={(e) => setCatalogSeoDescription(e.target.value)}
                        placeholder="Search engine snippet..."
                        className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Category logo/image — shown on the budget tile and category header */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Category Logo / Image</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openPicker((url) => setCatalogImage(url))}
                        className="flex items-center gap-2 border border-dashed border-zinc-300 rounded-xl px-4 py-2.5 text-sm text-zinc-600 hover:border-primary-400 hover:bg-zinc-50 transition"
                      >
                        <ImagePlus className="w-4 h-4" /> Choose from Library
                      </button>
                      {catalogImage && (
                        <div className="flex items-center gap-2">
                          <img src={catalogImage} alt="category" className="w-12 h-12 object-contain rounded-lg border border-zinc-200" />
                          <button
                            type="button"
                            onClick={() => setCatalogImage("")}
                            className="text-[10px] text-red-500 hover:underline font-semibold uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured flag — marks this category as featured (e.g. on the homepage) */}
                  <label className="flex items-start gap-3 bg-primary-50/40 border border-primary-100 rounded-xl p-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={catalogFeatured}
                      onChange={(e) => setCatalogFeatured(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary-600 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider block">
                        Featured Category
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        Mark this category as featured so it can be highlighted in featured category listings.
                      </span>
                    </div>
                  </label>

                  {/* Budget quick-filter — shows a "unter X €" tile on the category page */}
                  <div className="space-y-1 bg-primary-50/40 border border-primary-100 rounded-xl p-4">
                    <label className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider">
                      Budget Filter — Max Price (€)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
                        <input
                          type="number"
                          min="0"
                          value={catalogPriceUnder}
                          onChange={(e) => setCatalogPriceUnder(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full border border-zinc-200 rounded-xl p-3 pl-7 text-sm focus:outline-none focus:ring-2 font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Shows a <span className="font-semibold">"{catalogName || "Kategorie"} unter {catalogPriceUnder || "…"} €"</span> tile that filters products under this price. Leave 0/empty to hide.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Long Content (Displayed at the bottom)</label>
                    <textarea
                      value={catalogDescription}
                      onChange={(e) => setCatalogDescription(e.target.value)}
                      placeholder="Write description/SEO text..."
                      rows={5}
                      className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 font-medium"
                    />
                  </div>
                </div>

                {/* 2. ChildCategories Manager */}
                <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary-600" />
                      ChildCategories List
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubIndex(-1);
                        setSubForm({
                          slug: "",
                          name: "",
                          imageUrl: "",
                          iconName: "Layers",
                          seoTitle: "",
                          seoDescription: "",
                          description: "",
                          searchTerms: "",
                        });
                        setSubImagePreview("");
                        setSubFaqs([]);
                      }}
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition"
                    >
                      <Plus className="w-4 h-4" /> Add ChildCategory
                    </button>
                  </div>

                  {/* List childCategories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catalogChildCategories.map((sub, idx) => (
                      <div key={sub.slug + idx} className="relative group border border-zinc-100 rounded-lg p-4 bg-zinc-50/50 flex gap-3.5 items-start">
                        <div className="w-14 h-14 bg-white rounded-xl border border-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <PlaceholderImage src={sub.imageUrl} alt={sub.name} width={56} height={56} className="object-contain w-full h-full p-1" iconClassName="w-1/2 h-1/2" />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">{sub.name}</h5>
                          <p className="text-[10px] text-zinc-500">Slug: <span className="font-semibold text-primary-600">/{sub.slug}</span></p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{sub.description}</p>
                        </div>

                        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-md rounded-md p-1 shadow">
                          <button
                            onClick={() => {
                              setEditingSubIndex(idx);
                              setSubForm({
                                ...sub,
                                searchTerms: Array.isArray(sub.searchTerms) ? sub.searchTerms.join(", ") : "",
                              });
                              setSubImagePreview(sub.imageUrl);
                              setSubFaqs(Array.isArray(sub.faqs) ? sub.faqs : []);
                            }}
                            className="text-zinc-600 hover:text-black p-0.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteChildCategory(idx)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {catalogChildCategories.length === 0 && (
                      <p className="text-xs text-zinc-400 py-4 col-span-2">No child categories added yet.</p>
                    )}
                  </div>

                  {/* ChildCategory Edit Modal */}
                  {editingSubIndex !== null && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl p-6 max-w-2xl w-full border border-zinc-100 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <h4 className="font-semibold text-zinc-900 text-lg uppercase tracking-wider">
                            {editingSubIndex >= 0 ? "Edit Child Category" : "Add Child Category"}
                          </h4>
                          <button onClick={() => setEditingSubIndex(null)} className="text-zinc-400 hover:text-zinc-600">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Child Category Name</label>
                            <input
                              type="text"
                              value={subForm.name}
                              onChange={(e) => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Etagenbetten"
                              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Child Category Slug</label>
                            <input
                              type="text"
                              value={subForm.slug}
                              onChange={(e) => setSubForm(prev => ({ ...prev, slug: e.target.value }))}
                              placeholder="e.g. etagenbetten"
                              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Title</label>
                            <input
                              type="text"
                              value={subForm.seoTitle}
                              onChange={(e) => setSubForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                              placeholder="Browser page title..."
                              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Search Terms (comma-separated)</label>
                            <input
                              type="text"
                              value={subForm.searchTerms}
                              onChange={(e) => setSubForm(prev => ({ ...prev, searchTerms: e.target.value }))}
                              placeholder="e.g. bunk bed, stockbett, hochbett"
                              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Description / Meta</label>
                          <input
                            type="text"
                            value={subForm.seoDescription}
                            onChange={(e) => setSubForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                            className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Description (Long content text)</label>
                          <textarea
                            value={subForm.description}
                            onChange={(e) => setSubForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 font-medium"
                          />
                        </div>

                        {/* ChildCategory Image upload */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Child Category Icon/Image</label>
                          {/* size badge */}
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-[10px] font-semibold">
                            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            Recommended size: <strong>150 × 150 px</strong>&nbsp;(Square, e.g. transparent product png)
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => openPicker((url) => { setSubForm(prev => ({ ...prev, imageUrl: url })); setSubImagePreview(url); })}
                            className="relative w-full border-2 border-dashed border-zinc-200 hover:border-primary-400 rounded-lg p-4 min-h-[140px] bg-zinc-50 hover:bg-zinc-100/60 flex flex-col items-center justify-center overflow-hidden transition"
                          >
                            {subImagePreview ? (
                              <img src={subImagePreview} className="absolute inset-0 w-full h-full object-contain p-2 z-10" />
                            ) : null}

                            <div className="relative z-20 flex flex-col items-center text-center p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xs border">
                              <ImagePlus className="w-6 h-6 text-zinc-500 mb-1" />
                              <span className="text-[10px] font-semibold text-zinc-900">Choose Image</span>
                              <span className="text-[8px] text-zinc-400 mt-0.5">From media library</span>
                            </div>
                          </button>
                        </div>

                        {/* ChildCategory FAQs */}
                        <div className="border-t pt-4 space-y-4">
                          <h5 className="font-semibold text-[11px] text-zinc-500 uppercase tracking-wider">Child Category FAQs</h5>
                          <FaqEditor faqs={subFaqs} onChange={setSubFaqs} compact />
                        </div>

                        <div className="flex gap-2 border-t pt-4">
                          <button
                            type="button"
                            onClick={saveChildCategory}
                            className="flex-grow bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl transition"
                          >
                            Save ChildCategory
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubIndex(null)}
                            className="border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-xl transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Catalog FAQs */}
                <div className="bg-white rounded-xl border border-zinc-150 p-6 md:p-6 shadow-sm space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="font-semibold text-zinc-950 text-xl flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-primary-600" />
                      Category FAQs
                    </h3>
                  </div>

                  <FaqEditor faqs={catalogFaqs} onChange={setCatalogFaqs} />
                </div>

                {/* SAVE CATALOG BAR (sticky) */}
                <div className="sticky bottom-4 z-30 flex items-center justify-end gap-3 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-xl px-4 py-3 shadow-lg">
                  {catalogDirty ? (
                    <span className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="mr-auto text-xs font-medium text-zinc-400">All changes saved</span>
                  )}
                  <button
                    onClick={handleSaveCatalogDetails}
                    disabled={savingCatalog || !catalogDirty}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {savingCatalog ? "Saving Catalog..." : `Save ${catalogName} Catalog`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY PICKER */}
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
