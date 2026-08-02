"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useEffect, useState } from "react";
import { defaultCookieConsent } from "@/lib/cookieConsentDefaults";

export default function CookieConsentAdminPage() {
  const [form, setForm] = useState(defaultCookieConsent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch("/api/cookie-consent")
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Cookie consent settings saved ✅");
    } catch {
      alert("Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type: "text" | "textarea" | "number" = "text"
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={String(form[key])}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full border rounded-lg px-4 py-2 text-sm h-24"
        />
      ) : (
        <input
          type={type}
          value={type === "number" ? Number(form[key]) : String(form[key])}
          onChange={(e) =>
            setForm({
              ...form,
              [key]: type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          className="w-full border rounded-lg px-4 py-2 text-sm"
        />
      )}
    </div>
  );

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cookie Consent Popup</h1>
        <p className="text-gray-500 mt-1">
          Manage the cookie consent banner shown to visitors after {form.delaySeconds}{" "}
          seconds.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm space-y-5">
        {field("Heading", "heading")}
        {field("Body Text", "bodyText", "textarea")}
        {field("Details Link Text", "detailsLinkText")}
        {field("Details Link URL", "detailsLinkUrl")}

        <hr className="border-gray-100" />
        <p className="text-sm font-semibold text-gray-700">Footer Links (3 pages)</p>

        <div className="grid grid-cols-2 gap-4">
          {field("Link 1 Text", "link1Text")}
          {field("Link 1 URL", "link1Url")}
          {field("Link 2 Text", "link2Text")}
          {field("Link 2 URL", "link2Url")}
          {field("Link 3 Text", "link3Text")}
          {field("Link 3 URL", "link3Url")}
        </div>

        <hr className="border-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          {field("Refuse Button Text", "refuseButtonText")}
          {field("Assume Button Text", "acceptButtonText")}
          {field("Delay (seconds)", "delaySeconds", "number")}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Popup active (show to new visitors)
          </span>
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
          Preview
        </p>
        <div className="border border-gray-300 rounded-lg p-6 max-w-[520px]">
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nl-furniture_logo_dark.png" alt="" className="h-8 object-contain" />
            <div className="mt-1 h-[3px] w-[90px] bg-[#F0734C] rounded-full" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{form.heading}</h3>
          <p className="text-sm text-gray-700 mb-1">{form.bodyText}</p>
          <p className="text-sm underline text-gray-800 mb-4">{form.detailsLinkText}</p>
          <p className="text-xs text-gray-600 mb-4">
            {form.link1Text} | {form.link2Text} | {form.link3Text}
          </p>
          <div className="flex justify-end gap-3">
            <span className="px-5 py-1.5 text-sm border border-primary-500 text-primary-600 rounded-md">
              {form.refuseButtonText}
            </span>
            <span className="px-5 py-1.5 text-sm bg-primary-600 text-white rounded-md">
              {form.acceptButtonText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
