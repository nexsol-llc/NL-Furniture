"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import FurnitureListingPage from "@/app/components/FurnitureListingPage";
import {
  fetchParentCategories,
  fetchFurniturePageSettings,
  type ParentCategoryDef,
  type FurniturePageSettings,
  type CategoryDef,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

type Resolved =
  | { kind: "parent"; parent: ParentCategoryDef }
  | { kind: "furniture"; settings: FurniturePageSettings };

// /binnen/[slug] serves two different things at the same URL shape, resolved
// in this order:
//  1. An Indoor Parent Category's aggregator page (was /indoor/[slug]) —
//     categories link to /binnen/[slug]/[categorySlug] (see the nested route).
//  2. The singleton Innen Furniture page, at its admin-configured slug.
// Anything matching neither 404s.
export default function InnenPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const slugStr = ((slug as string) || "").toLowerCase();

  const [status, setStatus] = useState<"checking" | "found" | "not-found">("checking");
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [furniturePage, setFurniturePage] = useState<FurniturePageSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");
    (async () => {
      const [parents, furnitureSettings] = await Promise.all([
        fetchParentCategories(),
        fetchFurniturePageSettings(),
      ]);
      if (cancelled) return;
      setFurniturePage(furnitureSettings);

      const matchedParent = parents.find((p) => p.slug.toLowerCase() === slugStr && p.type !== "outdoor");
      if (matchedParent) {
        setResolved({ kind: "parent", parent: matchedParent });
        setStatus("found");
        return;
      }

      if (furnitureSettings && furnitureSettings.slug && furnitureSettings.slug.toLowerCase() === slugStr) {
        setResolved({ kind: "furniture", settings: furnitureSettings });
        setStatus("found");
        return;
      }

      setStatus("not-found");
    })();
    return () => {
      cancelled = true;
    };
  }, [slugStr]);

  const filterByParent = useCallback(
    (c: CategoryDef) =>
      resolved?.kind === "parent" && c.parentCategoryId === resolved.parent._id,
    [resolved]
  );

  if (status === "not-found") {
    notFound();
  }

  if (status === "checking" || !resolved) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {t('categoryRoutes.loadingPage')}
        </div>
      </div>
    );
  }

  if (resolved.kind === "furniture") {
    return (
      <FurnitureListingPage
        settings={resolved.settings}
        filterCategories={filterIndoorFurniture}
        parentCategoryType="indoor"
      />
    );
  }

  const parent = resolved.parent;
  const settings = {
    slug: parent.slug,
    pageTitle: parent.name,
    seoTitle: parent.seoTitle || parent.name,
    seoDescription: parent.seoDescription || "",
    longContent: parent.description || "",
    faqs: parent.faqs || [],
  };

  const furnitureCrumb =
    parent.showOnFurniture === true && furniturePage?.slug
      ? { label: furniturePage.pageTitle || t('listingPage.breadcrumbFurniture'), href: `/binnen/${encodeURIComponent(furniturePage.slug)}` }
      : null;

  return (
    <FurnitureListingPage
      settings={settings}
      filterCategories={filterByParent}
      showParentSlider={false}
      categoryLinkHrefBase={`/binnen/${encodeURIComponent(parent.slug)}`}
      furnitureCrumb={furnitureCrumb}
    />
  );
}

const filterIndoorFurniture = (c: CategoryDef) => c.showOnFurniture === true;
