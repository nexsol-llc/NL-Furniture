"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

type CategoryImageProps = {
  src?: string | null;
  alt: string;
  size?: number;
  // Full-bleed variant: fills the (relative) parent and crops to cover instead
  // of sitting padded inside a fixed-size box — used by the photo card grid.
  fill?: boolean;
  sizes?: string;
};

// Category/childCategory tile image with a graceful fallback: when the URL is
// empty or fails to load we show a neutral placeholder icon instead of a broken
// image / alt text.
export default function CategoryImage({
  src,
  alt,
  size = 86,
  fill = false,
  sizes = "(max-width: 768px) 50vw, 17vw",
}: CategoryImageProps) {
  const [errored, setErrored] = useState(false);
  const valid = typeof src === "string" && src.trim() !== "";

  if (!valid || errored) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-300">
        <Package className="w-1/2 h-1/2" strokeWidth={1.5} />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src as string}
        alt={alt}
        fill
        sizes={sizes}
        // Same optimizer bypass as the tile variant below.
        unoptimized
        onError={() => setErrored(true)}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <Image
      src={src as string}
      alt={alt}
      width={size}
      height={size}
      // Bypass Next's image optimizer: the tiles come from arbitrary hosts /
      // uploads and sharp fails to optimize some of them ("Input Buffer is
      // empty"), which would otherwise trigger the fallback. Loading the
      // original URL directly (like the admin's plain <img>) always works.
      unoptimized
      onError={() => setErrored(true)}
      className="object-contain p-2 group-hover:scale-105 transition-transform"
    />
  );
}
