"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import useSWR from "swr";
import PromoSlider from "./components/PromoSlider";
import CategoryGroupGrid from "../components/CategoryGroupGrid";
import IndoorOutdoorToggle from "../components/IndoorOutdoorToggle";
import NewsletterSection from "../components/NewsletterSection";
import { Reveal, RevealGroup, RevealItem } from "../components/motion/Reveal";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";
import { useLanguage } from "@/providers/languageContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─────────── Types (mirror /api/coupon-home-* shapes) ───────────
interface BannerSlide { image: string; link?: string }
interface BestCoupon { title: string; description: string; image: string; link?: string; buttonText?: string }
interface CashbackStore { name: string; logo: string; link?: string }
interface SliderGroup {
  key: string;
  heading: string;
  subtitle?: string;
  brandName?: string;
  brandLogo?: string;
  sortOrder?: number;
}
interface FAQItem { question: string; answer: string }
interface DesignerSection {
  enabled: boolean;
  image: string;
  bgColor: string;
  smallHeading: string;
  title: string;
  subtitle: string;
  priceText: string;
  rightHeading: string;
  rightDescription: string;
  buttonText: string;
  buttonLink: string;
}
interface Settings {
  bannerSlides: BannerSlide[];
  bestCouponsHeading: string;
  bestCoupons: BestCoupon[];
  cashbackHeading: string;
  cashbackSubheading: string;
  cashbackStores: CashbackStore[];
  sliderGroups: SliderGroup[];
  designerSection: DesignerSection;
  dealsHeading: string;
  longContent: string;
  faqs: FAQItem[];
}
interface HomeProduct {
  _id: string;
  section: string;
  name: string;
  image?: string;
  discount?: string;
  price?: string;
  oldPrice?: string;
  brandName?: string;
  brandLogo?: string;
  link?: string;
  sortOrder?: number;
}

const baseEmpty = (): Settings => ({
  bannerSlides: [],
  bestCouponsHeading: "",
  bestCoupons: [],
  cashbackHeading: "",
  cashbackSubheading: "",
  cashbackStores: [],
  sliderGroups: [],
  designerSection: {
    enabled: true,
    image: "",
    bgColor: "#d97706",
    smallHeading: "",
    title: "",
    subtitle: "",
    priceText: "",
    rightHeading: "",
    rightDescription: "",
    buttonText: "",
    buttonLink: "",
  },
  dealsHeading: "",
  longContent: "",
  faqs: [],
});

const byOrder = (a: { sortOrder?: number }, b: { sortOrder?: number }) =>
  (a.sortOrder || 0) - (b.sortOrder || 0);

const DEALS_SECTION = "deals";

export default function CouponsHome() {
  const { t } = useLanguage();
  const EMPTY: Settings = {
    ...baseEmpty(),
    designerSection: {
      ...baseEmpty().designerSection,
      smallHeading: t('gutscheineHome.designerSmallHeading'),
      title: t('gutscheineHome.designerTitle'),
      subtitle: t('gutscheineHome.designerSubtitle'),
      priceText: t('gutscheineHome.designerPriceText'),
      rightHeading: t('gutscheineHome.designerRightHeading'),
      rightDescription: t('gutscheineHome.designerRightDescription'),
      buttonText: t('gutscheineHome.designerButtonText'),
    },
  };
  const { data: settingsData } = useSWR<Settings>("/api/coupon-home-settings", fetcher);
  const { data: productsData } = useSWR<HomeProduct[]>("/api/coupon-home-products", fetcher);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const toggleFaq = (i: number) => setOpenFaqIndex(openFaqIndex === i ? null : i);

  // Innenbereich/Außenbereich toggle for the category grid (matches the furniture home page).
  const [catTab, setCatTab] = useState<"indoor" | "outdoor">("indoor");

  // Parent Categories, split by type, drive this page's Innenbereich/
  // Außenbereich grid (same source as the furniture home page).
  const { data: parentCategoriesData } = useSWR<any[]>("/api/parent-categories", fetcher);
  // How many Category Catalog entries hang off each parent — shown as the
  // caption under a tile's name.
  const { data: catalogData } = useSWR<any[]>("/api/category-catalog", fetcher);
  const catalogCounts = new Map<string, number>();
  for (const entry of Array.isArray(catalogData) ? catalogData : []) {
    const parentId = (entry as any)?.parentCategoryId;
    if (parentId) catalogCounts.set(parentId, (catalogCounts.get(parentId) ?? 0) + 1);
  }
  const tileCaption = (count: number): string | undefined =>
    count > 0
      ? t(
          count === 1
            ? "categoryGroupGrid.categoriesCountSingular"
            : "categoryGroupGrid.categoriesCount",
          { count }
        )
      : undefined;
  // Only Featured parent categories show here, in their drag-configured order
  // (the API already returns them sorted by sort_order).
  const pickParentCats = (type: "indoor" | "outdoor"): HomeCategoryItem[] =>
    (Array.isArray(parentCategoriesData) ? parentCategoriesData : [])
      .filter((p: any) => p?.slug && (p.featured === true || p.featured === "true") && (type === "outdoor" ? p.type === "outdoor" : p.type !== "outdoor"))
      .map((p: any) => ({
        name: p.name || p.slug,
        slug: p.slug,
        image: p.image || null,
        caption: tileCaption(catalogCounts.get(p._id) ?? 0),
      }));
  const homeIndoorCats = pickParentCats("indoor");
  const homeOutdoorCats = pickParentCats("outdoor");

  // Default the switcher to whichever section actually has categories.
  useEffect(() => {
    if (catTab === "indoor" && homeIndoorCats.length === 0 && homeOutdoorCats.length > 0) {
      setCatTab("outdoor");
    } else if (catTab === "outdoor" && homeOutdoorCats.length === 0 && homeIndoorCats.length > 0) {
      setCatTab("indoor");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeIndoorCats.length, homeOutdoorCats.length]);

  const s: Settings = {
    ...EMPTY,
    ...(settingsData || {}),
    designerSection: { ...EMPTY.designerSection, ...(settingsData?.designerSection || {}) },
  };
  const ds = s.designerSection;
  const products = Array.isArray(productsData) ? productsData : [];
  const deals = products.filter((p) => p.section === DEALS_SECTION).sort(byOrder);
  const sliderGroups = [...(s.sliderGroups || [])].sort(byOrder);

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <PromoSlider items={s.bannerSlides} />

      {/* BEST COUPONS */}
      {s.bestCoupons.length > 0 && (
        <section className="coupon-section-bg-1 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Reveal><h2 className="text-2xl md:text-3xl font-bold mb-8">{s.bestCouponsHeading}</h2></Reveal>
            <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {s.bestCoupons.map((card, i) => (
                <RevealItem key={i}>
                <div className="bg-white rounded-2xl shadow-soft hover:shadow-depth-3 transition p-5 flex items-center justify-between h-full">
                  <div className="flex flex-col justify-between h-full w-[60%]">
                    <div>
                      <h3 className="font-semibold text-sm mb-2">{card.title}</h3>
                      <p className="text-gray-600 text-sm leading-tight">{card.description}</p>
                    </div>
                    {card.link ? (
                      <a href={card.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline mt-4 hover:text-primary-600 w-fit">
                        {card.buttonText || t('gutscheineHome.shopNowFallback')}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold underline mt-4">{card.buttonText || t('gutscheineHome.shopNowFallback')}</span>
                    )}
                  </div>
                  <div className="w-[110px] h-[90px] relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {card.image && <Image src={card.image} alt={card.title} fill className="object-cover" />}
                  </div>
                </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* CASHBACK STORES */}
      {s.cashbackStores.length > 0 && (
        <section className="coupon-section-bg-2 py-10 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                {s.cashbackSubheading && (
                  <p className="text-xs tracking-widest text-gray-500 font-semibold">{s.cashbackSubheading}</p>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{s.cashbackHeading}</h2>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide pb-6">
              <div className="flex gap-8 min-w-max">
                {s.cashbackStores.map((store, idx) => {
                  const inner = (
                    <>
                      <div className="w-24 h-24 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-all duration-200">
                        <div className="relative w-16 h-16">
                          {store.logo && (
                            <Image src={store.logo} alt={store.name} fill className="object-contain p-1" sizes="64px" />
                          )}
                        </div>
                      </div>
                      {store.name && <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 px-1">{store.name}</p>}
                    </>
                  );
                  return (
                    <div key={idx} className="flex flex-col items-center text-center w-[120px] flex-shrink-0">
                      {store.link ? (
                        <a href={store.link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">{inner}</a>
                      ) : (
                        inner
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FURNITURE INFLUENCER / DESIGNER SECTION (admin-managed) */}
      {ds.enabled && (
        <section className="w-full bg-white coupon-section-pattern-1 py-6 sm:py-8 md:py-10">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row overflow-hidden rounded-lg sm:rounded-xl border border-gray-200">
              <div className="relative flex w-full md:w-2/3 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[350px]" style={{ backgroundColor: ds.bgColor || "#d97706" }}>
                <div className="relative w-1/2">
                  {ds.image && <Image src={ds.image} alt={ds.title || "Designer"} fill className="object-cover" priority sizes="(max-width: 768px) 50vw, 33vw" />}
                </div>
                <div className="flex w-1/2 flex-col justify-center px-2 sm:px-3 md:px-4 lg:px-8 text-white">
                  {ds.smallHeading && <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold tracking-wide">{ds.smallHeading}</h3>}
                  <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 md:gap-3">
                    <span className="flex h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-white text-xs sm:text-sm md:text-base lg:text-lg" style={{ color: ds.bgColor || "#d97706" }}>▶</span>
                    {ds.title && <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-none">{ds.title}</h1>}
                  </div>
                  {ds.subtitle && <h2 className="mt-1 sm:mt-2 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold">{ds.subtitle}</h2>}
                  {ds.priceText && <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold">{ds.priceText}</p>}
                </div>
              </div>
              <div className="flex w-full flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 bg-white md:w-1/3">
                {ds.rightHeading && <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{ds.rightHeading}</h2>}
                {ds.rightDescription && <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-gray-600">{ds.rightDescription}</p>}
                {ds.buttonText && (
                  ds.buttonLink ? (
                    <a href={ds.buttonLink} target="_blank" rel="noopener noreferrer" className="mt-3 sm:mt-4 w-fit border-b-2 border-black font-semibold text-black hover:opacity-70 transition text-xs sm:text-sm md:text-base">{ds.buttonText}</a>
                  ) : (
                    <button className="mt-3 sm:mt-4 w-fit border-b-2 border-black font-semibold text-black hover:opacity-70 transition text-xs sm:text-sm md:text-base">{ds.buttonText}</button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MÖBEL MEGA ANGEBOTE (deals) */}
      {deals.length > 0 && (
        <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-white coupon-section-pattern-2">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 md:mb-6 lg:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{s.dealsHeading || t('gutscheineHome.defaultDealsHeading')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-visible">
              {deals.map((deal) => (
                <div key={deal._id} className="bg-white rounded-lg sm:rounded-xl shadow-soft-md hover:shadow-soft-lg transition border border-gray-200 overflow-hidden text-center flex flex-col">
                  <div className="relative h-28 sm:h-32 md:h-36 flex-shrink-0 bg-gray-100">
                    {deal.image && <Image src={deal.image} alt={deal.name} fill className="object-cover" />}
                    {deal.discount && (
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent flex items-start justify-center pt-3">
                        <span className="text-white text-xl sm:text-2xl font-extrabold drop-shadow-lg">{deal.discount}</span>
                        <span className="text-white text-sm sm:text-base font-bold ml-1 drop-shadow-lg">{t('gutscheineHome.discountSuffix')}</span>
                      </div>
                    )}
                  </div>
                  {deal.brandLogo && (
                    <div className="flex justify-center -mt-7 sm:-mt-8 relative z-10">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-white bg-white shadow-soft-md overflow-hidden flex items-center justify-center">
                        <Image src={deal.brandLogo} alt={deal.brandName || deal.name} width={48} height={48} className="object-contain p-1" />
                      </div>
                    </div>
                  )}
                  <div className="px-2 sm:px-3 pt-2 pb-3 sm:pb-4 flex flex-col items-center flex-1 justify-between">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 line-clamp-2 leading-tight">{deal.name}</p>
                    {deal.brandName && <p className="text-[10px] sm:text-xs text-gray-400 mb-2">{deal.brandName}</p>}
                    <a
                      href={deal.link || "#"}
                      target={deal.link ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white text-[10px] sm:text-xs md:text-sm font-semibold py-1.5 sm:py-2 rounded-lg transition text-center"
                    >
                      {t('gutscheineHome.getOfferButton')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DYNAMIC "TOP ANGEBOTE" SLIDER GROUPS */}
      {sliderGroups.map((group) => {
        const groupProducts = products.filter((p) => p.section === group.key).sort(byOrder);
        if (groupProducts.length === 0) return null;
        return (
          <section key={group.key} className="bg-white coupon-section-pattern-1 py-8">
            <div className="max-w-7xl mx-auto px-4 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {group.brandLogo && <Image src={group.brandLogo} alt={group.brandName || ""} width={36} height={36} className="object-contain" />}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">{group.heading}</h2>
                    {group.subtitle && <p className="text-xs text-gray-500">{group.subtitle}</p>}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 min-w-max pb-2">
                  {groupProducts.map((item) => (
                    <div key={item._id} className="min-w-[170px] sm:min-w-[190px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-soft hover:shadow-soft-md transition flex flex-col">
                      <div className="relative h-24 sm:h-28 overflow-hidden bg-gray-100">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                        {item.discount && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-2">
                            <span className="text-white text-lg sm:text-xl font-extrabold drop-shadow-lg">🔥{item.discount}</span>
                            <span className="text-white text-xs sm:text-sm font-bold ml-1 drop-shadow-lg">{t('gutscheineHome.discountSuffix')}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 sm:p-3 flex flex-col items-center flex-1 justify-between min-h-[90px]">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 text-center mb-2">{item.name}</p>
                        <a
                          href={item.link || "#"}
                          target={item.link ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white text-[10px] sm:text-xs font-semibold py-1.5 rounded-lg transition text-center"
                        >
                          Angebot holen
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CATEGORY GRID with Innenbereich/Außenbereich toggle (admin-managed, matches the furniture home page) */}
      {(homeIndoorCats.length > 0 || homeOutdoorCats.length > 0) && (
        <CategoryGroupGrid
          variant="photo"
          title={t('categoryGroupGrid.heading')}
          subtitle={t('categoryGroupGrid.subheading')}
          backgroundClassName="coupon-section-bg-2"
          categories={catTab === "indoor" ? homeIndoorCats : homeOutdoorCats}
          hrefBase={catTab === "indoor" ? "/binnen" : "/buiten"}
          moreCategoriesHref="/categorie"
          headerExtra={
            <IndoorOutdoorToggle
              value={catTab}
              onChange={setCatTab}
              indoorLabel={t('categoryTabsSection.indoorLabel')}
              outdoorLabel={t('categoryTabsSection.outdoorLabel')}
              indoorDisabled={homeIndoorCats.length === 0}
              outdoorDisabled={homeOutdoorCats.length === 0}
            />
          }
        />
      )}

      {/* NEWSLETTER (admin-managed) */}
      <NewsletterSection
        sectionClassName="bg-white coupon-section-pattern-1 py-20 border-t"
        cardClassName="bg-gray-50 rounded-3xl overflow-hidden shadow-soft"
        inputClassName="flex-1 px-6 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500"
        buttonClassName="bg-primary-600 text-white px-10 py-4 rounded-xl font-medium hover:bg-primary-700 transition"
      />

      {/* LONG CONTENT + FAQ */}
      {(s.longContent || s.faqs.length > 0) && (
        <section className="w-full bg-white coupon-section-pattern-2 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {s.faqs.length > 0 && (
              <>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-12">
                  {t('gutscheineHome.defaultFaqHeading')}
                </h2>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {s.faqs.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 sm:pb-3 md:pb-4 last:border-b-0">
                      <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center text-left py-2 sm:py-3 md:py-4 px-1 sm:px-2 hover:bg-gray-50 transition rounded-lg">
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-gray-900 pr-2">{item.question}</span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-500 shrink-0">{openFaqIndex === index ? "−" : "+"}</span>
                      </button>
                      {openFaqIndex === index && (
                        <div className="mt-1 sm:mt-2 px-1 sm:px-2 pb-2 sm:pb-3 md:pb-4 text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">{item.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {s.longContent && (
              <div
                className="prose max-w-none mt-6 sm:mt-8 lg:mt-10 text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.longContent }}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
