"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";

interface PromoItem {
  _id?: string;
  id?: number | string;
  image: string;
  link?: string;
  title?: string;
}

interface Slide {
  key: string | number;
  image: string | null;
  link: string;
  title: string;
}

interface PromoSliderProps {
  items?: PromoItem[];
}

/* ─── Entry point ────────────────────────────────────────────────────────── */
export default function PromoSlider({ items }: PromoSliderProps) {
  const { t } = useLanguage();
  const slides: Slide[] = useMemo(
    () =>
      items && items.length > 0
        ? items.map((it, i) => ({
            key: it._id ?? it.id ?? i,
            image: it.image,
            link: it.link || "",
            title: it.title || t('promoSlider.defaultTitle'),
          }))
        : [
            { key: 1, image: null, link: "", title: t('promoSlider.defaultTitle') },
            { key: 2, image: null, link: "", title: t('promoSlider.defaultTitle') },
            { key: 3, image: null, link: "", title: t('promoSlider.defaultTitle') },
            { key: 4, image: null, link: "", title: t('promoSlider.defaultTitle') },
          ],
    [items, t]
  );

  if (!slides.length) return null;

  return (
    <>
      <div className="hidden md:block">
        <HeroSlider slides={slides} />
      </div>
      <div className="block md:hidden">
        <MobileHeroSlider slides={slides} />
      </div>
    </>
  );
}

/* ─── Shared navigation helper ───────────────────────────────────────────── */
function useNavigate() {
  const router = useRouter();
  return (link: string) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      router.push(link);
    }
  };
}

/* ─── Desktop: coverflow, center card raised with blurred neighbours ─────── */
function HeroSlider({ slides }: { slides: Slide[] }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides, timerKey]);

  const n = slides.length;
  const prevIdx = (current - 1 + n) % n;
  const nextIdx = (current + 1) % n;

  const goNext = () => { setCurrent(nextIdx); setTimerKey((k) => k + 1); };
  const goPrev = () => { setCurrent(prevIdx); setTimerKey((k) => k + 1); };

  const transition = "all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  return (
    <section className="w-full">
      <div className="overflow-hidden py-8">
        <div className="relative w-full" style={{ aspectRatio: "3.05 / 1" }}>
          {slides.map((slide, idx) => {
            const isCurrent = idx === current;
            const isPrev = n > 1 && idx === prevIdx && idx !== nextIdx;
            const isNext = n > 1 && idx === nextIdx;

            let style: React.CSSProperties;

            if (isCurrent) {
              style = {
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "82%", height: "100%", zIndex: 10,
                borderRadius: "16px", overflow: "hidden",
                boxShadow: "0 0 40px rgba(0,0,0,0.22), 0 16px 48px rgba(0,0,0,0.28)",
                border: "2px solid rgba(255,255,255,0.18)",
                transition,
              };
            } else if (isPrev) {
              style = {
                position: "absolute", top: "50%", left: "-30%",
                transform: "translate(0, -50%)",
                width: "60%", height: "86%", zIndex: 5,
                borderRadius: "14px", overflow: "hidden",
                filter: "blur(3px) brightness(0.75)", opacity: 0.8,
                transition,
              };
            } else if (isNext) {
              style = {
                position: "absolute", top: "50%", left: "70%",
                transform: "translate(0, -50%)",
                width: "60%", height: "86%", zIndex: 5,
                borderRadius: "14px", overflow: "hidden",
                filter: "blur(3px) brightness(0.75)", opacity: 0.8,
                transition,
              };
            } else {
              style = {
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "82%", height: "100%", zIndex: 1,
                borderRadius: "16px", overflow: "hidden",
                opacity: 0, pointerEvents: "none",
                transition,
              };
            }

            return (
              <div key={slide.key} style={style}>
                <PlaceholderImage
                  src={slide.image} alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 82vw"
                  className={`object-cover${isCurrent && slide.link ? " cursor-pointer" : ""}`}
                  onClick={() => isCurrent && slide.link && navigate(slide.link)}
                />
              </div>
            );
          })}

          {n > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute top-1/2 -translate-y-1/2 z-20
                           w-9 h-9 md:w-11 md:h-11 flex items-center justify-center
                           rounded-full bg-primary-600 hover:bg-primary-700
                           text-white shadow-soft-md transition-colors cursor-pointer"
                style={{ left: "calc(9% + 12px)" }}
                aria-label={t('promoSlider.prevAriaLabel')}
              ><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} /></button>
              <button
                onClick={goNext}
                className="absolute top-1/2 -translate-y-1/2 z-20
                           w-9 h-9 md:w-11 md:h-11 flex items-center justify-center
                           rounded-full bg-primary-600 hover:bg-primary-700
                           text-white shadow-soft-md transition-colors cursor-pointer"
                style={{ right: "calc(9% + 12px)" }}
                aria-label={t('promoSlider.nextAriaLabel')}
              ><ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} /></button>
            </>
          )}

          {n > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setTimerKey((k) => k + 1); }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current ? "w-5 bg-primary-600" : "w-1.5 bg-primary-300"
                  }`}
                  aria-label={t('promoSlider.goToBanner', { count: i + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Mobile: full-width, swipe to navigate, fade transition ─────────────── */
function MobileHeroSlider({ slides }: { slides: Slide[] }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides, timerKey]);

  const n = slides.length;

  const goNext = () => { setCurrent((p) => (p + 1) % n); setTimerKey((k) => k + 1); };
  const goPrev = () => { setCurrent((p) => (p - 1 + n) % n); setTimerKey((k) => k + 1); };

  return (
    <section className="w-full px-4 py-4">
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-soft-lg"
        style={{ aspectRatio: "2.5 / 1" }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            if (diff > 0) goNext(); else goPrev();
          }
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.key}
            style={{
              position: "absolute", inset: 0,
              opacity: idx === current ? 1 : 0,
              transition: "opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              pointerEvents: idx === current ? "auto" : "none",
            }}
          >
            <PlaceholderImage
              src={slide.image} alt={slide.title}
              fill
              sizes="100vw"
              className={`object-cover${slide.link ? " cursor-pointer" : ""}`}
              onClick={() => slide.link && navigate(slide.link)}
            />
          </div>
        ))}

        {n > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setTimerKey((k) => k + 1); }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === current ? "w-5 bg-primary-600" : "w-1.5 bg-primary-300"
                }`}
                aria-label={t('promoSlider.goToBanner', { count: i + 1 })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
