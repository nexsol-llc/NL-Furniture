"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryListingPage from "@/app/components/CategoryListingPage";
import {
  fetchCatalogList,
  findSubcategoryMatch,
  humanizeSlug,
} from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const slugStr = (slug as string) || "";
  const [redirectTarget, setRedirectTarget] = useState<{ categorySlug: string; subSlug: string } | null>(null);
  const [checkingDb, setCheckingDb] = useState(true);

  // If this slug is actually a subcategory of some category, redirect to the
  // canonical /categorie/<parent>/<sub> URL. Resolved entirely from the API.
  useEffect(() => {
    let cancelled = false;
    setCheckingDb(true);
    (async () => {
      const dbCats = await fetchCatalogList();
      if (cancelled) return;
      const match = findSubcategoryMatch(dbCats, slugStr);
      if (match && match.categorySlug !== slugStr) {
        setRedirectTarget(match);
      }
      setCheckingDb(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slugStr]);

  useEffect(() => {
    if (redirectTarget) {
      router.replace(`/categorie/${encodeURIComponent(redirectTarget.categorySlug)}/${encodeURIComponent(redirectTarget.subSlug)}`);
    }
  }, [redirectTarget, router]);

  if (redirectTarget) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {t('categoryRoutes.redirecting')}
        </div>
      </div>
    );
  }

  // While checking the DB, show a loading placeholder so we don't flash the
  // listing page before we know whether this is a redirect.
  if (checkingDb) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500 uppercase tracking-widest font-semibold">
          {t('categoryRoutes.searchingCategory')}
        </div>
      </div>
    );
  }

  // Title/description/FAQs are loaded from the API inside CategoryListingPage;
  // we only pass a humanized fallback title for the first paint.
  const pageTitle = humanizeSlug(slugStr);

  return (
    <CategoryListingPage
      categorySlug={slugStr}
      pageTitle={pageTitle}
      description=""
      faqs={[]}
    />
  );
}
