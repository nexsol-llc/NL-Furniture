"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, Loader2, ArrowLeft, Search, LayoutGrid, ShoppingBag, ExternalLink } from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUser, userFetch, type UserPayload } from "@/lib/userAuth";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import { useLanguage } from "@/providers/languageContext";
import { toPlainText } from "@/lib/richText";

/* ─── Types ─── */
type LookProduct = {
  id: string;
  name: string;
  image: string;
  price: string;
  originalPrice?: string;
  link?: string;
  productId?: string;
};

type BrandLook = {
  id: string;
  lookId: string;
  heroImage: string;
  title: string;
  caption: string;
  productCount: number;
  products?: LookProduct[];
};

type BrandInfo = {
  username: string;
  name: string;
  displayName: string;
  logo: string;
  bio: string;
};

function formatPrice(price: string): string {
  return (price || "").replace(/EUR\s?/gi, "€").trim();
}

/* ─── Product Card ─── */
function ProductCard({ product, lookId, username }: { product: LookProduct; lookId: string; username: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPayload | null>(null);
  useEffect(() => { setUser(getUser()); }, []);

  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  const isFavorite = (product.productId && wishlistData?.products?.some((p: any) => p._id === product.productId)) || false;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.productId) {
      toast.error(t('influencerBrandPage.cannotFavoriteProduct'));
      return;
    }

    if (!user) {
      toast.error(t('wishlist.loginRequired'));
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        const res = await userFetch(`/api/customer/wishlist?productId=${product.productId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(t('wishlist.removeSuccess'));
          if (wishlistData && wishlistData.products) {
            const updated = wishlistData.products.filter((p: any) => p._id !== product.productId);
            mutateWishlist({ ...wishlistData, products: updated }, false);
          } else {
            mutateWishlist();
          }
        } else {
          toast.error(t('wishlist.removeError'));
        }
      } else {
        const res = await userFetch("/api/customer/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: product.productId }),
        });
        if (res.ok) {
          toast.success(t('wishlist.addSuccess'));
          mutateWishlist();
        } else {
          toast.error(t('wishlist.addError'));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t('wishlist.updateError'));
    }
  };

  // The shop link always opens in a new tab. Without one there is nowhere
  // external to send the visitor, so the card falls back to its own look.
  const handleClick = (e: React.MouseEvent) => {
    if (product.link) {
      e.preventDefault();
      window.open(product.link, "_blank", "noopener noreferrer");
    }
  };

  const href = product.link || `/influencer/${username}/posts/${lookId}`;

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5">
      <a href={href} onClick={handleClick} target={product.link ? "_blank" : undefined} rel={product.link ? "noopener noreferrer" : undefined}>
        <div className="relative aspect-square bg-[#f7f7f7] overflow-hidden">
          <PlaceholderImage
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />

          {/* Affiliate badge */}
          {product.link && (
            <span className="absolute top-2 left-2 bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <ExternalLink size={8} /> {t('influencerBrandPage.shopBadge')}
            </span>
          )}

          <button
            onClick={toggleWishlist}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Heart size={13} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
        </div>

        <div className="p-3">
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.4rem]">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm font-bold text-primary-600">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InfluencerBrandPage() {
  const params = useParams();
  const username = params?.username as string;
  const { t } = useLanguage();

  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [looks, setLooks] = useState<BrandLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"looks" | "products">("looks");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (!username) return;
    fetch(`/api/influencer-brands/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setBrand(data.brand);
        setLooks(data.looks || []);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [username]);

  /* Flatten all products from all looks */
  const allProducts = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<LookProduct & { lookId: string }> = [];
    for (const look of looks) {
      for (const p of look.products || []) {
        const key = p.id || p.name;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...p, lookId: look.lookId || look.id });
        }
      }
    }
    return result;
  }, [looks]);

  /* Filter by search */
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-primary-600" />
          <p className="text-sm">{t('influencerBrandPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('influencerBrandPage.notFoundHeading')}</h1>
        <Link href="/influencer" className="text-sm text-primary-600 underline">{t('influencerBrandPage.viewAllInfluencers')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Brand Header ── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-30 shadow-soft">
        <div className="max-w-[1100px] mx-auto px-4 py-3">
          <Link
            href="/influencer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-3 transition"
          >
            <ArrowLeft size={13} /> {t('influencerBrandPage.allInfluencers')}
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0 shadow-soft">
                <PlaceholderImage
                  src={brand.logo}
                  alt={brand.displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{brand.displayName}</h1>
                <p className="text-xs text-gray-400">@{brand.username}</p>
                {brand.bio && <p className="text-xs text-gray-500 mt-0.5 max-w-md line-clamp-1">{toPlainText(brand.bio)}</p>}
              </div>
              <button
                onClick={() => setFollowing(!following)}
                className={`ml-1 px-5 py-2 rounded-full text-xs font-semibold transition-colors ${
                  following
                    ? "bg-gray-100 text-gray-700 border border-gray-200"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {following ? t('influencerBrandPage.following') : t('influencerBrandPage.follow')}
              </button>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{looks.length}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('influencerBrandPage.looksLabel')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{allProducts.length}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('influencerBrandPage.productsLabel')}</p>
              </div>
              <span className="text-[10px] text-gray-400 tracking-wide hidden sm:block ml-2">{t('influencerBrandPage.paidLinks')}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("looks")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "looks"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={14} /> {t('influencerBrandPage.looksLabel')}
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "products"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <ShoppingBag size={14} /> {t('influencerBrandPage.productsLabel')}
              {allProducts.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {allProducts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── LOOKS TAB ── */}
      {activeTab === "looks" && (
        <div className="max-w-[1100px] mx-auto px-4 py-8 md:py-12">
          {looks.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📸</p>
              <p>{t('influencerBrandPage.noLooksYet')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {looks.map((look) => (
                <Link
                  key={look.lookId || look.id}
                  href={`/influencer/${username}/posts/${look.lookId || look.id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-50 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Image
                    src={look.heroImage}
                    alt={look.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart size={16} className="text-gray-500" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-bold line-clamp-1">{look.title}</p>
                    <p className="text-white/70 text-[11px] mt-0.5">{t('influencerBrandPage.productsCount', { count: look.productCount })}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === "products" && (
        <div className="max-w-[1100px] mx-auto px-4 py-6 md:py-10">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10 transition-all max-w-md">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder={t('influencerBrandPage.productSearchPlaceholder')}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
              {productSearch && (
                <button onClick={() => setProductSearch("")} className="text-gray-400 hover:text-gray-700 text-xs">
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1">
              {filteredProducts.length === 1
                ? t('influencerBrandPage.productsFoundSingular', { count: filteredProducts.length })
                : t('influencerBrandPage.productsFoundPlural', { count: filteredProducts.length })}
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🛍️</p>
              <p className="font-medium text-gray-600">
                {productSearch ? t('influencerBrandPage.noProductsForSearch', { search: productSearch }) : t('influencerBrandPage.noProductsAvailable')}
              </p>
              {productSearch && (
                <button onClick={() => setProductSearch("")} className="mt-3 text-sm text-primary-600 underline">
                  {t('influencerListPage.resetSearch')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id || p.name}
                  product={p}
                  lookId={p.lookId}
                  username={username}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
