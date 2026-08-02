'use client';

import Image from 'next/image';
import { Heart, ArrowLeft, ArrowRight, Search, Camera, User } from 'lucide-react';
import Link from 'next/link';
import NewsletterSection from '../components/NewsletterSection';
import { useState } from 'react';
import { useLanguage } from '@/providers/languageContext';

// ====================== HEADER ======================
function ProductHeader() {
  const { t } = useLanguage();
  return (
    <header className="w-full border-b border-gray-200 sticky top-0 bg-white z-50">
      {/* Top Bar */}
      <div className="bg-[#2b2b2b] text-white text-sm">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between py-2">
          <span className="font-medium">{t('productDetailDemo.searchIn100Retailers')}</span>
          <div className="flex items-center gap-6 text-gray-300 text-xs">
            <span>JOHN LEWIS</span>
            <span>wayfair</span>
            <span>M&amp;S</span>
            <span>HEAL&apos;S</span>
            <span className="font-semibold text-white">Dunelm</span>
            <span>ANTHROPOLOGIE</span>
            <span>Argos</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary-500 rotate-45 rounded-sm flex items-center justify-center">
            <div className="-rotate-45 text-primary-500 text-lg">❤</div>
          </div>
          <span className="text-2xl font-bold text-gray-800">
            nl-furniture<span className="text-primary-500">.nl</span>
          </span>
        </div>

        <div className="flex-1 max-w-[700px]">
          <div className="flex items-center border rounded-md overflow-hidden bg-white shadow-sm">
            <input
              type="text"
              placeholder={t('productDetailDemo.searchPlaceholder')}
              className="flex-1 px-4 py-3 outline-none text-sm placeholder:text-gray-400"
            />
            <button className="px-4 text-gray-600 hover:text-black transition-colors">
              <Search size={18} />
            </button>
            <button className="px-4 border-l text-gray-600 hover:text-black transition-colors">
              <Camera size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary-600 transition-colors">
          <User size={20} />
          <span className="font-medium">{t('productDetailDemo.loginRegister')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t bg-white">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center gap-6 text-sm font-medium py-3 overflow-x-auto">
          <Link href="#" className="text-red-500 hover:text-red-600 whitespace-nowrap">{t('productDetailDemo.navOffers')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navFurniture')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navFurnishing')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navRugs')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navHomeAccessories')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navLighting')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navMattresses')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navKidsBaby')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navOutdoor')}</Link>
          <Link href="#" className="hover:text-primary-600 transition-colors whitespace-nowrap">{t('productDetailDemo.navIdeasGuides')}</Link>
        </div>
      </nav>
    </header>
  );
}

// ====================== ÄHNLICHE PRODUKTE DATA ======================
const similarProducts = [
  { id: 1, title: "Casa Padrino Barock 3-er Sofa 'King' Grau / Weiß – Möbel Barock", brand: "Casa Padrino", price: "€989,90", image: "", discount: null },
  { id: 2, title: "Casa Padrino Barock Sofa Master Royal Blau / Gold – Couch Lounge", brand: "Casa Padrino", price: "€1.299,90", originalPrice: "€1.499,90", discount: "10% Rabatt", image: "" },
  { id: 3, title: "Casa Padrino Luxus Klassik Wohnzimmer Sofa 180cm – Luxus-Qualität", brand: "Casa Padrino", price: "€1.599,90", image: "", discount: null },
  { id: 4, title: "Casa Padrino Barock Sofa Königsblau / Gold – Wohnzimmer Möbel", brand: "Casa Padrino", price: "€1.299,90", image: "", discount: null },
  { id: 5, title: "Casa Padrino Barock Sessel Dunkelblau / Gold – Luxus Wohnmöbel", brand: "Casa Padrino", price: "€799,90", image: "", discount: null },
  { id: 6, title: "Casa Padrino Chesterfield Sofa Dunkelgrün – Edles Design", brand: "Casa Padrino", price: "€1.099,90", originalPrice: "€1.299,90", discount: "15% Rabatt", image: "" },
  { id: 7, title: "Casa Padrino Barock Sofa Silber / Gold – Prunkvolles Wohnmöbel", brand: "Casa Padrino", price: "€1.199,90", image: "", discount: null },
  { id: 8, title: "Casa Padrino Barock Loveseat Rosa / Weiß – Romantisches Sofa", brand: "Casa Padrino", price: "€899,90", image: "", discount: null },
];

// ====================== MAIN PRODUCT DETAIL PAGE ======================
export default function ProductDetailPage() {
  const { t } = useLanguage();
  const product = {
    name: "Aspire End Lift Up Linen Ottoman King Bed Natural Elegant and Spacious Bedroom",
    brand: "Cheap Furniture Warehouse",
    price: "€234,99",
    description: `Dieses Stauraum-Ottomanbett von Aspire verfügt über ein klassisches Knopf-Finish am Kopf- und Fußteil. Das gepolsterte Kopfteil bietet zusätzlichen Komfort beim Aufsetzen im Bett, und das gesamte Bett ist mit einem hochwertigen Leinenstoff in einer weichen Naturfarbe bezogen, die sich mit allen Arten von Dekoren und Bettwäschedesigns kombinieren lässt. Der Lattenrost kann manuell mit Hilfe der Hydraulikkolben angehoben werden, um einen geräumigen Stauraum freizulegen, der sich perfekt für Reservebettwäsche und Kissen eignet.`,
    dimensions: "King Height - 96.5, Width 163, Depth 215 cm | Selbstmontage",
    // Add more image URLs here for multiple thumbnails
    images: [] as string[], // ← CSV images go here
    image: "", // ← main image
  };

  // Build images array – only real, non-empty URLs
  const allImages = [product.image, ...product.images].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  const [selectedImage, setSelectedImage] = useState<string>(
    allImages[0] || `https://placehold.co/600x600?text=${t('productDetailDemo.noImage')}`
  );

  const handlePrev = () => {
    if (allImages.length === 0) return;
    const idx = allImages.indexOf(selectedImage);
    setSelectedImage(allImages[idx > 0 ? idx - 1 : allImages.length - 1]);
  };

  const handleNext = () => {
    if (allImages.length === 0) return;
    const idx = allImages.indexOf(selectedImage);
    setSelectedImage(allImages[idx < allImages.length - 1 ? idx + 1 : 0]);
  };

  const displayImage = selectedImage || `https://placehold.co/600x600?text=${t('productDetailDemo.noImage')}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <ProductHeader />

      {/* ==================== PRODUCT DETAIL SECTION ==================== */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ---- Left: Images ---- */}
            <div className="space-y-3">
              {/* Main image */}
              <div className="relative aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md z-10 transition-all"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md z-10 transition-all"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails – only rendered when > 1 real image */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer bg-gray-50 flex items-center justify-center p-1 transition-all ${
                        img === selectedImage ? 'border-primary-500 shadow-sm' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Image src={img} alt={`thumbnail-${i}`} width={60} height={60} className="object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---- Right: Details ---- */}
            <div className="space-y-4">

              {/* Title – max 3 lines */}
              <h1
                className="text-xl lg:text-2xl font-bold leading-snug text-gray-900 line-clamp-3"
                title={product.name}
              >
                {product.name}
              </h1>

              {/* Brand – square, bigger logo */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-20 h-20 border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                  <span className="text-sm font-black text-gray-500 uppercase tracking-wide">
                    {product.brand.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{product.brand}</p>
                  <span className="inline-block text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-medium mt-1">
                    ✓ {t('productDetailDemo.verifiedShop')}
                  </span>
                </div>
              </div>

              {/* Price – smaller, € symbol */}
              <div className="text-xl font-black text-gray-900 tracking-tight">
                {product.price}
              </div>

              {/* Single centered button – German */}
              <div className="w-full">
                <button className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('productDetailDemo.goToShop')}
                </button>
              </div>

              {/* Description – German label, white/grey box */}
              <div className="hidden lg:block bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-2">{t('productDetailDemo.descriptionHeading')}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
              </div>

              {/* Dimensions */}
              {product.dimensions && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{t('productDetailDemo.dimensionsLabel')} </span>
                  {product.dimensions}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ==================== ÄHNLICHE PRODUKTE (2 Reihen) ==================== */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold mb-5">{t('productDetailDemo.similarProductsHeading')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similarProducts.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={item.image || `https://placehold.co/300x300?text=${t('productDetailDemo.noImage')}`}
                    alt={item.title}
                    fill
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      {item.discount}
                    </div>
                  )}
                  <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-50 transition">
                    <Heart size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="mt-2 px-0.5">
                <p className="text-sm text-gray-800 line-clamp-2 leading-tight font-medium">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-bold text-sm text-primary-600">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== LANGE PRODUKTBESCHREIBUNG ==================== */}
      <section className="max-w-[1200px] mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('productDetailDemo.descriptionPageHeading')}</h2>
          <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
        </div>
      </section>

      {/* ==================== NEWSLETTER (admin-managed) ==================== */}
      <NewsletterSection
        sectionClassName="bg-white py-16 border-t border-gray-200"
        cardClassName="bg-gray-50 rounded-3xl overflow-hidden shadow-sm max-w-[1200px] mx-auto"
        inputClassName="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        buttonClassName="bg-primary-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition text-sm whitespace-nowrap"
      />
    </div>
  );
}