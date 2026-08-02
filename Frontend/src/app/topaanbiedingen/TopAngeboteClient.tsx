"use client";
import { useState, useEffect } from "react";
import FAQSection from "../components/FAQSection";
import OfferProductCard from "../components/OfferProductCard";
import PlaceholderImage from "../components/PlaceholderImage";
import { useLanguage } from "@/providers/languageContext";

type TopAngeboteClientProps = {
  initialProducts: any[];
  initialSettings: any;
};

const readJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Server returned ${res.status}: ${text.slice(0, 160)}`);
  }
};

// ─── Banner ───
function SuperSaleBanner({ settings }: { settings: any }) {
  const { t } = useLanguage();
  const bannerImage = settings?.bannerImage || "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop";
  const bannerTitle = settings?.bannerTitle || t('topAngebote.bannerDefaultTitle');
  const bannerSubtitle = settings?.bannerSubtitle || t('topAngebote.bannerDefaultSubtitle');

  return (
    <section className="w-full relative overflow-hidden mt-4 md:mt-8 h-[210px] md:h-[280px]">
      <PlaceholderImage
        src={bannerImage}
        alt={bannerTitle}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-lg tracking-tight">
            {bannerTitle}
          </h1>
          <p className="text-sm md:text-xl mb-5 drop-shadow-md opacity-90">
            {bannerSubtitle}
          </p>
          <button className="bg-white text-gray-900 px-8 py-2.5 rounded-xl font-bold text-sm md:text-base hover:bg-gray-100 transition-colors">
            {t('topAngebote.bannerCta')}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Category Section ───
function CategorySection({ category, products }: { category: string; products: any[] }) {
  if (products.length === 0) return null;
  return (
    <section className="max-w-content mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-soft">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{category}</h2>
        {/* Fewer columns than the card count would allow: the cards need ~273px
            to fit the brand logo and price on one row without the price wrapping. */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <OfferProductCard
              key={p._id}
              title={p.title}
              image={p.productLogo}
              link={p.link}
              price={p.price}
              oldPrice={p.oldPrice}
              saleValue={p.saleValue}
              brandName={p.brandName}
              brandLogo={p.brandLogo}
              categoryLabel={p.category}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Long Content Section ───
function LongContentSection({ content }: { content: string }) {
  if (!content) return null;
  return (
    <section className="max-w-content mx-auto px-4 py-8">
      <style dangerouslySetInnerHTML={{ __html: `
        .rich-content h1  { font-size: 2.25rem; font-weight: 800; color: #111827; margin: 1.25em 0 0.5em; line-height: 1.2; }
        .rich-content h2  { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 1.2em 0 0.5em; line-height: 1.25; }
        .rich-content h3  { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 1.1em 0 0.4em; line-height: 1.3; }
        .rich-content h4  { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 1em 0 0.4em; line-height: 1.35; }
        .rich-content h5  { font-size: 1.125rem; font-weight: 600; color: #374151; margin: 1em 0 0.4em; }
        .rich-content h6  { font-size: 1rem; font-weight: 600; color: #374151; margin: 1em 0 0.4em; }
        .rich-content h7  { font-size: 0.9rem; font-weight: 600; color: #4b5563; margin: 0.9em 0 0.35em; display: block; }
        .rich-content h8  { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin: 0.9em 0 0.35em; display: block; }
        .rich-content h9  { font-size: 0.8rem; font-weight: 600; color: #6b7280; margin: 0.8em 0 0.3em; display: block; }
        .rich-content h10 { font-size: 0.75rem; font-weight: 600; color: #6b7280; margin: 0.8em 0 0.3em; display: block; }
        .rich-content p   { margin: 0.75em 0; color: #374151; line-height: 1.75; }
        .rich-content ul  { list-style: disc; padding-left: 1.5rem; margin: 0.75em 0; }
        .rich-content ol  { list-style: decimal; padding-left: 1.5rem; margin: 0.75em 0; }
        .rich-content li  { margin: 0.25em 0; color: #374151; }
        .rich-content a   { color: var(--primary-600); text-decoration: underline; }
        .rich-content img { max-width: 100%; border-radius: 12px; margin: 1rem auto; display: block; }
        .rich-content strong { font-weight: 700; }
      `}} />
      <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </section>
  );
}

// ─── Main Page ───
export default function TopAngeboteClient({
  initialProducts,
  initialSettings,
}: TopAngeboteClientProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [settings, setSettings] = useState<any>(initialSettings || {});
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, settingsRes] = await Promise.all([
          fetch("/api/top-angebote-products", { cache: "no-store" }),
          fetch("/api/top-angebote-settings", { cache: "no-store" }),
        ]);
        const prodData = await readJsonResponse(prodRes);
        const settingsData = await readJsonResponse(settingsRes);
        setProducts(Array.isArray(prodData) ? prodData : []);
        setSettings(settingsData || {});
      } catch (err) {
        console.error("Failed to load Top Angebote data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group products by category (preserving insertion order)
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // FAQs: use DB data if available, else fallback
  const faqs =
    settings?.faqs?.length > 0
      ? settings.faqs
      : [
          { question: t('topAngebote.defaultFaq1Q'), answer: t('topAngebote.defaultFaq1A') },
          { question: t('topAngebote.defaultFaq2Q'), answer: t('topAngebote.defaultFaq2A') },
          { question: t('topAngebote.defaultFaq3Q'), answer: t('topAngebote.defaultFaq3A') },
        ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      {/* Banner */}
      <SuperSaleBanner settings={settings} />

      {/* Page heading */}
      {(settings.pageTitle || settings.pageSubtitle) && (
        <div className="max-w-content mx-auto px-4 pt-8">
          {settings.pageTitle && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{settings.pageTitle}</h2>
          )}
          {settings.pageSubtitle && (
            <p className="text-gray-500 mt-1">{settings.pageSubtitle}</p>
          )}
        </div>
      )}

      {/* Products by Category */}
      {loading ? (
        <div className="max-w-content mx-auto px-4 py-16 text-center text-gray-400">
          <div className="animate-pulse text-lg">{t('topAngebote.loadingOffers')}</div>
        </div>
      ) : categories.length === 0 ? (
        <div className="max-w-content mx-auto px-4 py-16 text-center text-gray-400">
          <p className="text-lg">{t('topAngebote.noOffers')}</p>
        </div>
      ) : (
        categories.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            products={products.filter((p) => p.category === cat)}
          />
        ))
      )}

      {/* Long Content */}
      <LongContentSection content={settings.longContent || ""} />

      {/* FAQs */}
      <div className="max-w-content mx-auto px-4 pb-8">
        <FAQSection faqs={faqs} />
      </div>
    </div>
  );
}
