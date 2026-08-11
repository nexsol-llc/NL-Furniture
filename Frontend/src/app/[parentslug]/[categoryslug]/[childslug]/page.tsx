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
  type ChildCategoryDef,
  type ParentCategoryDef,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

// /<parentSlug>/<categorySlug>/<childSlug> — the deepest category page.
type Resolution =
  | { kind: "child"; category: CategoryDef; child: ChildCategoryDef; parent: ParentCategoryDef }
  | { kind: "redirect"; href: string }
  | { kind: "not-found" };

export default function ChildCategoryPage() {
  const { parentslug, categoryslug, childslug } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const parentSlug = ((parentslug as string) || "").toLowerCase();
  const categorySlug = ((categoryslug as string) || "").toLowerCase();
  const childSlug = ((childslug as string) || "").toLowerCase();

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
      const child = located?.category.childCategories?.find(
        (s) => s.slug.toLowerCase() === childSlug
      );

      if (!located || !child) {
        setResolution({ kind: "not-found" });
        return;
      }

      if (located.parent.slug.toLowerCase() !== parentSlug) {
        setResolution({
          kind: "redirect",
          href: childCategoryHref(
            located.parent.slug,
            located.category.slug,
            child.slug
          ),
        });
        return;
      }

      setResolution({ kind: "child", category: located.category, child, parent: located.parent });
    })();
    return () => {
      cancelled = true;
    };
  }, [parentSlug, categorySlug, childSlug]);

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

  const { category, child, parent } = resolution;

  return (
    <CategoryListingPage
      parentSlug={parentSlug}
      categorySlug={category.slug}
      childCategorySlug={child.slug}
      pageTitle={child.name}
      breadcrumbs={[
        { name: parent.name, href: `/${encodeURIComponent(parent.slug)}` },
        { name: category.name, href: categoryHref(parentSlug, category.slug) },
      ]}
      description={child.description || ""}
      faqs={child.faqs || []}
      searchTerms={child.searchTerms || []}
    />
  );
}
