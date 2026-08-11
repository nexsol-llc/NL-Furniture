"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FurnitureListingPage from "@/app/components/FurnitureListingPage";
import {
  categoryHref,
  childCategoryHref,
  fetchCatalogList,
  fetchParentCategories,
  findChildCategoryMatch,
  locateCategoryIn,
  type CategoryDef,
  type ParentCategoryDef,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

// First segment of the public category URL — a Parent Category's group page,
// listing every Category Catalog entry assigned to it.
//
// It also bridges the two older URL shapes, both of which put a category (or a
// child category) in this position, so existing links keep working:
//   /<categorySlug>  -> /<parentSlug>/<categorySlug>
//   /<childSlug>     -> /<parentSlug>/<categorySlug>/<childSlug>
// A category with no parent has no public URL, so those bridges 404 rather than
// guessing a prefix.
type Resolution =
  | { kind: "parent"; parent: ParentCategoryDef }
  | { kind: "redirect"; href: string }
  | { kind: "not-found" };

export default function ParentCategoryPage() {
  const { parentslug } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const slugStr = ((parentslug as string) || "").toLowerCase();

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

      const parent = parents.find((p) => p.slug.toLowerCase() === slugStr);
      if (parent) {
        setResolution({ kind: "parent", parent });
        return;
      }

      const located = locateCategoryIn(parents, categories, slugStr);
      if (located) {
        setResolution({
          kind: "redirect",
          href: categoryHref(located.parent.slug, located.category.slug),
        });
        return;
      }

      const match = findChildCategoryMatch(categories, slugStr);
      if (match) {
        const owner = locateCategoryIn(parents, categories, match.categorySlug);
        if (owner) {
          setResolution({
            kind: "redirect",
            href: childCategoryHref(
              owner.parent.slug,
              owner.category.slug,
              match.childSlug
            ),
          });
          return;
        }
      }

      setResolution({ kind: "not-found" });
    })();
    return () => {
      cancelled = true;
    };
  }, [slugStr]);

  useEffect(() => {
    if (resolution?.kind === "redirect") {
      router.replace(resolution.href);
    }
  }, [resolution, router]);

  const parent = resolution?.kind === "parent" ? resolution.parent : null;
  const filterByParent = useCallback(
    (c: CategoryDef) => !!parent && c.parentCategoryId === parent._id,
    [parent]
  );

  if (resolution?.kind === "not-found") {
    notFound();
  }

  if (!resolution || resolution.kind === "redirect") {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {resolution
            ? t("categoryRoutes.redirecting")
            : t("categoryRoutes.loadingPage")}
        </div>
      </div>
    );
  }

  const settings = {
    slug: parent!.slug,
    pageTitle: parent!.name,
    seoTitle: parent!.seoTitle || parent!.name,
    seoDescription: parent!.seoDescription || "",
    longContent: parent!.description || "",
    faqs: parent!.faqs || [],
  };

  return (
    <FurnitureListingPage settings={settings} filterCategories={filterByParent} />
  );
}
