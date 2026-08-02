"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

// Windowed page list: 1 … 4 5 [6] 7 8 … 20
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  pages.push(1);
  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const [jump, setJump] = useState("");

  // Keep the jump box in sync when the page changes externally.
  useEffect(() => setJump(""), [page]);

  const go = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  const submitJump = () => {
    const n = parseInt(jump, 10);
    if (!Number.isNaN(n)) go(n);
    setJump("");
  };

  const from = totalItems != null && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = totalItems != null && pageSize ? Math.min(page * pageSize, totalItems) : null;

  const btn =
    "inline-flex items-center justify-center min-w-[36px] h-9 px-2.5 rounded-lg border text-sm font-semibold transition select-none";
  const idle = "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900";
  const disabled = "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed";
  const active = "border-primary-600 bg-primary-600 text-white shadow-soft-sm";

  const window = pageWindow(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left: range + page size */}
      <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold">
        {from != null && to != null && totalItems != null && (
          <span>
            {from.toLocaleString("de-DE")}–{to.toLocaleString("de-DE")} of {totalItems.toLocaleString("de-DE")}
          </span>
        )}
        {onPageSizeChange && pageSize != null && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gray-900 bg-white"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => go(1)} disabled={page <= 1} className={`${btn} ${page <= 1 ? disabled : idle}`} aria-label="First page" title="First">
          <ChevronsLeft size={16} />
        </button>
        <button onClick={() => go(page - 1)} disabled={page <= 1} className={`${btn} ${page <= 1 ? disabled : idle}`} aria-label="Previous page" title="Previous">
          <ChevronLeft size={16} />
        </button>

        {window.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className="min-w-[24px] text-center text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${btn} ${p === page ? active : idle}`}
            >
              {p}
            </button>
          )
        )}

        <button onClick={() => go(page + 1)} disabled={page >= totalPages} className={`${btn} ${page >= totalPages ? disabled : idle}`} aria-label="Next page" title="Next">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => go(totalPages)} disabled={page >= totalPages} className={`${btn} ${page >= totalPages ? disabled : idle}`} aria-label="Last page" title="Last">
          <ChevronsRight size={16} />
        </button>

        {/* Jump to page — only worth showing when there are many pages */}
        {totalPages > 10 && (
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitJump()}
              placeholder="Go to"
              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gray-900"
            />
            <button onClick={submitJump} className={`${btn} ${idle} px-3`}>Go</button>
          </div>
        )}
      </div>
    </div>
  );
}
