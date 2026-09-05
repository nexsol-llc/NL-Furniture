"use client";

import Link from "next/link";
import {
  BadgePercent,
  Compass,
  Home,
  LayoutGrid,
  Lightbulb,
  Scale,
  Star,
  Tag,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";

/* Left navigation rail. Desktop only — below `lg` the site header's own nav
   already carries these destinations, so duplicating them would just push the
   content down. Every entry points at a route that exists; the two in-page
   modules (comparison tray, reviews) are anchors. */

type NavItem = { key: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/", icon: Home, exact: true },
  { key: "categories", href: "/categorie", icon: LayoutGrid },
  { key: "compare", href: "#vergelijken", icon: Scale },
  { key: "brands", href: "/merken", icon: Tag },
  { key: "deals", href: "/topaanbiedingen", icon: BadgePercent },
  { key: "coupons", href: "/kortingscodes", icon: Compass },
  { key: "inspiration", href: "/influencer", icon: Lightbulb },
  { key: "reviews", href: "#beoordelingen", icon: Star },
  { key: "guides", href: "/magazine", icon: Sparkles },
];

export default function HomeSidebar() {
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:block w-[196px] shrink-0">
      <div className="sticky top-[calc(var(--header-height)+1rem)]">
        <nav aria-label={t("homeCompare.sidebar.heading")}>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ key, href, icon: Icon, exact }) => (
              <li key={key}>
                {href.startsWith("#") ? (
                  <a href={href} className={navLinkClass(false)}>
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} />
                    {t(`homeCompare.sidebar.${key}`)}
                  </a>
                ) : (
                  <Link href={href} className={navLinkClass(!!exact)}>
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} />
                    {t(`homeCompare.sidebar.${key}`)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

// The sidebar only ever renders on `/`, so "Home" is the permanent active item.
function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
    active
      ? "bg-primary-50 text-primary-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  ].join(" ");
}
