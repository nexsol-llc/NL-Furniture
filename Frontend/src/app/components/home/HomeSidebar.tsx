"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  BadgePercent,
  BedDouble,
  Home,
  LayoutGrid,
  PackageSearch,
  Lightbulb,
  Scale,
  Star,
  Tag,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";

/* Left navigation rail. The rail itself renders from `lg`; below that the same
   list opens as a drawer from the header's menu button (HomeNavDrawer), so
   phones and tablets keep every destination without the rail squeezing the
   content. Every entry points at a route that exists; the two in-page modules
   (comparison tray, reviews) are anchors.

   Surfaces are light and derived from the theme (`surface-tint`); the primary
   colour is reserved for the active row and for hover/focus tints. */

type NavItem = { key: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/", icon: Home, exact: true },
  { key: "compare", href: "#vergelijken", icon: Scale },
  { key: "products", href: "/categorie", icon: PackageSearch },
  { key: "categories", href: "/categorie", icon: LayoutGrid },
  { key: "brands", href: "/merken", icon: Tag },
  { key: "rooms", href: "/influencer", icon: BedDouble },
  { key: "inspiration", href: "/influencer", icon: Lightbulb },
  { key: "deals", href: "/topaanbiedingen", icon: BadgePercent },
  { key: "reviews", href: "#beoordelingen", icon: Star },
  { key: "blog", href: "/magazine", icon: Sparkles },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50";

export default function HomeSidebar() {
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:block w-[176px] shrink-0">
      {/* Follows the page down, sitting under the header — or at the very top
          while the header is scrolled away (Header sets data-header-hidden). */}
      <div className="sticky top-[calc(var(--header-height)+1rem)] transition-[top] duration-300 ease-out [html[data-header-hidden]_&]:top-4">
        <nav
          aria-label={t("homeCompare.sidebar.heading")}
          className="surface-tint rounded-[18px] border border-gray-200/80 p-2 shadow-soft-md backdrop-blur-xl"
        >
          <HomeNavList />
        </nav>
      </div>
    </aside>
  );
}

/** The destinations — shared by the desktop rail and the mobile drawer. */
export function HomeNavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();

  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map(({ key, href, icon: Icon, exact }) => {
        const content = (
          <>
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} />
            {t(`homeCompare.sidebar.${key}`)}
          </>
        );
        return (
          <li key={key}>
            {href.startsWith("#") ? (
              <a href={href} onClick={onNavigate} className={navLinkClass(false)}>
                {content}
              </a>
            ) : (
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={exact ? "page" : undefined}
                className={navLinkClass(!!exact)}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Below `lg` the rail becomes this drawer, opened from the header's menu
 * button. Closes on the backdrop, Escape, the close button or any link, and
 * locks page scroll while open.
 */
export function HomeNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    // `invisible` (after the slide-out finishes) keeps the closed drawer's
    // links out of the tab order and away from screen readers.
    <div
      className={`fixed inset-0 z-[1000] transition-[visibility] duration-300 lg:hidden ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-gray-950/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <nav
        aria-label={t("homeCompare.sidebar.heading")}
        className={`surface-tint absolute inset-y-3 left-3 flex w-[264px] max-w-[calc(100vw-1.5rem)] flex-col rounded-[18px] border border-gray-200/80 p-2 shadow-soft-lg backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-[calc(100%_+_1rem)]"
        }`}
      >
        <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {t("homeCompare.sidebar.heading")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className={`rounded-lg p-1.5 text-gray-700 transition hover:bg-primary-500/10 hover:text-gray-950 ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <HomeNavList onNavigate={onClose} />
        </div>
      </nav>
    </div>
  );
}

// The rail only ever renders on `/`, so "Home" is the permanent active item —
// the one place the theme's full gradient appears.
function navLinkClass(active: boolean) {
  return [
    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${FOCUS_RING}`,
    active
      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-cta"
      : "text-gray-800 hover:bg-primary-500/10 hover:text-gray-950",
  ].join(" ");
}
