"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import PlaceholderImage from "./PlaceholderImage";
import { useLanguage } from "@/providers/languageContext";

// Content managed from the admin panel: /admin/newsletter → "Section Content".
// Stored in section_settings under sectionId "newsletter" and served by
// GET /api/section-settings. These defaults match the original hardcoded copy
// so the section still renders correctly before an admin saves anything.
const BASE_DEFAULTS = {
  image: "",
};

interface NewsletterSectionProps {
  /** Outer <section> classes (spacing / background). */
  sectionClassName?: string;
  /** The rounded card wrapper classes. */
  cardClassName?: string;
  /** Submit button classes — lets each page keep its own accent color. */
  buttonClassName?: string;
  /** Email input classes. */
  inputClassName?: string;
  /** Where the "Datenschutz" link points. */
  privacyHref?: string;
}

export default function NewsletterSection({
  sectionClassName = "bg-white py-6 border-t",
  cardClassName = "bg-gray-50 rounded-2xl overflow-hidden shadow-soft-md",
  buttonClassName = "bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-cta hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98] transition-all duration-200",
  inputClassName = "flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm",
  privacyHref = "/privacybeleid",
}: NewsletterSectionProps) {
  const { t } = useLanguage();
  const DEFAULTS = {
    ...BASE_DEFAULTS,
    overlayTitle: t('newsletterSection.overlayTitle'),
    overlaySubtitle: t('newsletterSection.overlaySubtitle'),
    formTitle: t('newsletterSection.formTitle'),
    formSubtitle: t('newsletterSection.formSubtitle'),
    buttonText: t('newsletterSection.buttonText'),
    placeholder: t('newsletterSection.placeholder'),
    disclaimer: t('newsletterSection.disclaimer'),
  };
  const [fetchedContent, setFetchedContent] = useState<typeof DEFAULTS | null>(null);
  const content = fetchedContent ?? DEFAULTS;

  useEffect(() => {
    fetch("/api/section-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.settings?.newsletter) {
          setFetchedContent({ ...DEFAULTS, ...data.settings.newsletter });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={sectionClassName}>
      <div className="max-w-content mx-auto px-4">
        <div className={cardClassName}>
          <div className="grid md:grid-cols-2">
            {/* IMAGE */}
            <div className="relative h-64 md:h-auto min-h-[16rem]">
              <PlaceholderImage
                src={content.image}
                alt={content.overlayTitle || t('newsletterSection.imageAlt')}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                {content.overlayTitle && (
                  <h3 className="text-xl md:text-2xl font-bold">{content.overlayTitle}</h3>
                )}
                {content.overlaySubtitle && (
                  <p className="mt-2 text-sm opacity-90">{content.overlaySubtitle}</p>
                )}
              </div>
            </div>

            {/* FORM */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              {content.formTitle && <h3 className="text-2xl font-bold mb-3">{content.formTitle}</h3>}
              {content.formSubtitle && (
                <p className="text-gray-600 mb-6 text-sm">{content.formSubtitle}</p>
              )}

              <NewsletterForm
                placeholder={content.placeholder || DEFAULTS.placeholder}
                buttonText={content.buttonText || DEFAULTS.buttonText}
                formClassName="flex flex-col sm:flex-row gap-3"
                inputClassName={inputClassName}
                buttonClassName={buttonClassName}
              />

              {content.disclaimer && (
                <p className="mt-5 text-[11px] text-gray-500">
                  {content.disclaimer}{" "}
                  <Link href={privacyHref} className="underline">
                    {t('newsletterSection.privacyLinkText')}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
