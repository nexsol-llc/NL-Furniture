"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUser, userFetch, type UserPayload } from "@/lib/userAuth";
import { useLanguage } from "@/providers/languageContext";

const formatPrice = (priceStr: string | null | undefined): string => {
  if (!priceStr) return "0,00 €";
  const clean = priceStr.replace(/€/g, "").replace(/EUR/i, "").trim();
  return `${clean} €`;
};

interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  price: string;
  image: string;
  brand: string;
  is_sponsored?: boolean;
  discount?: string;
  originalPrice?: string;
  deliveryCost?: string;
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  image,
  brand,
  is_sponsored,
  discount,
  originalPrice,
  deliveryCost,
}: ProductCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  const isFavorite = wishlistData?.products?.some((p: any) => p._id === id) || false;

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
        const res = await userFetch(`/api/customer/wishlist?productId=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(t('wishlist.removeSuccess'));
          if (wishlistData?.products) {
            const updated = wishlistData.products.filter((p: any) => p._id !== id);
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
          body: JSON.stringify({ productId: id }),
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
    <div className="group relative flex h-full flex-col max-w-[280px] bg-white hover:bg-white overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 rounded-xl border border-gray-200/80 shadow-soft">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link href={`/product/${slug || id}`} className="relative block h-full w-full">
          <Image
            src={image || "https://placehold.co/400x400?text=No+Image"}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            className="object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Favorite Button */}
        <button
          onClick={toggleWishlist}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 shadow-soft-sm backdrop-blur-sm transition-all hover:bg-white"
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute left-0 top-4 z-10 bg-primary-500 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
            -{discount}
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-2 bg-white">
        <div className="mb-1">
          {brand && !brand.toLowerCase().includes("nl furniture") && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {brand}
            </p>
          )}
          <Link href={`/product/${slug || id}`}>
            <h3 className="line-clamp-2 text-sm font-medium text-gray-800 leading-tight group-hover:text-black transition-colors">
              {name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto pt-3 flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black ${discount ? 'text-primary-500' : (originalPrice ? 'text-red-600' : 'text-gray-900')}`}>
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* {is_sponsored && (
            <div className="mt-2 flex items-center">
              <span className="bg-primary-500 px-2.5 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider">
                Top seller
              </span>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
