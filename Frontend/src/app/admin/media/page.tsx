"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, API_URL } from "@/lib/adminAuth";
import { formatBytes, type MediaItem } from "@/app/components/MediaPicker";
import { convertFileToWebP, compressToWebP, isConvertible } from "@/lib/imageOptimizer";
import {
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ImageIcon,
  ImageDown,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";

const PAGE_SIZE = 24;

type OptimizeResult = {
  id: string;
  filename: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  originalKB?: number;
  compressedKB?: number;
  error?: string;
};

export default function MediaLibraryAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convertOnUpload, setConvertOnUpload] = useState(true);
  const [optimizerOpen, setOptimizerOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResults, setOptimizeResults] = useState<OptimizeResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (s) params.set("search", s);
      const res = await adminFetch(`/api/media?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error fetching media:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia(page, search);
  }, [page, search, fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      let uploadFiles = Array.from(files);
      if (convertOnUpload) {
        uploadFiles = await Promise.all(uploadFiles.map((f) => convertFileToWebP(f)));
      }
      const fd = new FormData();
      uploadFiles.forEach((f) => fd.append("files", f));
      const res = await adminFetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setPage(1);
      setSearch("");
      setSearchInput("");
      await fetchMedia(1, "");
    } catch (err: any) {
      alert(err.message || "Upload failed ❌");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await adminFetch("/api/media/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Sync failed");
      alert(`Sync complete: ${data.scanned} files scanned, ${data.added} added ✅`);
      await fetchMedia(1, "");
      setPage(1);
    } catch (err: any) {
      alert(err.message || "Sync failed ❌");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.filename}"?\n\nPages still using this image will show a broken image.`)) return;
    try {
      const res = await adminFetch(`/api/media/${item._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await fetchMedia(page, search);
    } catch (err: any) {
      alert(err.message || "Delete failed ❌");
    }
  };

  const handleCopy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item._id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert(item.url);
    }
  };

  const submitSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  // ── Optimize All: fetch every image, re-encode as WebP, overwrite in place ──
  const fetchAllMedia = async (): Promise<MediaItem[]> => {
    const all: MediaItem[] = [];
    let p = 1;
    let pages = 1;
    do {
      const res = await adminFetch(`/api/media?page=${p}&limit=100`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to list media");
      all.push(...(data.items || []));
      pages = data.totalPages || 1;
      p++;
    } while (p <= pages);
    return all;
  };

  const updateResult = (id: string, patch: Partial<OptimizeResult>) => {
    setOptimizeResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const runOptimizer = async () => {
    setOptimizing(true);
    setOptimizeResults([]);
    try {
      const all = await fetchAllMedia();
      const candidates = all.filter(
        (m) => isConvertible(m.contentType) && !m.optimizedAt
      );

      if (!candidates.length) {
        setOptimizeResults([]);
        alert("Nothing to optimize — all images are already WebP or optimized.");
        return;
      }

      setOptimizeResults(
        candidates.map((m) => ({ id: m._id, filename: m.filename, status: "pending" }))
      );

      for (const item of candidates) {
        updateResult(item._id, { status: "running" });
        try {
          const imgRes = await fetch(`${API_URL}${item.url}`, { cache: "no-store" });
          if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);
          const original = await imgRes.blob();
          const originalKB = Math.round(original.size / 1024);

          // Skip files that are already small
          if (original.size < 80 * 1024) {
            updateResult(item._id, { status: "skipped", originalKB });
            continue;
          }

          const compressed = await compressToWebP(original);
          const compressedKB = Math.round(compressed.size / 1024);

          // Only overwrite when we actually save space (>10%)
          if (compressed.type !== "image/webp" || compressed.size >= original.size * 0.9) {
            updateResult(item._id, { status: "skipped", originalKB, compressedKB });
            continue;
          }

          const fd = new FormData();
          fd.append("file", new File([compressed], item.filename, { type: "image/webp" }));
          const up = await adminFetch(`/api/media/${item._id}/file`, {
            method: "PUT",
            body: fd,
          });
          const upData = await up.json();
          if (!up.ok) throw new Error(upData?.error || "Upload failed");

          updateResult(item._id, { status: "done", originalKB, compressedKB });
        } catch (err: any) {
          updateResult(item._id, { status: "error", error: err.message || "Failed" });
        }
      }

      await fetchMedia(page, search);
    } catch (err: any) {
      alert(err.message || "Optimizer failed ❌");
    } finally {
      setOptimizing(false);
    }
  };

  const optimizedCount = optimizeResults.filter((r) => r.status === "done").length;
  const savedKB = optimizeResults
    .filter((r) => r.status === "done" && r.originalKB && r.compressedKB)
    .reduce((acc, r) => acc + (r.originalKB! - r.compressedKB!), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="relative bg-white border border-gray-200 text-gray-900 p-6 rounded-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 hidden -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Media Library</h2>
          <p className="text-gray-500 text-sm max-w-2xl">
            All images stored in the R2 bucket. Upload new files here, then select them anywhere in the admin panel.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-xl border border-zinc-100 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search by filename…"
              className="w-full border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-zinc-900 transition"
            />
          </div>
          <button
            onClick={submitSearch}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Search
          </button>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          title="Index existing R2 files that were uploaded before the media library existed"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 text-zinc-700 hover:border-zinc-400 disabled:opacity-50 transition"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync from R2"}
        </button>

        <button
          onClick={() => setOptimizerOpen(true)}
          title="Convert all stored images to WebP to reduce file size"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
        >
          <ImageDown size={14} />
          Optimize All
        </button>

        <label
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 cursor-pointer select-none"
          title="New uploads are converted to WebP (max 1200px) before being stored"
        >
          <input
            type="checkbox"
            checked={convertOnUpload}
            onChange={(e) => setConvertOnUpload(e.target.checked)}
            className="accent-[var(--primary-600)] w-3.5 h-3.5"
          />
          WebP on upload
        </label>

        <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition cursor-pointer">
          <Upload size={14} />
          {uploading ? "Uploading…" : "Upload files"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {/* GRID */}
      <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {total} file{total === 1 ? "" : "s"} {search && `matching "${search}"`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-xl border border-zinc-200 disabled:opacity-40 hover:border-zinc-400 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-zinc-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-xl border border-zinc-200 disabled:opacity-40 hover:border-zinc-400 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
            <ImageIcon size={40} />
            <p className="text-sm font-semibold">
              {search ? "No files match your search" : "No media yet"}
            </p>
            {!search && (
              <p className="text-xs text-center max-w-sm">
                Upload files above, or click &quot;Sync from R2&quot; to index images that already exist in the bucket.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="relative group rounded-lg overflow-hidden border-2 border-zinc-100 hover:border-zinc-300 transition"
              >
                <div className="aspect-square bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.filename} loading="lazy" className="w-full h-full object-cover" />
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(item)}
                    title="Copy URL"
                    className="p-2.5 rounded-full bg-white text-zinc-800 hover:bg-zinc-200 transition"
                  >
                    {copiedId === item._id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    title="Delete"
                    className="p-2.5 rounded-full bg-white text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-zinc-700 truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-[9px] text-zinc-400">
                    {formatBytes(item.size)} · {new Date(item.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IMAGE OPTIMIZER MODAL */}
      {optimizerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !optimizing && setOptimizerOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ImageDown size={18} className="text-primary-600" />
                <h3 className="font-semibold text-gray-900">Image Optimizer</h3>
              </div>
              <button
                onClick={() => setOptimizerOpen(false)}
                disabled={optimizing}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto">
              {optimizeResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-2">
                    Converts every stored image to WebP (max 1200px, quality 82%) and overwrites
                    the file in place — URLs stay the same, so nothing breaks.
                  </p>
                  <p className="text-xs text-gray-400">
                    Images under 80 KB, already-WebP files, GIFs and SVGs are skipped.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {optimizeResults.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-xs">
                      {r.status === "pending" && <MinusCircle size={13} className="text-gray-300 shrink-0" />}
                      {r.status === "running" && <Loader2 size={13} className="text-primary-600 animate-spin shrink-0" />}
                      {r.status === "done" && <CheckCircle2 size={13} className="text-green-500 shrink-0" />}
                      {r.status === "skipped" && <MinusCircle size={13} className="text-gray-400 shrink-0" />}
                      {r.status === "error" && <XCircle size={13} className="text-red-500 shrink-0" />}
                      <span className="truncate flex-1 text-gray-700" title={r.filename}>{r.filename}</span>
                      {r.status === "done" && (
                        <span className="text-green-600 font-medium shrink-0">
                          {r.originalKB} KB → {r.compressedKB} KB
                        </span>
                      )}
                      {r.status === "skipped" && (
                        <span className="text-gray-400 shrink-0">
                          skipped{r.originalKB ? ` (${r.originalKB} KB)` : ""}
                        </span>
                      )}
                      {r.status === "error" && (
                        <span className="text-red-500 shrink-0 truncate max-w-[160px]" title={r.error}>{r.error}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <p className="text-xs text-gray-500">
                {optimizing
                  ? `Optimizing… ${optimizedCount} done`
                  : optimizeResults.length > 0
                  ? `Finished: ${optimizedCount} optimized, ${formatBytes(savedKB * 1024)} saved`
                  : ""}
              </p>
              <button
                onClick={runOptimizer}
                disabled={optimizing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {optimizing ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
                {optimizing ? "Running…" : optimizeResults.length > 0 ? "Run again" : "Start optimization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
