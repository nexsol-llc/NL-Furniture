"use client";

import Image from "next/image";
import { Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import NewsletterSection from "@/app/components/NewsletterSection";
import Button from "@/app/components/Button";
import ProductCard from "@/app/components/ProductCard";
import { Spotlight } from "@/app/components/motion/Spotlight";
import { Reveal, RevealGroup, RevealItem } from "@/app/components/motion/Reveal";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/providers/languageContext";

type Product = {
  _id: string;
  product_name: string;
  display_price: string;
  description?: string;
  product_short_description?: string;
  brand_name?: string;
  brand_logo?: string;
  brandLogo?: string;
  colour?: string;
  is_sponsored?: boolean;
  merchant_name?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  alternate_image?: string;
  alternate_image_two?: string;
  alternate_image_three?: string;
  alternate_image_four?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  category_name?: string;
  delivery_cost?: string;
};

export default function ProductDetailClient({ initialProduct }: { initialProduct: Product }) {
  const { t } = useLanguage();
  const [product] = useState<Product>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);

  const images = [
    product.merchant_image_url || product.aw_image_url,
    product.alternate_image,
    product.alternate_image_two,
    product.alternate_image_three,
    product.alternate_image_four,
  ].filter(Boolean) as string[];

  useEffect(() => {
    setSelectedImage(
      product.merchant_image_url ||
      product.aw_image_url ||
      `https://placehold.co/800x600?text=${t('productDetail.noImage')}`
    );
  }, [product]);

  // Load similar products from same category
  useEffect(() => {
    if (!product.category_name) return;

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const simRes = await fetch(`/api/products-by-category?category=${encodeURIComponent(product.category_name!)}`);
        const simData = await simRes.json();
        const allSimilar = Array.isArray(simData) ? simData : (simData.products || []);
        // Exclude current product, take up to 8
        const filtered = allSimilar
          .filter((p: any) => p._id !== product._id)
          .slice(0, 8);
        setSimilarProducts(filtered);
      } catch (e) {
        console.error("Similar products fetch error:", e);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilar();
  }, [product]);

  // Check wishlist status
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/customer/wishlist");
        if (res.ok) {
          const data = await res.json();
          const list = data.products || [];
          const exists = list.some((p: any) => p._id === product._id);
          setIsFavorite(exists);
        }
      } catch {}
    };
    checkWishlist();
  }, [product]);

  const toggleWishlist = async () => {
    try {
      if (isFavorite) {
        const res = await fetch(`/api/customer/wishlist?productId=${product._id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFavorite(false);
          toast.success(t('productDetail.removedFromWishlist'));
        } else {
          toast.error(t('productDetail.removeFailed'));
        }
      } else {
        const res = await fetch("/api/customer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
        if (res.ok) {
          setIsFavorite(true);
          toast.success(t('productDetail.addedToWishlist'));
        } else {
          toast.error(t('productDetail.loginRequiredToSave'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handlePrevImage = () => {
    if (images.length === 0) return;
    const currentIndex = images.indexOf(selectedImage);
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    } else {
      setSelectedImage(images[images.length - 1]);
    }
  };

  const handleNextImage = () => {
    if (images.length === 0) return;
    const currentIndex = images.indexOf(selectedImage);
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    } else {
      setSelectedImage(images[0]);
    }
  };

  const formattedPrice = product.display_price
    ? `${product.display_price.replace(/EUR/gi, "").replace(/€/g, "").trim()} €`
    : "";

  const brandLogo = product.brand_logo || product.brandLogo || "";
  const shopName = product.brand_name || product.merchant_name || t('productDetail.defaultShopName');
  const shopLink = product.aw_deep_link || product.merchant_deep_link || "#";

  // Länge / Breite / Größentabelle usw. haben keine eigenen Spalten; wenn die
  // CSV-Beschreibung sie enthält, zeigen wir sie hier als kleine Spec-Liste.
  // The description text itself is always German (admin/CSV-authored), so the
  // regex match keys stay German — only the displayed label is translated.
  const specs: { label: string; value: string }[] = [];
  if (product.colour) specs.push({ label: t('productDetail.specColor'), value: product.colour });
  if (product.brand_name) specs.push({ label: t('productDetail.specBrand'), value: product.brand_name });
  if (product.category_name) specs.push({ label: t('productDetail.specCategory'), value: product.category_name });
  {
    const desc = product.description || "";
    const labelled: [string, string, RegExp][] = [
      ["Breite", t('productDetail.specWidth'), /Breite[:\s]+([\d.,]+\s*(?:cm|mm|m)\b)/i],
      ["Höhe", t('productDetail.specHeight'), /H(?:ö|oe)he[:\s]+([\d.,]+\s*(?:cm|mm|m)\b)/i],
      ["Tiefe", t('productDetail.specDepth'), /Tiefe[:\s]+([\d.,]+\s*(?:cm|mm|m)\b)/i],
      ["Länge", t('productDetail.specLength'), /L(?:ä|ae)nge[:\s]+([\d.,]+\s*(?:cm|mm|m)\b)/i],
      ["Gewicht", t('productDetail.specWeight'), /Gewicht[:\s]+([\d.,]+\s*(?:kg|g)\b)/i],
      ["Material", t('productDetail.specMaterial'), /Material[:\s]+([A-Za-zÄÖÜäöüß ,\-/]{2,40})/i],
    ];
    let foundDim = false;
    for (const [matchKey, label, re] of labelled) {
      const m = desc.match(re);
      if (m) {
        specs.push({ label, value: m[1].trim() });
        if (["Breite", "Höhe", "Tiefe", "Länge"].includes(matchKey)) foundDim = true;
      }
    }
    if (!foundDim) {
      const combined = desc.match(/(\d+([.,]\d+)?\s*[x×]\s*\d+([.,]\d+)?(\s*[x×]\s*\d+([.,]\d+)?)?\s*(cm|mm|m)\b)/i);
      if (combined) specs.push({ label: t('productDetail.specDimensions'), value: combined[1] });
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" />

      <div className="bg-gray-50 flex-1 py-4">
        <main className="max-w-content mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left - Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] max-h-[480px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-depth-3 flex items-center justify-center p-4">
                <Image
                  src={selectedImage || `https://placehold.co/800x600?text=${t('productDetail.noImage')}`}
                  alt={product.product_name}
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-contain p-4"
                  priority
                />

                {/* Favorite Button */}
                <button
                  onClick={toggleWishlist}
                  className="absolute top-4 right-4 bg-white/95 p-3 rounded-full shadow-soft-md hover:scale-105 transition-all z-10 text-gray-500 hover:text-red-500"
                  aria-label={t('productDetail.wishlistAriaLabel')}
                >
                  <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
                </button>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-soft-md hover:scale-105 transition-all duration-200 z-10"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-soft-md hover:scale-105 transition-all duration-200 z-10"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white flex items-center justify-center p-1 ${
                        imgUrl === selectedImage
                          ? "border-primary-500 shadow-soft-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`thumbnail-${idx}`}
                        width={80}
                        height={80}
                        className="object-contain animate-fadeIn"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Product Details */}
            <div className="space-y-5">
              {/* Titel — max. 2 Zeilen, Rest abgeschnitten */}
              <h1 className="text-h4 lg:text-h3 font-display text-gray-900 line-clamp-2" title={product.product_name}>
                {product.product_name}
              </h1>

              {/* Kurze Untertitel-Zeile */}
              {product.product_short_description && (
                <p className="text-sm text-gray-500 line-clamp-1 -mt-2">
                  {product.product_short_description}
                </p>
              )}

              {/* Angebots-Box mit "Featured"-Stil: Sponsor-Ribbon + Logo | Auf Lager | Preis + Button */}
              <div className="relative bg-white rounded-xl border-2 border-primary-400/70 shadow-soft-md overflow-hidden">
                {/* Sponsor-Ribbon oben links (wie "Featured") */}
                <span className="absolute top-0 left-0 z-10 bg-primary-500 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-br-lg">
                  {t('productDetail.sponsoredBadge')}
                </span>

                <div className="flex flex-col gap-3 px-4 pt-8 pb-4 sm:flex-row sm:items-center sm:gap-3">
                  {/* Mobil: obere Zeile (Logo + Auf Lager) — ab sm Teil der einzeiligen Leiste */}
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    {/* Links: Logo (aus CSV) */}
                    <div className="w-24 shrink-0 flex items-center">
                      {brandLogo ? (
                        <div className="relative w-24 h-12">
                          <Image
                            src={brandLogo}
                            alt={shopName}
                            fill
                            sizes="96px"
                            className="object-contain object-left"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">
                          {shopName}
                        </span>
                      )}
                    </div>

                    {/* Mitte: Auf Lager */}
                    <div className="sm:flex-1 flex justify-end sm:justify-center">
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {t('productDetail.inStock')}
                      </span>
                    </div>
                  </div>

                  {/* Mobil: untere Zeile (Preis + Button) — ab sm rechts in der Leiste */}
                  <div className="flex items-center gap-3 sm:shrink-0 sm:gap-2.5">
                    <span className="text-lg font-black text-gray-900 tracking-tight whitespace-nowrap">
                      {formattedPrice}
                    </span>
                    <div className="relative flex-1 sm:flex-none rounded-lg">
                      <Spotlight size={160} className="from-white/60 via-white/20" />
                      <Button
                        as="a"
                        href={shopLink}
                        external
                        variant="primary"
                        size="lg"
                        className="w-full whitespace-nowrap"
                      >
                        {t('productDetail.goToShop')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produktinformationen: Maße / Größentabelle (aus CSV) + Kurzbeschreibung */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-soft">
                <h3 className="text-h5 text-gray-900 mb-3">{t('productDetail.productInfoHeading')}</h3>

                {specs.length > 0 && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                    {specs.map((spec) => (
                      <div key={spec.label} className="flex items-baseline gap-2 text-sm">
                        <span className="text-gray-300 leading-none">•</span>
                        <dt className="text-gray-500">{spec.label}:</dt>
                        <dd className="font-medium text-gray-800">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">
                  {product.description || product.product_short_description || t('productDetail.noDescription')}
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* ==================== ÄHNLICHE PRODUKTE ==================== */}
        <section className="max-w-content mx-auto px-4 pb-10 mt-8">
          <Reveal><h2 className="text-h2 font-display text-gray-900 mb-6">{t('productDetail.similarProductsHeading')}</h2></Reveal>

          {similarLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200/60 animate-pulse rounded-xl h-64" />
              ))}
            </div>
          ) : similarProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-10">{t('productDetail.noSimilarProducts')}</p>
          ) : (
            <RevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((item: any) => (
                <RevealItem key={item._id}>
                  <ProductCard
                    id={item._id}
                    slug={item.slug}
                    name={item.product_name}
                    price={item.display_price || ""}
                    image={item.merchant_image_url || item.aw_image_url || ""}
                    brand={item.brand_name || item.merchant_name || ""}
                    is_sponsored={item.is_sponsored}
                    deliveryCost={item.delivery_cost}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </section>

        {/* ==================== LANGE PRODUKTBESCHREIBUNG ==================== */}
        {product.description && (
          <section className="max-w-content mx-auto px-4 pb-16">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-soft p-8">
              <h2 className="text-h3 font-display text-gray-900 mb-5">{t('productDetail.descriptionHeading')}</h2>
              <div className="prose max-w-none text-gray-750 leading-relaxed text-sm">
                {product.description.split('\n').map((para: string, idx: number) =>
                  para.trim() ? <p key={idx} className="mb-3">{para}</p> : null
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ==================== NEWSLETTER ==================== */}
      <NewsletterSection
        sectionClassName="bg-white section-pattern-1 py-12 border-t"
        cardClassName="bg-gray-50 rounded-3xl overflow-hidden shadow-soft-md max-w-content mx-auto"
        inputClassName="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
        buttonClassName="bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold shadow-cta hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98] transition-all duration-200 text-sm"
      />
    </div>
  );
}
