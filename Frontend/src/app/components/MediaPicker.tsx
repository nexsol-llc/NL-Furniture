"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/adminAuth";
import { convertFileToWebP } from "@/lib/imageOptimizer";
import { X, Upload, Search, ChevronLeft, ChevronRight, Check, ImageIcon } from "lucide-react";

export interface MediaItem {
  _id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  createdAt: string;
  optimizedAt?: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const PAGE_SIZE = 24;

export default function MediaPicker({ open, onClose, onSelect, title = "Media Library" }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
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
    if (open) {
      setSelected(null);
      fetchMedia(page, search);
    }
  }, [open, page, search, fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      // Convert to WebP client-side before storing (falls back to the original
      // for GIF/SVG/WebP or when conversion doesn't save space)
      const converted = await Promise.all(Array.from(files).map((f) => convertFileToWebP(f)));
      const fd = new FormData();
      converted.forEach((f) => fd.append("files", f));
      const res = await adminFetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      // Jump to page 1 so the new files are visible; select the first one
      setPage(1);
      setSearch("");
      setSearchInput("");
      await fetchMedia(1, "");
      if (data.items?.[0]) setSelected(data.items[0]);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-zinc-700" />
            <h3 className="font-semibold text-lg text-zinc-950">{title}</h3>
            <span className="text-xs text-zinc-400 font-semibold ml-2">{total} files</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-zinc-100 bg-zinc-50/60">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Search by filename…"
                className="w-full border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-zinc-900 transition"
              />
            </div>
            <button
              onClick={submitSearch}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              Search
            </button>
          </div>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition cursor-pointer">
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload"}
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

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
              <ImageIcon size={32} />
              <p className="text-sm font-semibold">{search ? "No files match your search" : "No media yet — upload your first file"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item) => {
                const isSelected = selected?._id === item._id;
                return (
                  <button
                    key={item._id}
                    onClick={() => setSelected(isSelected ? null : item)}
                    onDoubleClick={() => { onSelect(item); onClose(); }}
                    className={`relative group rounded-lg overflow-hidden border-2 transition text-left ${
                      isSelected ? "border-primary-600 ring-2 ring-primary-200" : "border-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <div className="aspect-square bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.filename} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                        <Check size={12} />
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-semibold text-zinc-700 truncate" title={item.filename}>{item.filename}</p>
                      <p className="text-[9px] text-zinc-400">{formatBytes(item.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: pagination + confirm */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-xl border border-zinc-200 bg-white disabled:opacity-40 hover:border-zinc-400 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-zinc-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-xl border border-zinc-200 bg-white disabled:opacity-40 hover:border-zinc-400 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {selected && (
              <span className="text-xs text-zinc-500 font-semibold truncate max-w-[200px]" title={selected.filename}>
                {selected.filename}
              </span>
            )}
            <button
              onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
              disabled={!selected}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition"
            >
              Use selected image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
