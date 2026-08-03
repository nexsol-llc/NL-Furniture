"use client";

import FAQSection from "@/app/components/FAQSection";
import type { CategoryFAQ } from "@/lib/categoryCatalog";
import { useLanguage } from "@/providers/languageContext";

type CategorySeoSectionsProps = {
  title: string;
  description: string;
  faqs?: CategoryFAQ[];
  loading?: boolean;
};

export default function CategorySeoSections({
  title,
  description,
  faqs = [],
  loading = false,
}: CategorySeoSectionsProps) {
  const { t } = useLanguage();
  // While the category config loads we show a shimmer instead of the static
  // fallback copy/FAQs so no hardcoded content flashes on screen.
  if (loading) {
    return (
      <>
        <section className="border-t border-gray-200 bg-white section-pattern-1">
          <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-7 w-64 rounded skeleton mb-5" />
            <div className="max-w-4xl space-y-2.5">
              <div className="h-3.5 w-full rounded skeleton" />
              <div className="h-3.5 w-11/12 rounded skeleton" />
              <div className="h-3.5 w-3/4 rounded skeleton" />
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 bg-gray-50/50 section-pattern-2">
          <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-7 w-48 rounded skeleton mb-6" />
            <div className="space-y-3 max-w-3xl">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl skeleton border border-gray-100"
                />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="border-t border-gray-200 bg-white section-pattern-1">
        <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">
            {t('categorySeoSections.aboutHeading', { title })}
          </h2>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-4xl">
            {description}
          </p>
        </div>
      </section>

      {faqs.length > 0 && <FAQSection faqs={faqs} />}
    </>
  );
}
