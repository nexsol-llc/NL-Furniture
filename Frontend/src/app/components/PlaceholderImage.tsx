"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type PlaceholderImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
};

// Generic image with a graceful fallback: when the URL is empty or fails to
// load we show a neutral placeholder icon instead of a broken image / alt text.
export default function PlaceholderImage({
  src,
  alt,
  className = "",
  iconClassName = "w-1/3 h-1/3",
  fill,
  width,
  height,
  sizes,
  priority,
  onClick,
}: PlaceholderImageProps) {
  const [errored, setErrored] = useState(false);
  const valid = typeof src === "string" && src.trim() !== "";

  if (!valid || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}
        onClick={onClick}
      >
        <ImageOff className={iconClassName} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={src as string}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width ?? 400}
      height={fill ? undefined : height ?? 400}
      sizes={sizes}
      priority={priority}
      unoptimized
      onError={() => setErrored(true)}
      onClick={onClick}
      className={className}
    />
  );
}
