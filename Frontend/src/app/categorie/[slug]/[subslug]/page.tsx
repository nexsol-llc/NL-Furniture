"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import CategoryListingPage from "@/app/components/CategoryListingPage";
import { fetchCatalogEntry, type CategoryDef, type SubcategoryDef } from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

export default function SubcategoryPage() {
  const { slug, subslug } = useParams();
  const { t } = useLanguage();
  const categorySlug = (slug as string) || "";
  const subSlug = (subslug as string) || "";

  const [category, setCategory] = useState<CategoryDef | null>(null);
  const [subcategory, setSubcategory] = useState<SubcategoryDef | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the subcategory entirely from the API.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSubcategory(null);
    (async () => {
      const cat = await fetchCatalogEntry(categorySlug);
      if (cancelled) return;
      setCategory(cat);
      const sub = cat?.subcategories?.find((s) => s.slug === subSlug) ?? null;
      setSubcategory(sub);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, subSlug]);

  if (!subcategory && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl border border-gray-200 p-10 shadow-soft">
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
            {t('categoryRoutes.subcategoryNotFoundHeading')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t('categoryRoutes.subcategoryNotFoundText')}
          </p>
          <Link
            href={`/categorie/${encodeURIComponent(categorySlug)}`}
            className="inline-block mt-6 bg-black text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            {t('categoryRoutes.toCategory')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CategoryListingPage
      categorySlug={categorySlug}
      subcategorySlug={subSlug}
      pageTitle={subcategory?.name || subSlug}
      parentCategoryName={category?.name}
      description={subcategory?.description || ""}
      faqs={subcategory?.faqs || []}
      searchTerms={subcategory?.searchTerms || []}
    />
  );
}
