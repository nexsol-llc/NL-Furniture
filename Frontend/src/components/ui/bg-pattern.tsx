import React from "react";
import { cn } from "@/lib/utils";
import {
  type BGVariantType,
  getPatternBackgroundImage,
  getPatternBackgroundPosition,
} from "@/lib/bgPatterns";

type BGMaskType =
  | "fade-center"
  | "fade-edges"
  | "fade-top"
  | "fade-bottom"
  | "fade-left"
  | "fade-right"
  | "fade-x"
  | "fade-y"
  | "none";

type BGPatternProps = React.ComponentProps<"div"> & {
  variant?: BGVariantType;
  mask?: BGMaskType;
  size?: number;
  fill?: string;
};

/**
 * A mask only needs an alpha ramp: opaque keeps the pattern, transparent hides
 * it. Upstream used `var(--background)` — a shadcn token this project doesn't
 * define, which made every `mask-image` invalid and silently inert — so the
 * opaque stop is a plain color here.
 */
const maskClasses: Record<BGMaskType, string> = {
  "fade-edges": "[mask-image:radial-gradient(ellipse_at_center,#000,transparent)]",
  "fade-center": "[mask-image:radial-gradient(ellipse_at_center,transparent,#000)]",
  "fade-top": "[mask-image:linear-gradient(to_bottom,transparent,#000)]",
  "fade-bottom": "[mask-image:linear-gradient(to_bottom,#000,transparent)]",
  "fade-left": "[mask-image:linear-gradient(to_right,transparent,#000)]",
  "fade-right": "[mask-image:linear-gradient(to_right,#000,transparent)]",
  "fade-x": "[mask-image:linear-gradient(to_right,transparent,#000,transparent)]",
  "fade-y": "[mask-image:linear-gradient(to_bottom,transparent,#000,transparent)]",
  none: "",
};

/**
 * Decorative tiled background for one element.
 *
 * Fills its nearest positioned ancestor, so give that ancestor `relative` —
 * plus `isolate` whenever it paints its own background, since the default
 * `z-[-10]` otherwise drops the pattern behind it instead of on top of it.
 *
 * For the site-wide, admin-configured section pattern don't reach for this
 * component: the `.section-bg-*` classes in `globals.css` already carry it.
 */
const BGPattern = ({
  variant = "grid",
  mask = "none",
  size = 24,
  fill = "#252525",
  className,
  style,
  ...props
}: BGPatternProps) => {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 z-[-10] size-full", maskClasses[mask], className)}
      style={{
        backgroundImage: getPatternBackgroundImage(variant, fill, size),
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: getPatternBackgroundPosition(variant, size),
        ...style,
      }}
      {...props}
    />
  );
};

BGPattern.displayName = "BGPattern";
export { BGPattern };
export type { BGPatternProps, BGMaskType };
