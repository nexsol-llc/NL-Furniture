"use client";

import { useState, useRef, TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlaceholderImage from "./PlaceholderImage";

type Slide = {
  id?: string | number;
  image: string | null;
  link?: string;
};

const defaultSlides: Slide[] = [
  { id: 1, image: null },
  { id: 2, image: null },
  { id: 3, image: null },
  { id: 4, image: null },
  { id: 5, image: null },
  { id: 6, image: null },
];

const groupSlides = (arr: Slide[], size: number = 2): Slide[][] => {
  const result: Slide[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

type Props = {
  itemsPerSlide?: number;
  items?: Slide[];
};

export default function FancySlider({ itemsPerSlide = 2, items = [] }: Props) {
  const activeSlides = items && items.length > 0 ? items : defaultSlides;
  const grouped = groupSlides(activeSlides, itemsPerSlide);
  const [active, setActive] = useState(0);
  const startX = useRef(0);

  const next = () => {
    if (grouped.length === 0) return;
    setActive((prev) => (prev + 1) % grouped.length);
  };

  const prev = () => {
    if (grouped.length === 0) return;
    setActive((prev) => (prev === 0 ? grouped.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;

    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const gapClass = itemsPerSlide === 3 ? "gap-4 md:gap-8" : "gap-6 md:gap-16";
  const widthClass = itemsPerSlide === 3 ? "max-w-[30%]" : "max-w-[45%]";

  if (grouped.length === 0) return null;

  return (
    <div className="relative w-full py-8 overflow-hidden">

      {/* Main Slider - Infinite Forward Loop */}
      <div
        className="flex transition-transform duration-700 ease-out touch-pan-x"
        style={{ transform: `translateX(-${active * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {grouped.map((group, i) => (
          <div
            key={i}
            className={`min-w-full flex ${gapClass} justify-center px-4 md:px-12`}
          >
            {group.map((slide, sIdx) => {
              const content = (
                <div
                  className="relative w-full aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7]
                    rounded-2xl overflow-hidden shadow-soft-md flex-shrink-0 bg-gray-200"
                >
                  <PlaceholderImage
                    src={slide.image}
                    alt="Interior Design"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              );

              if (slide.link) {
                return (
                  <a
                    key={slide.id || sIdx}
                    href={slide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full ${widthClass} block hover:opacity-95 transition-opacity`}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={slide.id || sIdx} className={`w-full ${widthClass}`}>
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-soft-lg w-11 h-11 rounded-full items-center justify-center hover:bg-white transition z-10"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={next}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-soft-lg w-11 h-11 rounded-full items-center justify-center hover:bg-white transition z-10"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="flex justify-center mt-6 gap-2">
        {grouped.map((_, i) => (
          <div
            key={i}
            onClick={() => setActive(i)}
            className={`cursor-pointer transition-all rounded-full ${
              i === active ? "w-6 h-2.5 bg-primary-600" : "w-2.5 h-2.5 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}