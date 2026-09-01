"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import FAQSection from "@/app/components/FAQSection";
import NewsletterSection from "@/app/components/NewsletterSection";
import type { InfluencerPost, InfluencerProduct } from "@/lib/influencerCatalog";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUser, userFetch, type UserPayload } from "@/lib/userAuth";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import ShopLink from "@/app/components/ShopLink";
import { shopLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";
import { toPlainText } from "@/lib/richText";

type ApiProduct = {
  _id: string;
  slug?: string;
  product_name: string;
  brand_name?: string;
  merchant_name?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  display_price?: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
};

function formatPrice(price: string): string {
  return price.replace(/EUR\s?/gi, "€").trim();
}

function ShopProductCard({
  product,
  isFavorited,
  onToggleFavorite,
}: {
  product: InfluencerProduct;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}) {
  const { t } = useLanguage();
  // Products open at the merchant in a new tab. A look product saved without
  // a shop link has nowhere to go, so its tile stays unlinked.
  const hasExternalLink = !!(product as any).link;
  const href = hasExternalLink ? (product as any).link : "#";

  return (
    <a
      href={href}
      target={hasExternalLink ? "_blank" : undefined}
      rel={hasExternalLink ? "noopener noreferrer" : undefined}
      className="group relative block aspect-square overflow-hidden rounded-lg bg-[#f5f5f5] border border-gray-100 hover:shadow-soft-md transition-shadow"
    >
      <PlaceholderImage
        src={product.image}
        alt={product.name}
        fill
        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 768px) 25vw, 150px"
      />

      {product.hasPriceDrop && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm leading-none">
          {t('influencerPostPage.priceDrop')}
        </span>
      )}

      {hasExternalLink && (
        <span className="absolute top-2 left-2 bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          {t('influencerPostPage.shopArrow')}
        </span>
      )}

      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite();
        }}
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-soft flex items-center justify-center hover:scale-105 transition-transform z-10"
        aria-label={t('influencerPostPage.saveAriaLabel')}
      >
        <Heart
          size={14}
          className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}
        />
      </button>

      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-2 py-1.5 border-t border-gray-100">
        <p className="text-[10px] text-gray-600 line-clamp-1 leading-tight">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xs font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}


function SimilarProductCard({ product }: { product: ApiProduct }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPayload | null>(null);
  useEffect(() => { setUser(getUser()); }, []);

  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  const isFavorite = wishlistData?.products?.some((p: any) => p._id === product._id) || false;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(t('wishlist.loginRequired'));
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        const res = await userFetch(`/api/customer/wishlist?productId=${product._id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(t('wishlist.removeSuccess'));
          if (wishlistData && wishlistData.products) {
            const updated = wishlistData.products.filter((p: any) => p._id !== product._id);
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
          body: JSON.stringify({ productId: product._id }),
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

  const img = product.merchant_image_url || product.aw_image_url || null;
  const price = product.display_price?.replace(/EUR\s?/gi, "€") || "";

  return (
    <ShopLink href={shopLink(product)} className="group block cursor-pointer">
      <div className="relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
        <div className="relative aspect-square bg-[#f5f5f5]">
          <PlaceholderImage
            src={img}
            alt={product.product_name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <button
            onClick={toggleWishlist}
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white transition z-10"
          >
            <Heart size={14} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.4rem]">
            {product.product_name}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {product.brand_name || product.merchant_name || ""}
          </p>
          <p className="text-sm font-bold text-primary-600 mt-1.5">{price}</p>
        </div>
      </div>
    </ShopLink>
  );
}

export default function InfluencerPostPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useParams();
  const username = params?.username as string;
  const id = params?.id as string;

  const [post, setPost] = useState<InfluencerPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [heroFavorited, setHeroFavorited] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [similarProducts, setSimilarProducts] = useState<ApiProduct[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const [user, setUser] = useState<UserPayload | null>(null);
  useEffect(() => { setUser(getUser()); }, []);

  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  useEffect(() => {
    if (!username || !id) return;

    fetch(`/api/influencer-looks/${username}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        // API returns { look, brand } — flatten into the shape the page renders.
        const look = data.look ?? data;
        const brand = data.brand ?? {};
        setPost({
          ...look,
          username: look.username || username,
          displayName: brand.displayName || brand.name || "",
          avatar: brand.logo || "",
          caption: look.caption || "",
          products: look.products || [],
          faqs: look.faqs || [],
          similarCategories: look.similarCategories || [],
        } as unknown as InfluencerPost);
        setLoading(false);
      })
      .catch(() => {
        setPost(null);
        setLoading(false);
      });
  }, [username, id]);

  useEffect(() => {
    if (!post) return;

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const results: ApiProduct[] = [];
        for (const category of post.similarCategories) {
          const res = await fetch(
            `/api/products-by-category?category=${encodeURIComponent(category)}&limit=4`
          );
          if (res.ok) {
            const data = await res.json();
            const products: ApiProduct[] = data.products || data || [];
            results.push(...products);
          }
        }
        const unique = results.filter(
          (p, i, arr) => arr.findIndex((x) => x._id === p._id) === i
        );
        setSimilarProducts(unique.slice(0, 8));
      } catch (e) {
        console.error("Similar products fetch error:", e);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilar();
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">{t('influencerPostPage.loadingLook')}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('influencerPostPage.postNotFoundHeading')}</h1>
        <Link href={`/influencer/${username}`} className="text-sm text-gray-500 underline">
          {t('influencerPostPage.backToInfluencer')}
        </Link>
      </div>
    );
  }

  const toggleFavorite = async (dbProductId?: string, localId?: string) => {
    if (!dbProductId) {
      if (localId) {
        setFavorites((prev) => ({ ...prev, [localId]: !prev[localId] }));
      }
      return;
    }

    if (!user) {
      toast.error(t('wishlist.loginRequired'));
      router.push("/login");
      return;
    }

    const isFavorite = wishlistData?.products?.some((p: any) => p._id === dbProductId) || false;

    try {
      if (isFavorite) {
        const res = await userFetch(`/api/customer/wishlist?productId=${dbProductId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(t('wishlist.removeSuccess'));
          if (wishlistData && wishlistData.products) {
            const updated = wishlistData.products.filter((p: any) => p._id !== dbProductId);
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
          body: JSON.stringify({ productId: dbProductId }),
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

  return (
    <div className="min-h-screen bg-white">
      {/* ── INFLUENCER HEADER ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              <PlaceholderImage
                src={post.avatar}
                alt={post.displayName}
                fill
                className="object-cover"
              />
            </div>
            <Link href={`/influencer/${post.username}`} className="hover:opacity-80 transition">
              <p className="text-sm font-semibold text-gray-900">{post.username}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{post.displayName}</p>
            </Link>
            <button
              onClick={() => setFollowing(!following)}
              className={`ml-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                following
                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              {following ? t('influencerPostPage.following') : t('influencerPostPage.follow')}
            </button>
          </div>
          <span className="text-[10px] text-gray-400 tracking-wide">{t('influencerPostPage.paidLinks')}</span>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN LAYOUT (LTK style) ── */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-start">

          {/* LEFT — Hero Image + Caption */}
          <div className="lg:sticky lg:top-24">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-[600px] bg-gray-50">
              <PlaceholderImage
                src={post.heroImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              <button
                onClick={() => setHeroFavorited(!heroFavorited)}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white shadow-soft-md flex items-center justify-center hover:scale-105 transition-transform"
                aria-label={t('influencerPostPage.lookSaveAriaLabel')}
              >
                <Heart
                  size={18}
                  className={heroFavorited ? "fill-red-500 text-red-500" : "text-gray-500"}
                />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                <span className="font-bold">{post.title}!</span>{" "}
                {toPlainText(post.caption).replace(`${post.title}!`, "").trim() || toPlainText(post.caption)}
              </p>
            </div>
          </div>

          {/* RIGHT — Shop this post grid */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">{t('influencerPostPage.shopThisPost')}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {post.products.map((product) => {
                const isFavorited = product.productId
                  ? wishlistData?.products?.some((p: any) => p._id === product.productId)
                  : !!favorites[product.id];

                return (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    isFavorited={!!isFavorited}
                    onToggleFavorite={() => toggleFavorite(product.productId, product.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SIMILAR PRODUCTS ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-10 md:py-14">
        <div className="max-w-[1100px] mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            {t('influencerPostPage.similarProductsHeading')}
          </h2>

          {similarLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl aspect-square" />
              ))}
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarProducts.map((product) => (
                <SimilarProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {post.products.slice(0, 4).map((product) => (
                <div key={product.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-soft">
                  <div className="relative aspect-square bg-[#f5f5f5]">
                    <PlaceholderImage src={product.image} alt={product.name} fill className="object-contain p-3" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</p>
                    <p className="text-sm font-bold text-primary-600 mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── LONG CONTENT ── */}
      <section className="border-t border-gray-100 bg-white py-10 md:py-14">
        <div className="max-w-[760px] mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            {t('influencerPostPage.aboutThisLookHeading')}
          </h2>
          <div className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
            {/<[a-z][\s\S]*>/i.test(post.longContent || "") ? (
              <div
                className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                dangerouslySetInnerHTML={{ __html: post.longContent }}
              />
            ) : (
              (post.longContent || "").split("\n\n").map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                  return (
                    <h3 key={i} className="text-base font-bold text-gray-900 mt-6">
                      {trimmed.replace(/\*\*/g, "")}
                    </h3>
                  );
                }
                const parts = trimmed.split(/\*\*(.*?)\*\*/g);
                if (parts.length > 1) {
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          <strong key={j} className="font-semibold text-gray-900">
                            {part}
                          </strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </p>
                  );
                }
                return <p key={i}>{trimmed}</p>;
              })
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQs ── */}
      <FAQSection
        faqs={post.faqs}
        title={t('influencerPostPage.faqTitle')}
        sectionClassName="bg-[#fafafa] section-pattern-2 py-14 md:py-20 border-t border-gray-100"
      />

      {/* ── NEWSLETTER (admin-managed) ── */}
      <NewsletterSection
        sectionClassName="bg-white section-pattern-1 py-12 md:py-16 border-t border-gray-100"
        cardClassName="bg-gray-50 rounded-3xl overflow-hidden shadow-soft max-w-[1100px] mx-auto"
        inputClassName="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
        buttonClassName="bg-primary-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary-700 transition"
      />
    </div>
  );
}
