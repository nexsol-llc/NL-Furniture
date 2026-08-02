'use client';

import { useEffect, useState } from "react";
import {
  Mail,
  Image as ImageIcon,
  Users,
  Upload,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Search,
} from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";
import MediaPicker, { type MediaItem } from "@/app/components/MediaPicker";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewsletterContent {
  image: string;
  overlayTitle: string;
  overlaySubtitle: string;
  formTitle: string;
  formSubtitle: string;
  buttonText: string;
  placeholder: string;
  disclaimer: string;
}

interface Subscriber {
  _id: string;
  email: string;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
}

const DEFAULT_CONTENT: NewsletterContent = {
  image: "",
  overlayTitle: "Werde Teil der Community.",
  overlaySubtitle: "Styling-Tipps & Angebote",
  formTitle: "Newsletter",
  formSubtitle: "Neueste Produkte & exklusive Angebote",
  buttonText: "Abonnieren",
  placeholder: "Deine E-Mail",
  disclaimer: "Du kannst dich jederzeit abmelden.",
};

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition";

// ── Page ────────────────────────────────────────────────────────────────────────

export default function NewsletterAdminPage() {
  const [tab, setTab] = useState<"content" | "subscribers">("content");

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-primary-50 text-primary-600">
            <Mail size={20} />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Newsletter</h2>
            <p className="text-gray-500 text-sm">
              Edit the homepage newsletter section and manage your subscriber list.
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        <TabButton active={tab === "content"} onClick={() => setTab("content")} icon={<ImageIcon size={15} />}>
          Section Content
        </TabButton>
        <TabButton active={tab === "subscribers"} onClick={() => setTab("subscribers")} icon={<Users size={15} />}>
          Subscribers
        </TabButton>
      </div>

      {tab === "content" ? <ContentEditor /> : <SubscribersManager />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-primary-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Content editor ──────────────────────────────────────────────────────────────

function ContentEditor() {
  const [content, setContent] = useState<NewsletterContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/section-settings")
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (data?.success && data.settings?.newsletter) {
          setContent({ ...DEFAULT_CONTENT, ...data.settings.newsletter });
        }
      })
      .catch((e) => console.error("Error loading newsletter content:", e))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof NewsletterContent, value: string) =>
    setContent((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await adminFetch("/api/section-settings", {
        method: "POST",
        body: JSON.stringify({ sectionId: "newsletter", ...content }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* FORM */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Background Image
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative w-full h-40 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg overflow-hidden bg-zinc-50 transition flex items-center justify-center group"
          >
            {content.image && (
              <img src={content.image} alt="Newsletter" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="relative z-10 flex flex-col items-center gap-1 text-center bg-white/80 backdrop-blur px-4 py-2 rounded-lg group-hover:scale-95 transition">
              <Upload className="w-6 h-6 text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-900">Choose Image</span>
            </div>
          </button>
        </div>

        <Field label="Image Overlay Title" value={content.overlayTitle} onChange={(v) => update("overlayTitle", v)} />
        <Field
          label="Image Overlay Subtitle"
          value={content.overlaySubtitle}
          onChange={(v) => update("overlaySubtitle", v)}
        />

        <hr className="border-zinc-100" />

        <Field label="Form Title" value={content.formTitle} onChange={(v) => update("formTitle", v)} />
        <Field label="Form Subtitle" value={content.formSubtitle} onChange={(v) => update("formSubtitle", v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Input Placeholder" value={content.placeholder} onChange={(v) => update("placeholder", v)} />
          <Field label="Button Text" value={content.buttonText} onChange={(v) => update("buttonText", v)} />
        </div>
        <Field label="Disclaimer Text" value={content.disclaimer} onChange={(v) => update("disclaimer", v)} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* LIVE PREVIEW */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Preview</p>
        <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="grid grid-cols-1">
            <div className="relative h-44">
              {content.image && (
                <img src={content.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold">{content.overlayTitle}</h3>
                <p className="mt-1 text-xs opacity-90">{content.overlaySubtitle}</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">{content.formTitle}</h3>
              <p className="text-gray-600 mb-4 text-sm">{content.formSubtitle}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  disabled
                  placeholder={content.placeholder}
                  className="flex-1 px-4 py-2.5 rounded-lg border text-sm bg-white"
                />
                <span className="bg-[#E8431A] text-white px-5 py-2.5 rounded-lg text-sm font-medium text-center">
                  {content.buttonText}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-gray-500">{content.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => update("image", item.url)}
        title="Select newsletter background image"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

// ── Subscribers manager ─────────────────────────────────────────────────────────

function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/newsletter?limit=500");
      const data = await res.json();
      setSubscribers(Array.isArray(data?.subscribers) ? data.subscribers : []);
    } catch (e) {
      console.error("Error loading subscribers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleDelete = async (sub: Subscriber) => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/newsletter?email=${encodeURIComponent(sub.email)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setSubscribers((prev) => prev.filter((s) => s._id !== sub._id));
      setDeleteTarget(null);
      notify("Subscriber removed");
    } catch {
      notify("Failed to remove subscriber");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));

  const exportCSV = () => {
    const header = ["Email", "Subscribed On"];
    const rows = filtered.map((s) => [s.email, s.createdAt || ""]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "newsletter_subscribers.csv",
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{subscribers.length}</span>
          <span className="text-sm text-gray-500">total subscribers</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium transition"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {notice && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
          {notice}
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Mail size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No subscribers found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Subscribed</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => (
                <tr key={sub._id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-6 py-4 font-medium text-gray-800">{sub.email}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {sub.createdAt
                      ? new Date(sub.createdAt).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(sub)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Remove subscriber"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        Showing {filtered.length} of {subscribers.length} subscribers
      </p>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Remove Subscriber</h2>
            <p className="text-sm text-gray-600 mb-6">
              Remove <span className="font-semibold">{deleteTarget.email}</span> from the list? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
