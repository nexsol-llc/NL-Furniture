"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryListingPage from "@/app/components/CategoryListingPage";
import { fetchParentCategories, fetchCatalogEntry, type ParentCategoryDef, type CategoryDef } from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

// /binnen/[slug]/[categorySlug] — a normal category page (same
// CategoryListingPage as /categorie/[slug]), reached via its Indoor Parent
// Category. 404s if the category isn't actually assigned to that parent.
export default function InnenParentCategoryDetailPage() {
  const { slug, categorySlug } = useParams();
  const { t } = useLanguage();
  const parentSlugStr = ((slug as string) || "").toLowerCase();
  const catSlugStr = (categorySlug as string) || "";

  const [status, setStatus] = useState<"checking" | "found" | "not-found">("checking");
  const [parent, setParent] = useState<ParentCategoryDef | null>(null);
  const [category, setCategory] = useState<CategoryDef | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");
    (async () => {
      const [parents, cat] = await Promise.all([fetchParentCategories(), fetchCatalogEntry(catSlugStr)]);
      if (cancelled) return;
      const matchedParent = parents.find((p) => p.slug.toLowerCase() === parentSlugStr && p.type !== "outdoor");
      if (matchedParent && cat && cat.parentCategoryId === matchedParent._id) {
        setParent(matchedParent);
        setCategory(cat);
        setStatus("found");
      } else {
        setStatus("not-found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentSlugStr, catSlugStr]);

  if (status === "not-found") {
    notFound();
  }

  if (status === "checking" || !parent || !category) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {t('categoryRoutes.loadingPage')}
        </div>
      </div>
    );
  }

  return (
    <CategoryListingPage
      categorySlug={catSlugStr}
      pageTitle={category.name}
      description={category.description || ""}
      faqs={category.faqs || []}
      parentCategoryName={parent.name}
      parentCategoryHref={`/binnen/${encodeURIComponent(parent.slug)}`}
    />
  );
}
