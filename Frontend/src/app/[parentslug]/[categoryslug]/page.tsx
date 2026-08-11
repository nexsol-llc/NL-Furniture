"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryListingPage from "@/app/components/CategoryListingPage";
import {
  categoryHref,
  childCategoryHref,
  fetchCatalogList,
  fetchParentCategories,
  locateCategoryIn,
  type CategoryDef,
  type ParentCategoryDef,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

// /<parentSlug>/<categorySlug> — a category's product listing, nested under the
// Parent Category it is assigned to.
//
// The same two segments used to mean /<categorySlug>/<childSlug>, so this page
// also bridges that older shape onto the canonical three-segment URL. A
// category whose parent doesn't match the URL is redirected to its canonical
// location rather than served here, so each page has exactly one address.
type Resolution =
  | { kind: "category"; category: CategoryDef; parent: ParentCategoryDef }
  | { kind: "redirect"; href: string }
  | { kind: "not-found" };

export default function CategoryPage() {
  const { parentslug, categoryslug } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const parentSlug = ((parentslug as string) || "").toLowerCase();
  const categorySlug = ((categoryslug as string) || "").toLowerCase();

  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolution(null);
    (async () => {
      const [parents, categories] = await Promise.all([
        fetchParentCategories(),
        fetchCatalogList(),
      ]);
      if (cancelled) return;

      const located = locateCategoryIn(parents, categories, categorySlug);
      if (located) {
        if (located.parent.slug.toLowerCase() === parentSlug) {
          setResolution({ kind: "category", category: located.category, parent: located.parent });
        } else {
          // Right category, wrong parent in the URL — send it to the canonical
          // one instead of rendering the same page at two addresses.
          setResolution({
            kind: "redirect",
            href: categoryHref(located.parent.slug, located.category.slug),
          });
        }
        return;
      }

      // Legacy /<categorySlug>/<childSlug>: the first segment is the category
      // and the second is one of its children.
      const owner = locateCategoryIn(parents, categories, parentSlug);
      const child = owner?.category.childCategories?.find(
        (s) => s.slug.toLowerCase() === categorySlug
      );
      if (owner && child) {
        setResolution({
          kind: "redirect",
          href: childCategoryHref(
            owner.parent.slug,
            owner.category.slug,
            child.slug
          ),
        });
        return;
      }

      setResolution({ kind: "not-found" });
    })();
    return () => {
      cancelled = true;
    };
  }, [parentSlug, categorySlug]);

  useEffect(() => {
    if (resolution?.kind === "redirect") {
      router.replace(resolution.href);
    }
  }, [resolution, router]);

  if (resolution?.kind === "not-found") {
    notFound();
  }

  if (!resolution || resolution.kind === "redirect") {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {resolution
            ? t("categoryRoutes.redirecting")
            : t("categoryRoutes.searchingCategory")}
        </div>
      </div>
    );
  }

  // Title/description/FAQs are loaded from the API inside CategoryListingPage;
  // we only pass the resolved name for the first paint.
  return (
    <CategoryListingPage
      parentSlug={parentSlug}
      categorySlug={resolution.category.slug}
      pageTitle={resolution.category.name}
      breadcrumbs={[
        { name: resolution.parent.name, href: `/${encodeURIComponent(resolution.parent.slug)}` },
      ]}
      description=""
      faqs={[]}
    />
  );
}
