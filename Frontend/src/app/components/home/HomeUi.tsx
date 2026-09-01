"use client";

import Link from "next/link";
import { useCallback, useRef, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";

/* Shared building blocks for the comparison-style home page. Everything here is
   presentational — the sections own their data. Colors come from the theme's
   primary-* scale rather than a fixed hue, so the page restyles itself when an
   admin changes the brand color under Theme. */

/** White card surface every home module sits on. */
export function HomeCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/80 shadow-soft-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Section title with an optional "view all" link on the right. */
export function SectionHeader({
  title,
  href,
  linkLabel,
  className = "",
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  /** Optional controls (filter chips, arrows) rendered between title and link. */
  children?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      <h2 className="text-[15px] md:text-base font-bold text-gray-900 shrink-0">{title}</h2>
      {children && <div className="flex-1 min-w-0 flex items-center justify-center gap-2">{children}</div>}
      {href && linkLabel && (
        <Link
          href={href}
          className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          {linkLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

/** Small "Ad" / "Sponsored" marker — every paid placement in the design carries one. */
export function AdChip({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-white/85 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200/80 ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-primary-500" />
      {label}
    </span>
  );
}

/** Five-star row with a half-step-rounded fill. */
export function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i < rounded ? "fill-primary-500 text-primary-500" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </span>
  );
}

/** Carousel dots for the hero and the mega banners. */
export function SlideDots({
  count,
  active,
  onSelect,
  ariaLabel,
  className = "",
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  /** Label template containing {{index}}. */
  ariaLabel: (index: number) => string;
  className?: string;
}) {
  if (count <= 1) return null;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={ariaLabel(i + 1)}
          aria-current={i === active}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === active ? "w-6 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Horizontal scroller with optional arrow buttons. A native overflow container
 * rather than a carousel library: it keeps keyboard/touch scrolling intact and
 * the arrows just nudge it by roughly one viewport.
 */
export function Rail({
  children,
  prevLabel,
  nextLabel,
  arrows = true,
  className = "",
  contentClassName = "",
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
  arrows?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const nudge = useCallback((direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scroller}
        className={`flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory ${contentClassName}`}
      >
        {children}
      </div>

      {arrows && (
        <>
          <RailArrow direction="prev" label={prevLabel} onClick={() => nudge(-1)} />
          <RailArrow direction="next" label={nextLabel} onClick={() => nudge(1)} />
        </>
      )}
    </div>
  );
}

function RailArrow({
  direction,
  label,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-depth-2 ring-1 ring-gray-200 hover:text-primary-600 hover:ring-primary-300 transition-colors ${
        direction === "prev" ? "-left-3" : "-right-3"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/** Pill filter used by the inspiration rail. */
export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-primary-600 text-white shadow-soft-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}
