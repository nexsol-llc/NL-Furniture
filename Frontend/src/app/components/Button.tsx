import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-600 text-white shadow-cta hover:bg-primary-700 hover:shadow-soft-lg",
  secondary:
    "bg-white text-primary-700 border border-primary-200 shadow-soft-sm hover:bg-primary-50 hover:border-primary-300",
  ghost: "bg-transparent text-primary-700 hover:text-primary-800 hover:underline underline-offset-4",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3.5 py-2 gap-1",
  md: "text-sm px-5 py-2.5 gap-1.5",
  lg: "text-base px-6 py-3.5 gap-2",
};

const iconSizeClasses: Record<Size, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-4.5 h-4.5",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Show the trailing arrow icon. Defaults to true for external anchors. */
  icon?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { as?: "button" };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    as: "a";
    /** Adds target="_blank" rel="noopener noreferrer" — for outbound shop/affiliate links. */
    external?: boolean;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", icon, className, children } = props;
  const classes = clsx(base, variantClasses[variant], sizeClasses[size], className);

  if (props.as === "a") {
    const { as: _as, variant: _v, size: _s, icon: _i, className: _c, children: _ch, external, ...anchorRest } = props;
    const showIcon = icon ?? Boolean(external);
    return (
      <a
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...anchorRest}
      >
        {children}
        {showIcon && <ArrowRight className={iconSizeClasses[size]} />}
      </a>
    );
  }

  const { as: _as2, variant: _v2, size: _s2, icon: _i2, className: _c2, children: _ch2, ...buttonRest } = props;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
