"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUser, userFetch, type UserPayload } from "@/lib/userAuth";
import { formatPrice, normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

export interface OfferProductCardProps {
  title: string;
  image?: string;
  /** Merchant/affiliate target. Missing or "#" renders the card unlinked. */
  link?: string;
  price?: string;
  oldPrice?: string;
  /** Discount badge copy, e.g. "-30%". Also switches the price to the sale color. */
  saleValue?: string;
  brandName?: string;
  brandLogo?: string;
  /** Shown above the title when the product carries no brand name. */
  categoryLabel?: string;
  /**
   * Catalog `products.id`. Only pass it for products that exist in the main
   * catalog — the wishlist resolves ids against that table, so an id from a
   * feed table (home_products, top_angebote_products) would save without ever
   * showing up again. Omitted => the heart is decorative, matching those feeds.
   */
  wishlistId?: string;
}

export default function OfferProductCard({
  title,
  image,
  link,
  price,
  oldPrice,
  saleValue,
  brandName,
  brandLogo,
  categoryLabel,
  wishlistId,
}: OfferProductCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    if (wishlistId) setUser(getUser());
  }, [wishlistId]);

  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    wishlistId && user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  const isFavorite =
    wishlistData?.products?.some((p: any) => p._id === wishlistId) || false;

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
        const res = await userFetch(`/api/customer/wishlist?productId=${wishlistId}`, {
          method: "DELETE",
        });
        if (!res.ok) return toast.error(t('wishlist.removeError'));
        toast.success(t('wishlist.removeSuccess'));
        mutateWishlist(
          wishlistData?.products
            ? {
                ...wishlistData,
                products: wishlistData.products.filter((p: any) => p._id !== wishlistId),
              }
            : undefined
        );
      } else {
        const res = await userFetch("/api/customer/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: wishlistId }),
        });
        if (!res.ok) return toast.error(t('wishlist.addError'));
        toast.success(t('wishlist.addSuccess'));
        mutateWishlist();
      }
    } catch (err) {
      console.error(err);
      toast.error(t('wishlist.updateError'));
    }
  };

  const priceLabel = formatPrice(price);
  const oldPriceLabel = formatPrice(oldPrice);
  const href = normalizeLink(link);

  const card = (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
      {/* PRODUCT IMAGE (top) */}
      <div className="relative h-44 bg-gray-50 flex items-center justify-center p-3">
        {saleValue && (
          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-0.5 font-bold z-10 rounded-md shadow-soft-sm">
            {saleValue}
          </span>
        )}

        {wishlistId ? (
          <button
            onClick={toggleWishlist}
            aria-label={isFavorite ? t('wishlist.removeAriaLabel') : t('wishlist.addAriaLabel')}
            className="absolute top-2 right-2 text-gray-400 hover:text-rose-500 z-10 transition-colors"
          >
            <Heart size={18} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
          </button>
        ) : (
          // Decorative only: these feeds have no catalog id to save against, and a
          // real <button> here would nest interactive content inside the card link.
          <span aria-hidden="true" className="absolute top-2 right-2 text-gray-400 z-10">
            <Heart size={18} />
          </span>
        )}

        {image ? (
          // Plain <img>: product images come from arbitrary merchant/affiliate
          // hosts that Next's optimizer often can't fetch. This loads them directly.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">
            {t('offerProductCard.noImage')}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Brand name when available, otherwise the category label */}
        <span className="text-xs text-gray-500 uppercase">{brandName || categoryLabel}</span>
        <h3 className="font-medium mt-1 text-gray-900 line-clamp-2 min-h-[2.5rem] text-sm">
          {title}
        </h3>
        {/* Brand logo (left) and price (right) on one row → shorter card.
            Both keep their intrinsic size; when the card is too narrow to hold
            them side by side the price wraps onto its own line rather than
            being clipped by the card's overflow-hidden. */}
        <div className="mt-auto pt-2 flex flex-wrap items-center justify-end gap-2">
          {brandLogo && (
            <div className="relative h-11 aspect-[3/1] rounded-lg overflow-hidden border border-gray-200 bg-white shadow-soft-sm flex-shrink-0 mr-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogo}
                alt={brandName || ""}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          {priceLabel && (
            <span className="flex items-baseline gap-1.5 flex-shrink-0 whitespace-nowrap">
              <p className={`font-bold text-base ${saleValue ? "text-red-600" : "text-gray-900"}`}>
                {priceLabel}
              </p>
              {oldPriceLabel && (
                <span className="text-xs text-gray-400 line-through">{oldPriceLabel}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href === "#") return card;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
      {card}
    </a>
  );
}
