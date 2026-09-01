"use client";
import { adminFetch } from "@/lib/adminAuth";
import RichDescriptionEditor from "@/app/components/RichDescriptionEditor";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Settings, Globe, Share2 } from "lucide-react";
import RichTextEditor from "@/app/components/RichTextEditor";
import toast, { Toaster } from "react-hot-toast";

const PAGES = [
  { key: "official-home", label: "Official NL Furniture Home Page" },
  { key: "coupon-home", label: "Coupon Home Page" },
  { key: "magazine", label: "Blog / Magazine Page" },
  { key: "influencer", label: "Influencer Page" },
  { key: "sonderangebote", label: "Sonder Angebote Page" },
];

// Social platforms rendered in the public footer. `key` matches the
// `social_links` object stored on site-settings.
const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/..." },
] as const;

type SocialLinks = Record<(typeof SOCIAL_PLATFORMS)[number]["key"], string>;

const emptySocialLinks: SocialLinks = {
  facebook: "",
  tiktok: "",
  pinterest: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  x: "",
};

type FAQ = { question: string; answer: string };

const emptySettings = {
  pageTitle: "",
  pageSubtitle: "",
  longContent: "",
  faqs: [] as FAQ[],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "social" | "seo">("general");

  // General Settings States
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [generalSaving, setGeneralSaving] = useState(false);

  // Social Links States
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocialLinks);
  const [socialSaving, setSocialSaving] = useState(false);

  // SEO Settings States
  const [pageKey, setPageKey] = useState(PAGES[0].key);
  const [seoForm, setSeoForm] = useState(emptySettings);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);

  // Load General Settings
  useEffect(() => {
    if (activeTab === "general") {
      const loadGeneral = async () => {
        try {
          const res = await adminFetch("/api/admin/system-settings");
          if (res.ok) {
            const data = await res.json();
            setNewsletterEmail(data.newsletterNotifyEmail || "");
          }
        } catch (err) {
          console.error("Failed to load general settings", err);
        }
      };
      loadGeneral();
    }
  }, [activeTab]);

  // Load Social Links
  useEffect(() => {
    if (activeTab === "social") {
      const loadSocial = async () => {
        try {
          const res = await adminFetch(`/api/site-settings?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            const links = data.social_links || {};
            setSocialLinks({ ...emptySocialLinks, ...links });
          }
        } catch (err) {
          console.error("Failed to load social links", err);
        }
      };
      loadSocial();
    }
  }, [activeTab]);

  // Load SEO Settings
  useEffect(() => {
    if (activeTab === "seo") {
      const loadSeo = async () => {
        setSeoLoading(true);
        try {
          const res = await adminFetch(`/api/page-seo-settings/${pageKey}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setSeoForm({
              pageTitle: data.pageTitle || "",
              pageSubtitle: data.pageSubtitle || "",
              longContent: data.longContent || "",
              faqs: Array.isArray(data.faqs) ? data.faqs : [],
              seoTitle: data.seoTitle || "",
              seoDescription: data.seoDescription || "",
              seoKeywords: data.seoKeywords || "",
            });
          }
        } catch (err) {
          console.error("Failed to load SEO settings", err);
        } finally {
          setSeoLoading(false);
        }
      };
      loadSeo();
    }
  }, [activeTab, pageKey]);

  // Save General Settings
  const saveGeneral = async () => {
    setGeneralSaving(true);
    try {
      const res = await adminFetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterNotifyEmail: newsletterEmail }),
      });
      if (res.ok) {
        toast.success("General settings saved successfully!");
      } else {
        toast.error("Failed to save general settings.");
      }
    } catch (err) {
      toast.error("Network error saving general settings.");
    } finally {
      setGeneralSaving(false);
    }
  };

  // Save Social Links
  const saveSocial = async () => {
    setSocialSaving(true);
    try {
      const res = await adminFetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: socialLinks }),
      });
      if (res.ok) {
        toast.success("Social links saved successfully!");
      } else {
        toast.error("Failed to save social links.");
      }
    } catch (err) {
      toast.error("Network error saving social links.");
    } finally {
      setSocialSaving(false);
    }
  };

  // Save SEO Settings
  const saveSeo = async () => {
    setSeoSaving(true);
    try {
      const res = await adminFetch(`/api/page-seo-settings/${pageKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTitle: seoForm.pageTitle,
          pageSubtitle: seoForm.pageSubtitle,
          longContent: seoForm.longContent,
          seoTitle: seoForm.seoTitle,
          seoDescription: seoForm.seoDescription,
          seoKeywords: seoForm.seoKeywords,
          faqs: seoForm.faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
        }),
      });

      if (res.ok) {
        toast.success("SEO content settings saved successfully!");
      } else {
        toast.error("Failed to save SEO settings.");
      }
    } catch (err) {
      toast.error("Network error saving SEO settings.");
    } finally {
      setSeoSaving(false);
    }
  };

  const updateFaq = (index: number, field: keyof FAQ, value: string) => {
    const faqs = [...seoForm.faqs];
    faqs[index] = { ...faqs[index], [field]: value };
    setSeoForm({ ...seoForm, faqs });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Toaster position="top-center" />
      
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Portal Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure general system preferences, notification channels, and SEO metadata.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "general"
              ? "border-black text-black font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings size={18} /> General Settings
        </button>
        <button
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "social"
              ? "border-black text-black font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Share2 size={18} /> Social Links
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "seo"
              ? "border-black text-black font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Globe size={18} /> Furniture SEO Content Settings
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === "general" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-900">System Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Newsletter Subscriber Alert Email
              </label>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="e.g. notifications@yourdomain.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black bg-gray-50/50"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Whenever a visitor signs up for the newsletter, subscriber information (email, IP, browser) will be forwarded to this target address.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <span className="text-sm text-gray-400 font-medium">Please ensure SMTP configs are set in .env.local</span>
            <button
              type="button"
              onClick={saveGeneral}
              disabled={generalSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-6 py-3 text-sm font-semibold disabled:bg-gray-300 transition"
            >
              <Save size={18} /> {generalSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Social Links */}
      {activeTab === "social" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Social Media Links</h2>
            <p className="text-sm text-gray-500 mt-1">
              These URLs power the social icons in the site footer. Leave a field empty to hide that icon.
            </p>
          </div>

          <div className="space-y-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {platform.label}
                </label>
                <input
                  type="url"
                  value={socialLinks[platform.key]}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, [platform.key]: e.target.value })
                  }
                  placeholder={platform.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black bg-gray-50/50"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={saveSocial}
              disabled={socialSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-6 py-3 text-sm font-semibold disabled:bg-gray-300 transition"
            >
              <Save size={18} /> {socialSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: SEO Settings */}
      {activeTab === "seo" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 animate-fadeIn">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Select Page
            </label>
            <select
              value={pageKey}
              onChange={(e) => setPageKey(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
            >
              {PAGES.map((page) => (
                <option key={page.key} value={page.key}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>

          {seoLoading ? (
            <div className="py-16 text-center text-gray-400">Loading settings...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Page Title
                  </label>
                  <input
                    value={seoForm.pageTitle}
                    onChange={(e) => setSeoForm({ ...seoForm, pageTitle: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    placeholder="Optional page heading override"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Page Subtitle
                  </label>
                  <input
                    value={seoForm.pageSubtitle}
                    onChange={(e) => setSeoForm({ ...seoForm, pageSubtitle: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    placeholder="Optional subtitle override"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Long Content
                </label>
                <RichTextEditor
                  value={seoForm.longContent || ""}
                  onChange={(val) => setSeoForm({ ...seoForm, longContent: val })}
                  placeholder="Geben Sie hier einen langen Beschreibungstext ein..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">FAQs</h2>
                  <button
                    type="button"
                    onClick={() => setSeoForm({ ...seoForm, faqs: [...seoForm.faqs, { question: "", answer: "" }] })}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-4 py-2 text-sm font-semibold"
                  >
                    <Plus size={16} /> Add FAQ
                  </button>
                </div>

                {seoForm.faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between gap-3">
                      <input
                        value={faq.question}
                        onChange={(e) => updateFaq(index, "question", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                        placeholder="Question"
                      />
                      <button
                        type="button"
                        onClick={() => setSeoForm({ ...seoForm, faqs: seoForm.faqs.filter((_, i) => i !== index) })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <RichDescriptionEditor
                      value={faq.answer}
                      onChange={(html) => updateFaq(index, "answer", html)}
                      placeholder="Answer"
                      minHeight={120}
                      headings={false}
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    SEO Title
                  </label>
                  <input
                    value={seoForm.seoTitle}
                    onChange={(e) => setSeoForm({ ...seoForm, seoTitle: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    SEO Keywords
                  </label>
                  <input
                    value={seoForm.seoKeywords}
                    onChange={(e) => setSeoForm({ ...seoForm, seoKeywords: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  SEO Description
                </label>
                <textarea
                  value={seoForm.seoDescription}
                  onChange={(e) => setSeoForm({ ...seoForm, seoDescription: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-sm font-medium text-gray-500">Changes will affect public pages instantly.</span>
                <button
                  type="button"
                  onClick={saveSeo}
                  disabled={seoSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-6 py-3 text-sm font-semibold disabled:bg-gray-300"
                >
                  <Save size={18} /> {seoSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
