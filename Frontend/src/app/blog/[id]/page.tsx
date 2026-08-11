"use client";

import { useEffect, useState } from "react";
import NewsletterForm from "@/app/components/NewsletterForm";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import FAQSection from "../../components/FAQSection";
import { SOCIAL_PLATFORMS } from "../../components/Footer";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import { Reveal } from "@/app/components/motion/Reveal";
import { useLanguage } from "@/providers/languageContext";

const generateBlogFAQs = (title: string, category: string, t: (key: string, params?: Record<string, string | number>) => string) => [
  {
    question: t('blogDetailPage.faq1Q', { title }),
    answer: t('blogDetailPage.faq1A'),
  },
  {
    question: t('blogDetailPage.faq2Q', { category }),
    answer: t('blogDetailPage.faq2A'),
  },
  {
    question: t('blogDetailPage.faq3Q'),
    answer: t('blogDetailPage.faq3A'),
  },
  {
    question: t('blogDetailPage.faq4Q'),
    answer: t('blogDetailPage.faq4A'),
  },
];

const getTagsForCategory = (category: string) => {
  const norm = category.toLowerCase();
  if (norm.includes("bett")) return ["Schlafzimmer", "Betten Trends", "Schlafkomfort", "Home Styling"];
  if (norm.includes("sofa")) return ["Wohnzimmer", "Sofas & Couches", "Polstermöbel", "Gemütlichkeit"];
  if (norm.includes("stuhl") || norm.includes("stühl")) return ["Esszimmer", "Stühle", "Sitzmöbel", "Interior Design"];
  if (norm.includes("terrasse") || norm.includes("balkon")) return ["Outdoor", "Gartenmöbel", "Terrasse", "Sommer Trends"];
  return [category, "Möbel Trends", "Wohnideen", "Einrichtung"];
};

type Product = {
  _id: string;
  slug?: string;
  product_name: string;
  brand_name?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  aw_thumb_url?: string;
  image?: string;
  price?: number;
  search_price?: number;
  display_price?: string;
  merchant_name?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
};

type BlogSection = {
  title: string;
  content: string;
  image?: string;
  products: Product[];
};

type Blog = {
  _id: string;
  title: string;
  subHeading?: string;
  category: string;
  author: string;
  intro: string;
  heroImage: string;
  heroImageBy?: string;
  createdAt: string;
  sections: BlogSection[];
  faqs?: { question: string; answer: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
};

const renderRichText = (text: string) => {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return <span key={index}>{part}</span>;

    const [, label, href] = match;
    const isExternal = /^https?:\/\//i.test(href);

    return (
      <Link
        key={index}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-semibold text-primary-600 underline underline-offset-4"
      >
        {label}
      </Link>
    );
  });
};

const getProductUrl = (product: Product) =>
  product.aw_deep_link || product.merchant_deep_link || `/product/${product.slug || product._id}`;

const setMetaTag = (selector: string, attrs: Record<string, string>) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!tag) {
    tag = selector.startsWith("link")
      ? document.createElement("link")
      : document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
    document.head.appendChild(tag);
    return;
  }
  Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
};

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [sectionSettings, setSectionSettings] = useState<Record<string, any>>({});
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blog/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setBlog(data);
      } catch (error) {
        console.error(error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [params.id]);

  useEffect(() => {
    fetch("/api/section-settings")
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((data) => {
        if (data.success && data.settings) {
          setSectionSettings(data.settings);
        }
      })
      .catch((err) => console.error("Error fetching section settings:", err));
  }, []);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.social_links) {
          setSocialLinks(data.social_links);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  useEffect(() => {
    if (!blog) return;

    const metaTitle = blog.seo?.metaTitle || blog.title;
    const metaDescription = blog.seo?.metaDescription || blog.subHeading || blog.intro?.replace(/<[^>]+>/g, "").slice(0, 155);
    const ogTitle = blog.seo?.ogTitle || metaTitle;
    const ogDescription = blog.seo?.ogDescription || metaDescription;

    document.title = metaTitle;
    if (metaDescription) setMetaTag('meta[name="description"]', { name: "description", content: metaDescription });
    if (blog.seo?.keywords) setMetaTag('meta[name="keywords"]', { name: "keywords", content: blog.seo.keywords });
    if (ogTitle) setMetaTag('meta[property="og:title"]', { property: "og:title", content: ogTitle });
    if (ogDescription) setMetaTag('meta[property="og:description"]', { property: "og:description", content: ogDescription });
    if (blog.heroImage) setMetaTag('meta[property="og:image"]', { property: "og:image", content: blog.heroImage });
    if (blog.seo?.canonicalUrl) setMetaTag('link[rel="canonical"]', { rel: "canonical", href: blog.seo.canonicalUrl });
  }, [blog]);

  const isFavorited = (productId: string) => !!favorites[productId];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">{t('blogDetailPage.loadingArticle')}</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-serif text-gray-900">{t('blogDetailPage.articleNotFound')}</h1>
        <Link href="/magazine" className="text-sm text-gray-400 underline underline-offset-4">
          {t('blogDetailPage.backToMagazine')}
        </Link>
      </div>
    );
  }

  const customFaqs = (blog.faqs || []).filter(
    (faq) => faq.question.trim() || faq.answer.trim()
  );
  const detailFaqs =
    customFaqs.length > 0
      ? customFaqs
      : generateBlogFAQs(blog.title, blog.category, t);
  const nl: any = (sectionSettings as any)?.newsletter || {};
  const newsletterImage = nl.image || null;
  const overlayTitle = nl.overlayTitle ?? t('newsletterSection.overlayTitle');
  const overlaySubtitle = nl.overlaySubtitle ?? t('newsletterSection.overlaySubtitle');
  const formTitle = nl.formTitle ?? t('newsletterSection.formTitle');
  const formSubtitle = nl.formSubtitle ?? t('newsletterSection.formSubtitle');
  const disclaimer = nl.disclaimer ?? t('newsletterSection.disclaimer');
  const activeSocials = SOCIAL_PLATFORMS.filter((platform) => socialLinks[platform.key]?.trim());

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── ARTICLE WRAPPER ── */}
      <div className="max-w-[760px] mx-auto px-5 py-8 md:py-16">

        {/* Large headline title */}
        <Reveal>
          <h1 className="text-display font-display text-gray-900 mb-6">
            {blog.title}
          </h1>
          {blog.subHeading && (
            <h2 className="text-gray-600 mb-6 text-lg md:text-xl font-medium leading-relaxed">
              {blog.subHeading}
            </h2>
          )}
        </Reveal>

        {/* Solid Black Divider line matching reference */}
        <hr className="border-t-2 border-black mb-8" />

        {/* Floating Credit Box if no heroImage is present but heroImageBy is */}
        {!blog.heroImage && blog.heroImageBy && (
          <div className="float-right ml-6 mb-4 border border-gray-200 py-1.5 px-4 text-[9px] tracking-widest text-gray-400 uppercase font-bold">
            {t('blogDetailPage.photoCredit', { name: blog.heroImageBy })}
          </div>
        )}

        {/* Hero Image if present */}
        {blog.heroImage && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-8 aspect-[16/9] bg-gray-50 border border-gray-100">
            <Image
              src={blog.heroImage}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
            {blog.heroImageBy && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 py-1 px-3 text-[9px] tracking-widest text-gray-700 uppercase font-bold rounded shadow-soft">
                {t('blogDetailPage.photoCredit', { name: blog.heroImageBy })}
              </div>
            )}
          </div>
        )}

        {/* Intro Paragraphs */}
        {blog.intro && (
          <div className="mb-12 space-y-5 prose prose-gray max-w-none prose-p:text-gray-800 prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-[17px] prose-a:text-primary-600 prose-a:font-semibold">
            {/<[a-z][\s\S]*>/i.test(blog.intro) ? (
              <div dangerouslySetInnerHTML={{ __html: blog.intro }} />
            ) : (
              blog.intro.split(/\n+/).map((para, i) =>
                para.trim() ? (
                  <p
                    key={i}
                    className="text-gray-800 leading-[1.8] text-base md:text-[17px] font-normal"
                  >
                    {renderRichText(para.trim())}
                  </p>
                ) : null
              )
            )}
          </div>
        )}

        {/* ── SECTIONS ── */}
        {blog.sections.map((section, index) => (
          <div key={index} className="mb-14">
            {/* Section image (if any) */}
            {section.image && (
              <div className="relative w-full rounded-2xl overflow-hidden mb-6 aspect-[16/9] bg-gray-50 border border-gray-100">
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Section bold heading - Sans-serif exactly like reference */}
            <h2
              className="text-gray-900 font-extrabold mb-4 leading-snug tracking-tight font-sans"
              style={{ fontSize: "clamp(1.2rem, 1.8vw, 1.45rem)" }}
            >
              {section.title}
            </h2>

            {/* Section body text */}
            {section.content && (
              <div className="mb-8 space-y-4 prose prose-gray max-w-none prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:text-[15px] prose-a:text-primary-600 prose-a:font-semibold">
                {/<[a-z][\s\S]*>/i.test(section.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                ) : (
                  section.content.split(/\n+/).map((para, i) =>
                    para.trim() ? (
                      <p
                        key={i}
                        className="text-gray-700 leading-[1.8] text-[15px] font-normal"
                      >
                        {renderRichText(para.trim())}
                      </p>
                    ) : null
                  )
                )}
              </div>
            )}

            {/* ── PRODUCT GRID — 4 columns, Stylight-style ── */}
            {section.products && section.products.length > 0 && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {section.products.map((product, pIndex) => {
                    const img =
                      product.merchant_image_url ||
                      product.aw_image_url ||
                      product.aw_thumb_url ||
                      product.image ||
                      null;
                    const price =
                      product.display_price ||
                      (product.price ? `${product.price.toFixed(2).replace(".", ",")} €` : "");
                    const shop = product.merchant_name || product.brand_name || t('blogDetailPage.defaultShop');
                    const productUrl = getProductUrl(product);

                    // Generate a fake sale discount for styling representation (e.g. 1 in 3 products)
                    const hasDiscount = pIndex % 3 === 0;
                    const discountPercent = 15 + (pIndex % 3) * 5; // e.g. -15%, -20%

                    return (
                      <div
                        key={product._id}
                        onClick={() => window.open(productUrl, "_blank", "noopener,noreferrer")}
                        className="cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          {/* Product image container — light grey square */}
                          <div
                            className="relative w-full bg-[#f4f4f4] flex items-center justify-center overflow-hidden mb-3 aspect-square"
                          >
                            <PlaceholderImage
                              src={img}
                              alt={product.product_name}
                              fill
                              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Heart Icon Button - Wishlist Toggle */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(product._id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-soft hover:scale-105 transition-all duration-200 z-10"
                              aria-label={t('blogDetailPage.wishlistAriaLabel')}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 transition-colors ${
                                  isFavorited(product._id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-500 hover:text-red-500"
                                }`}
                              />
                            </button>

                            {/* Discount Badge */}
                            {hasDiscount && (
                              <span className="absolute top-2 left-2 bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* Brand */}
                          <p className="text-[11px] font-bold text-gray-900 leading-snug mb-0.5 uppercase tracking-wider">
                            {product.brand_name || t('blogDetailPage.defaultShop')}
                          </p>

                          {/* Product name */}
                          <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-2 group-hover:text-black transition-colors font-medium">
                            {product.product_name}
                          </p>
                        </div>

                        {/* Price & Shop info */}
                        <div className="flex items-baseline justify-between mt-auto pt-1">
                          {price && (
                            <p className="text-xs font-extrabold text-gray-900">{price}</p>
                          )}
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider hover:text-black transition-colors">
                            {shop.length > 9 ? shop.slice(0, 9).toUpperCase() + "…" : shop.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center "Weitere Produkte" Button under the grid */}
                <div className="flex justify-center mt-8 mb-12">
                  <button
                    onClick={() => router.push(`/${blog.category}`)}
                    className="border border-black text-gray-900 font-bold text-[10px] uppercase tracking-widest px-8 py-3.5 hover:bg-black hover:text-white transition-colors duration-300"
                  >
                    {t('blogDetailPage.moreProducts')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── TAGS SECTION ── */}
        {/* <div className="mt-12">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-3">
            Tags
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {getTagsForCategory(blog.category).map((tag) => (
              <span
                key={tag}
                onClick={() => router.push(`/magazine?search=${encodeURIComponent(tag)}`)}
                className="border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors duration-200 text-xs px-3.5 py-1.5 cursor-pointer font-medium rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div> */}

        {/* Divider above Author Row */}
        <hr className="border-gray-200 my-6" />

        {/* ── AUTHOR & SHARE ROW ── */}
        <div className="flex items-center justify-between py-2 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold border border-primary-200 shadow-soft uppercase tracking-wider">
              {blog.author.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {t('blogDetailPage.byAuthor')} <span className="text-gray-950 ml-1 font-extrabold">{blog.author.toUpperCase()}</span>
            </div>
          </div>

          {activeSocials.length > 0 && (
            <div className="flex items-center gap-4">
              {activeSocials.map((platform) => (
                <a
                  key={platform.key}
                  href={socialLinks[platform.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform.label}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111111] text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d={platform.path} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ================= NEWSLETTER SECTION ================= */}
        

        {/* Back to magazine */}
        <div className="flex justify-center mt-6">
          <Link
            href="/magazine"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
          >
            {t('blogDetailPage.backToMagazine')}
          </Link>
        </div>
      </div>

      <section className="bg-white section-pattern-1 py-6 border-t mb-12">
          <div className="max-w-content mx-auto px-4">
            <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-soft">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto min-h-[16rem]">
                  <PlaceholderImage
                    src={newsletterImage}
                    alt={overlayTitle || t('newsletterSection.imageAlt')}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    {overlayTitle && (
                      <h3 className="text-xl md:text-2xl font-bold">
                        {overlayTitle}
                      </h3>
                    )}
                    {overlaySubtitle && (
                      <p className="mt-2 text-sm opacity-90">
                        {overlaySubtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col justify-center">
                  {formTitle && (
                    <h3 className="text-2xl font-bold mb-3">
                      {formTitle}
                    </h3>
                  )}
                  {formSubtitle && (
                    <p className="text-gray-600 mb-6 text-sm">
                      {formSubtitle}
                    </p>
                  )}
                  <NewsletterForm
                    {...(nl.buttonText ? { buttonText: nl.buttonText } : {})}
                    {...(nl.placeholder ? { placeholder: nl.placeholder } : {})}
                  />

                  {disclaimer && (
                    <p className="mt-5 text-[11px] text-gray-500">
                      {disclaimer}{" "}
                      <Link href="/privacybeleid" className="underline">
                        {t('newsletterSection.privacyLinkText')}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* ── FAQs — always open ── */}
      <FAQSection
        faqs={detailFaqs}
        title={t('blogDetailPage.faqTitle')}
      />
    </div>
  );
}
