"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/providers/languageContext";
import { Reveal, RevealGroup, RevealItem } from "./motion/Reveal";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  subtitle?: string;
  sectionClassName?: string;
}

export default function FAQSection({
  faqs,
  title,
  subtitle,
  sectionClassName = "bg-[#fafafa] py-14 md:py-20 border-t border-gray-100",
}: FAQSectionProps) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={sectionClassName}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Heading */}
        <Reveal className="text-center mb-10">
          <h2 className="text-h2 font-display text-gray-900">{title ?? t('faqSection.defaultTitle')}</h2>
          <p className="text-gray-500 mt-2 text-sm">{subtitle ?? t('faqSection.subtitle')}</p>
        </Reveal>

        <RevealGroup className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <RevealItem
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-soft-sm bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm md:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-primary-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 text-gray-700 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
