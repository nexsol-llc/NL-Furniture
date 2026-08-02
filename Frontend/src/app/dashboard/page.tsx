"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, LogOut, ShoppingBag, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getUser, clearUserToken, userFetch, type UserPayload } from "@/lib/userAuth";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import { useLanguage } from "@/providers/languageContext";

type Product = {
  _id: string;
  slug?: string;
  product_name: string;
  display_price: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  brand_name?: string;
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPayload | null | undefined>(undefined);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
    } else {
      setUser(u);
    }
  }, [router]);

  const loadWishlist = async () => {
    try {
      const res = await userFetch("/api/customer/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadWishlist();
  }, [user]);

  const handleRemove = async (productId: string) => {
    try {
      const res = await userFetch(`/api/customer/wishlist?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t('dashboard.removedFromWishlist'));
        setWishlist((prev) => prev.filter((p) => p._id !== productId));
      } else {
        toast.error(t('dashboard.removeFailed'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.removeError'));
    }
  };

  const handleLogout = () => {
    clearUserToken();
    router.push("/");
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Toaster position="top-center" />

      {/* TOP HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-content mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-xl tracking-tight">
            <span className="text-primary-600">DIE</span>WOHNEN
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium hidden sm:inline">
              {t('dashboard.welcome', { name: user.name })}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium transition"
            >
              <LogOut size={16} /> {t('dashboard.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <main className="flex-1 max-w-content w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* SIDEBAR: Profile Card */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-soft flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-soft-md mb-4 uppercase">
              {user.name ? user.name.substring(0, 2) : "U"}
            </div>

            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>

            <div className="mt-4 px-3 py-1 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-600 capitalize">
              {t('dashboard.roleLabel', { role: user.role || t('dashboard.defaultRole') })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-soft">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">{t('dashboard.navigationHeading')}</h3>
            <nav className="space-y-2">
              <Link href="/" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium transition">
                <ShoppingBag size={18} /> {t('dashboard.backToShop')}
              </Link>
            </nav>
          </div>
        </aside>

        {/* MAIN AREA: Wishlist Grid */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {t('dashboard.wishlistHeading')} <Heart className="fill-red-500 text-red-500" size={24} />
            </h1>
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">
              {wishlist.length} {wishlist.length === 1 ? t('dashboard.productCountSingular') : t('dashboard.productCountPlural')}
            </span>
          </div>

          {wishlist.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-soft flex flex-col items-center justify-center min-h-[300px]">
              <Heart size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">{t('dashboard.wishlistEmptyHeading')}</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                {t('dashboard.wishlistEmptyText')}
              </p>
              <Link
                href="/"
                className="mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition shadow-soft-md"
              >
                {t('dashboard.browseNow')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wishlist.map((item) => {
                const img = item.merchant_image_url || item.aw_image_url || null;
                const price = item.display_price ? item.display_price.replace(/EUR\s?/g, "€") : "";

                return (
                  <div
                    key={item._id}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-soft-lg transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                      <Link href={`/product/${item.slug || item._id}`} className="relative w-full h-full block">
                        <PlaceholderImage
                          src={img}
                          alt={item.product_name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition duration-500"
                        />
                      </Link>

                      <button
                        onClick={() => handleRemove(item._id)}
                        className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                        title={t('dashboard.removeFromWishlist')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      {item.brand_name && (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {item.brand_name}
                        </span>
                      )}

                      <Link href={`/product/${item.slug || item._id}`} className="mt-1">
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary-600 transition">
                          {item.product_name}
                        </h3>
                      </Link>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                        <span className="text-base font-extrabold text-primary-600">
                          {price}
                        </span>
                        <Link
                          href={`/product/${item.slug || item._id}`}
                          className="text-xs bg-gray-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-primary-600 transition"
                        >
                          {t('dashboard.view')}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
