"use client";

import { useState, useRef, useEffect, useMemo, useCallback, TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";

type Slide = {
  _id?: string;
  id?: string | number;
  image: string;
  link?: string;
  title?: string;
};

type PerView = { base: number; sm: number; lg: number };

type Props = {
  items?: Slide[];
  /** Cards shown per view at each breakpoint. */
  perView?: PerView;
  /** CSS aspect-ratio value, e.g. "3 / 4" or "16 / 7". */
  aspect?: string;
  /** Horizontal padding classes on each slot — controls the gap between cards. */
  gapClass?: string;
  autoplayMs?: number;
};

const TRANSITION_MS = 600;

/** Number of cards shown per view at the current breakpoint. */
function usePerView({ base, sm, lg }: PerView) {
  const [perView, setPerView] = useState(lg);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1024) return lg; // lg: desktop
      if (w >= 640) return sm; // sm/md: tablet
      return base; // mobile
    };
    const update = () => setPerView(compute());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [base, sm, lg]);

  return perView;
}

function Card({ slide, aspect }: { slide: Slide; aspect: string }) {
  const { t } = useLanguage();
  const content = (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-soft-md bg-gray-200"
      style={{ aspectRatio: aspect }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.image}
        alt={slide.title || t('infiniteSlider.imageAlt')}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
    </div>
  );

  if (slide.link) {
    return (
      <a
        href={slide.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-95 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default function InfiniteSlider({
  items = [],
  perView: perViewConfig = { base: 2, sm: 3, lg: 4 },
  aspect = "3 / 4",
  gapClass = "px-3 md:px-5",
  autoplayMs = 3000,
}: Props) {
  const { t } = useLanguage();
  const perView = usePerView(perViewConfig);
  const n = items.length;
  // Only run the infinite carousel when there are more cards than fit in one view.
  const canLoop = n > perView;

  // Index points into the cloned `display` array. Real items start at `perView`
  // (there are `perView` lead-clones before them, and `perView` trail-clones after).
  const [index, setIndex] = useState(perView);
  const [enableTransition, setEnableTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  // Step deferred until after a no-animation snap has been painted.
  const pendingStep = useRef(0);

  // Build the display list with clones on both ends for a seamless loop.
  const display = useMemo(() => {
    if (!canLoop) {
      return items.map((slide, i) => ({ slide, key: `s-${slide._id ?? slide.id ?? i}` }));
    }
    const lead = items.slice(n - perView).map((slide, i) => ({ slide, key: `lead-${i}` }));
    const mid = items.map((slide, i) => ({ slide, key: `mid-${slide._id ?? slide.id ?? i}` }));
    const trail = items.slice(0, perView).map((slide, i) => ({ slide, key: `trail-${i}` }));
    return [...lead, ...mid, ...trail];
  }, [items, n, perView, canLoop]);

  // Reset to the first real item whenever the layout (breakpoint / item count) changes.
  useEffect(() => {
    setEnableTransition(false);
    setIndex(perView);
  }, [perView, n]);

  // Re-enable the transition on the frame after a snap so the reposition isn't
  // animated, then apply any step that was deferred by the snap.
  useEffect(() => {
    if (enableTransition) return;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const deferred = pendingStep.current;
        pendingStep.current = 0;
        setEnableTransition(true);
        if (deferred !== 0) setIndex((i) => i + deferred);
      })
    );
    return () => cancelAnimationFrame(raf);
  }, [enableTransition]);

  // Rapid clicks can push the index past the cloned edges before the running
  // transition ends, sliding the track into empty space (cards vanish until the
  // transition-end snap). Guard: snap to the matching real card first (no
  // animation), then apply the step on the next frame.
  const step = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next > n + perView) {
        pendingStep.current = delta;
        setEnableTransition(false);
        setIndex(delta > 0 ? index - n : index + n);
      } else {
        setIndex(next);
      }
    },
    [index, n, perView]
  );
  const goNext = useCallback(() => step(1), [step]);
  const goPrev = useCallback(() => step(-1), [step]);

  // When we land on a clone, jump (without animation) to the matching real card.
  const handleTransitionEnd = () => {
    if (!canLoop) return;
    if (index >= perView + n) {
      setEnableTransition(false);
      setIndex(index - n);
    } else if (index < perView) {
      setEnableTransition(false);
      setIndex(index + n);
    }
  };

  // Autoplay — one card at a time.
  useEffect(() => {
    if (!canLoop || paused) return;
    const t = setInterval(goNext, autoplayMs);
    return () => clearInterval(t);
  }, [canLoop, paused, goNext, autoplayMs]);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  if (n === 0) return null;

  // ── Static grid when everything already fits in one view ──────────────────
  if (!canLoop) {
    return (
      <div className="w-full py-4 px-4 md:px-12">
        <div
          className="grid gap-6 md:gap-8"
          style={{ gridTemplateColumns: `repeat(${Math.min(n, perView)}, minmax(0, 1fr))` }}
        >
          {items.map((slide, i) => (
            <Card key={slide._id ?? slide.id ?? i} slide={slide} aspect={aspect} />
          ))}
        </div>
      </div>
    );
  }

  const cardPct = 100 / perView;
  const activeDot = ((index - perView) % n + n) % n;

  return (
    <div
      className="relative w-full py-4 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Track */}
      <div className="overflow-hidden px-4 md:px-12">
        <div
          className="flex"
          style={{
            width: "100%",
            transform: `translateX(-${index * cardPct}%)`,
            transition: enableTransition ? `transform ${TRANSITION_MS}ms ease` : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {display.map(({ slide, key }) => (
            <div
              key={key}
              className={gapClass}
              style={{ flex: `0 0 ${cardPct}%`, maxWidth: `${cardPct}%` }}
            >
              <Card slide={slide} aspect={aspect} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={goPrev}
        aria-label={t('infiniteSlider.prevAriaLabel')}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-soft-lg w-11 h-11 rounded-full items-center justify-center hover:bg-white transition z-10"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={goNext}
        aria-label={t('infiniteSlider.nextAriaLabel')}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-soft-lg w-11 h-11 rounded-full items-center justify-center hover:bg-white transition z-10"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots — one per item, tracking the leftmost visible card */}
      <div className="flex justify-center flex-wrap mt-6 gap-2">
        {items.map((_, i) => (
          <div
            key={i}
            onClick={() => {
              setEnableTransition(true);
              setIndex(perView + i);
            }}
            className={`cursor-pointer transition-all rounded-full ${
              i === activeDot ? "w-6 h-2.5 bg-primary-600" : "w-2.5 h-2.5 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
