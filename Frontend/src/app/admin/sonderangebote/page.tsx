"use client";
import { adminFetch } from "@/lib/adminAuth";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";

import useSWR from "swr";
import { useEffect, useState } from "react";
import {
  FileText, HelpCircle, Plus, Trash2, Save, CheckCircle,
  Loader2, Star, Tag, Store, ExternalLink,
  ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight, Globe,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PAGE_KEY = "sonderangebote";

interface Faq { question: string; answer: string; }


// ─── Collapsible featured browser (paginated + searchable + inline toggle) ────
function FeaturedBrowser({
  icon, title, subtitle, endpoint, dataKey, manageHref, manageLabel, emptyText, renderItem, onToggle, queryExtra = "",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  endpoint: string;
  dataKey: "brands" | "coupons";
  manageHref: string;
  manageLabel: string;
  emptyText: string;
  renderItem: (item: any) => React.ReactNode;
  onToggle: (item: any, next: boolean) => Promise<void>;
  queryExtra?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"featured" | "all">("featured");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const limit = 8;

  // Debounce the search box and reset to the first page on a new term.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, mutate } = useSWR(
    open
      ? `${endpoint}?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}&filter=${filter}${queryExtra}`
      : null,
    fetcher
  );

  const items: any[] = data?.[dataKey] || [];
  const total: number = data?.total ?? 0;
  const pages: number = data?.pages ?? 1;

  const handleToggle = async (item: any) => {
    setBusyId(item._id);
    try {
      await onToggle(item, !item.featured);
      await mutate();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  };

  const setFilterTab = (f: "featured" | "all") => { setFilter(f); setPage(1); };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <span className="mt-0.5 text-amber-500">{icon}</span>
        <div className="text-sm flex-1 min-w-0">
          <p className="font-semibold text-gray-900 flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {title}
          </p>
          <p className="text-gray-500 mt-0.5">{subtitle}</p>
          <a
            href={manageHref}
            className="text-primary-600 font-semibold inline-flex items-center gap-1 mt-1 hover:underline"
          >
            {manageLabel} <ExternalLink size={12} />
          </a>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          title={open ? "Collapse" : "Expand"}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
          {/* Featured / All switch */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold">
              {(["featured", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterTab(f)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    filter === f ? "bg-primary-600 text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "featured" ? "Featured" : "All"}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-gray-400">Tap ⭐ to feature / unfeature</span>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div className="min-h-[80px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                {filter === "all" ? "No items found." : emptyText}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2"
                  >
                    {renderItem(item)}
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={busyId === item._id}
                      title={item.featured ? "Remove from featured" : "Mark as featured"}
                      className="ml-auto shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 transition disabled:opacity-40"
                    >
                      {busyId === item._id ? (
                        <Loader2 size={15} className="animate-spin text-gray-400" />
                      ) : (
                        <Star
                          size={17}
                          className={item.featured ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                {total} total • page {page}/{pages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSonderangebotePage() {
  const { data, mutate } = useSWR(`/api/page-seo-settings/${PAGE_KEY}`, fetcher);
  const [longContent, setLongContent] = useState("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [seo, setSeo] = useState({
    pageTitle: "",
    pageSubtitle: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Hydrate the form once the settings come back.
  useEffect(() => {
    if (data && !loaded) {
      const html = data.longContent || "";
      setLongContent(html);
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      setSeo({
        pageTitle: data.pageTitle || "",
        pageSubtitle: data.pageSubtitle || "",
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        seoKeywords: data.seoKeywords || "",
      });
      setLoaded(true);
    }
  }, [data, loaded]);

  const addFaq = () => setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, key: keyof Faq, value: string) =>
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await adminFetch(`/api/page-seo-settings/${PAGE_KEY}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          longContent,
          faqs: faqs.filter((f) => f.question.trim() || f.answer.trim()),
          ...seo,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved successfully!");
      mutate();
    } catch (error: any) {
      setMessage(error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sonder Angebote — Page Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control the rich description, FAQs and SEO meta shown on the public Sonder Angebote page.
          The stores and deals grids are driven by your <strong>Featured</strong> items.
        </p>
      </div>

      {/* Featured browsers — expand to see & search all featured items */}
      <div className="grid sm:grid-cols-2 gap-4">
        <FeaturedBrowser
          icon={<Store size={18} />}
          title="Beste Möbelgeschäfte"
          subtitle={<>Shows every store marked <strong>Featured store</strong>.</>}
          endpoint="/api/brands/featured"
          dataKey="brands"
          manageHref="/admin/coupon-stores"
          manageLabel="Manage stores"
          emptyText="No featured stores found."
          onToggle={async (brand: any, next: boolean) => {
            const res = await adminFetch(`/api/brands/${brand.slug}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ featured: next }),
            });
            if (!res.ok) throw new Error("Failed to update store");
          }}
          renderItem={(brand: any) => (
            <>
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain p-0.5" />
                ) : (
                  <span className="text-xs font-bold text-gray-300">{brand.name?.[0] || "?"}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{brand.slug}</p>
              </div>
            </>
          )}
        />
        <FeaturedBrowser
          icon={<Tag size={18} />}
          title="Beste Frühlingsangebote"
          subtitle={<>Shows every coupon marked <strong>Featured coupon</strong>.</>}
          endpoint="/api/coupons/featured"
          queryExtra="&includeExpired=1"
          dataKey="coupons"
          manageHref="/admin/coupons"
          manageLabel="Manage coupons"
          emptyText="No featured coupons found."
          onToggle={async (coupon: any, next: boolean) => {
            const res = await adminFetch(`/api/coupons/${coupon._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ featured: next }),
            });
            if (!res.ok) throw new Error("Failed to update coupon");
          }}
          renderItem={(coupon: any) => {
            const label = coupon.discountText?.trim()
              || (coupon.discount ? `${coupon.discount}%` : null);
            return (
              <>
                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {coupon.brandLogo ? (
                    <img src={coupon.brandLogo} alt={coupon.brandName} className="max-w-full max-h-full object-contain p-0.5" />
                  ) : (
                    <Tag size={14} className="text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{coupon.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {coupon.brandName || coupon.brandSlug}
                    {coupon.isExpired && <span className="text-red-400"> • expired</span>}
                  </p>
                </div>
                {label && (
                  <span className="shrink-0 bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded">
                    {label}
                  </span>
                )}
              </>
            );
          }}
        />
      </div>

      {/* Rich description */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Long Description (Rich Content)</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Add headings (H2/H3), paragraphs, images and links. Shown at the bottom of the page.
        </p>
        <RichDescriptionEditor
          value={longContent}
          onChange={setLongContent}
          placeholder="Write the long page description..."
          minHeight={260}
        />
      </div>

      {/* FAQs */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">FAQs</h2>
            {faqs.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {faqs.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800 transition"
          >
            <Plus size={15} /> Add FAQ
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50 relative group">
              <button
                type="button"
                onClick={() => removeFaq(i)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={14} />
              </button>
              <input
                placeholder="Question..."
                value={faq.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary-300"
              />
              <RichDescriptionEditor
                value={faq.answer}
                onChange={(html) => updateFaq(i, "answer", html)}
                placeholder="Answer..."
                minHeight={110}
                headings={false}
              />
            </div>
          ))}
          {faqs.length === 0 && (
            <p className="text-xs text-gray-400">No FAQs yet — click "Add FAQ" above.</p>
          )}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">SEO & Page Meta</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Page Title
            </label>
            <input
              value={seo.pageTitle}
              onChange={(e) => setSeo({ ...seo, pageTitle: e.target.value })}
              placeholder="Sonder Angebote"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Page Subtitle
            </label>
            <input
              value={seo.pageSubtitle}
              onChange={(e) => setSeo({ ...seo, pageSubtitle: e.target.value })}
              placeholder="Bis zu 70% Rabatt"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SEO Title <span className="text-gray-400 normal-case">— max 60 chars</span>
            </label>
            <span className={`text-[11px] font-semibold ${seo.seoTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
              {seo.seoTitle.length}/60
            </span>
          </div>
          <input
            value={seo.seoTitle}
            onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
            placeholder="Sonder Angebote – Bis zu 70% Rabatt auf Premium-Möbel"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Meta Description <span className="text-gray-400 normal-case">— max 160 chars</span>
            </label>
            <span className={`text-[11px] font-semibold ${seo.seoDescription.length > 160 ? "text-red-500" : "text-gray-400"}`}>
              {seo.seoDescription.length}/160
            </span>
          </div>
          <textarea
            value={seo.seoDescription}
            onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })}
            rows={3}
            placeholder="Exklusive Sonderangebote und Gutscheincodes für Premium-Möbel…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            SEO Keywords <span className="text-gray-400 normal-case">— comma separated</span>
          </label>
          <input
            value={seo.seoKeywords}
            onChange={(e) => setSeo({ ...seo, seoKeywords: e.target.value })}
            placeholder="Sonder Angebote, Möbel Rabatte, Gutscheincodes"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {message && (
            <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg ${message.includes("success") || message.includes("Saved") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <CheckCircle size={18} /> {message}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-semibold transition"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
