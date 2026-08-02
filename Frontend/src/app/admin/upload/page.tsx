"use client";
import { adminFetch } from "@/lib/adminAuth";

import { useRef, useState } from "react";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<"brand" | "category">("brand");

  // Brand Upload States
  const [brandFile, setBrandFile] = useState<File | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const brandInputRef = useRef<HTMLInputElement | null>(null);
  const [brandStats, setBrandStats] = useState<{ inserted: number; updated: number; total: number } | null>(null);

  // Category Upload States
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryStats, setCategoryStats] = useState<{ totalParsed: number; validProducts: number; inserted: number; updated: number } | null>(null);

  const handleBrandUpload = async () => {
    if (!brandFile) {
      alert("Please select a brand CSV file first");
      return;
    }

    try {
      setBrandLoading(true);
      setBrandStats(null);

      const formData = new FormData();
      formData.append("file", brandFile);

      const res = await adminFetch("/api/upload-brand-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || `Upload failed (${res.status})`);
        return;
      }

      setBrandStats({
        inserted: data.inserted || 0,
        updated: data.updated || 0,
        total: data.total || 0,
      });

      setBrandFile(null);
      if (brandInputRef.current) {
        brandInputRef.current.value = "";
      }
      alert("Brand CSV uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong during brand upload");
    } finally {
      setBrandLoading(false);
    }
  };

  const handleCategoryUpload = async () => {
    if (!categoryFile) {
      alert("Please select a category CSV file first");
      return;
    }

    try {
      setCategoryLoading(true);
      setCategoryStats(null);

      const formData = new FormData();
      formData.append("file", categoryFile);

      const res = await adminFetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || `Upload failed (${res.status})`);
        return;
      }

      setCategoryStats({
        totalParsed: data.totalParsed || 0,
        validProducts: data.validProducts || 0,
        inserted: data.inserted || 0,
        updated: data.updated || 0,
      });

      setCategoryFile(null);
      if (categoryInputRef.current) {
        categoryInputRef.current.value = "";
      }
      alert("Category/Product CSV uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong during category upload");
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <div className=" px-4 py-6 text-gray-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-300">
                Admin Upload Center
              </p>
              <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-2xl">
                Import CSV Feeds
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                Choose between uploading brand data or updating product categories and details using CSV format.
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("brand")}
                className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === "brand"
                    ? "border-primary-400 text-primary-300 bg-gray-50"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                1. Brand Wise Upload
              </button>
              <button
                onClick={() => setActiveTab("category")}
                className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === "category"
                    ? "border-primary-400 text-primary-300 bg-gray-50"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                2. Category Wise Upload
              </button>
            </div>

            {/* Brand Wise View */}
            {activeTab === "brand" && (
              <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Type
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      Brands CSV
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-primary-300">
                      {brandLoading ? "Uploading" : "Ready"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Current File
                    </p>
                    <p className="mt-2 truncate text-lg font-semibold text-gray-900">
                      {brandFile?.name || "No file selected"}
                    </p>
                  </div>
                </div>

                {brandStats && (
                  <div className="rounded-lg border border-primary-400/20 bg-primary-950/20 p-4 space-y-2 text-sm text-primary-200">
                    <p className="font-semibold text-primary-300">Last Upload Metrics:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>Total Rows: <span className="font-mono text-gray-900">{brandStats.total}</span></div>
                      <div>Inserted: <span className="font-mono text-gray-900">{brandStats.inserted}</span></div>
                      <div>Updated: <span className="font-mono text-gray-900">{brandStats.updated}</span></div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-dashed border-primary-300/40 bg-gray-50 p-6">
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-sm font-medium text-primary-200">
                        Select Brand CSV file
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        CSV columns should include: <span className="text-gray-900 font-mono">name, slug, logo, url, description, seoTitle, seoDescription</span>.
                      </p>
                    </div>

                    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-primary-300/50 hover:bg-gray-100">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-400/15 text-2xl text-primary-300">
                        B
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {brandFile ? brandFile.name : "Click here to choose Brand CSV"}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload brand definitions CSV or TSV.
                      </p>
                      <input
                        ref={brandInputRef}
                        type="file"
                        accept=".csv,.tsv"
                        onChange={(e) => setBrandFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleBrandUpload}
                        disabled={brandLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-primary-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {brandLoading ? "Uploading..." : "Upload Brands"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBrandFile(null);
                          if (brandInputRef.current) {
                            brandInputRef.current.value = "";
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category/Product Wise View */}
            {activeTab === "category" && (
              <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Type
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      Products / Categories
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-amber-300">
                      {categoryLoading ? "Uploading" : "Ready"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Current File
                    </p>
                    <p className="mt-2 truncate text-lg font-semibold text-gray-900">
                      {categoryFile?.name || "No file selected"}
                    </p>
                  </div>
                </div>

                {categoryStats && (
                  <div className="rounded-lg border border-amber-400/20 bg-amber-950/20 p-4 space-y-2 text-sm text-amber-200">
                    <p className="font-semibold text-amber-300">Last Upload Metrics:</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div>Parsed: <span className="font-mono text-gray-900">{categoryStats.totalParsed}</span></div>
                      <div>Valid: <span className="font-mono text-gray-900">{categoryStats.validProducts}</span></div>
                      <div>Inserted: <span className="font-mono text-gray-900">{categoryStats.inserted}</span></div>
                      <div>Updated: <span className="font-mono text-gray-900">{categoryStats.updated}</span></div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-dashed border-primary-300/40 bg-gray-50 p-6">
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-sm font-medium text-primary-200">
                        Select Category / Product CSV file
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        CSV columns should include: <span className="text-gray-900 font-mono">aw_product_id, product_name, category_name, merchant_category</span> etc.
                      </p>
                    </div>

                    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-primary-300/50 hover:bg-gray-100">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-400/15 text-2xl text-primary-300">
                        C
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {categoryFile ? categoryFile.name : "Click here to choose Category CSV"}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload standard product feeds CSV or TSV.
                      </p>
                      <input
                        ref={categoryInputRef}
                        type="file"
                        accept=".csv,.tsv"
                        onChange={(e) => setCategoryFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleCategoryUpload}
                        disabled={categoryLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-primary-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {categoryLoading ? "Uploading..." : "Upload Categories"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFile(null);
                          if (categoryInputRef.current) {
                            categoryInputRef.current.value = "";
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-100 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
                Upload Notes
              </p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <strong>Brand Upload</strong> adds or updates brand records based on their unique <span className="text-primary-300 font-mono">slug</span>.
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <strong>Category Upload</strong> maps products, merchant categories, and canonical names by <span className="text-primary-300 font-mono">aw_product_id</span>.
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  Upload complete new files rather than partial delta sheets to avoid schema mismatches.
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary-300/20 bg-primary-50 border border-primary-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-200">
                Quick Checklist
              </p>
              <ul className="mt-5 space-y-3 text-sm text-gray-700">
                <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  Confirm brand files have a <span className="text-primary-300">name</span> column.
                </li>
                <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  Check that category files contain product links and pricing.
                </li>
                <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  Check live portal updates after successful uploads.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
