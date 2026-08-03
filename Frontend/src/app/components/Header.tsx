'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Heart, User, X, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { getUser, userFetch, type UserPayload } from "@/lib/userAuth";
import VisualSearchModal from "./VisualSearchModal";
import { Spotlight } from "./motion/Spotlight";
import { useLanguage } from "@/providers/languageContext";

function DSearchIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-md bg-primary-500 text-white shadow-soft-sm"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        <path d="M12 2a.75.75 0 0 1 .75.75c0 4.14 3.36 7.5 7.5 7.5a.75.75 0 0 1 0 1.5c-4.14 0-7.5 3.36-7.5 7.5a.75.75 0 0 1-1.5 0c0-4.14-3.36-7.5-7.5-7.5a.75.75 0 0 1 0-1.5c4.14 0 7.5-3.36 7.5-7.5A.75.75 0 0 1 12 2z" />
      </svg>
    </span>
  );
}

function useTypewriterPlaceholder(
  lines: string[],
  typingSpeed = 70,
  pauseAfterComplete = 2200
) {
  const [text, setText] = useState("");

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      const currentLine = lines[lineIndex];

      if (charIndex < currentLine.length) {
        charIndex += 1;
        setText(currentLine.slice(0, charIndex));
        timeoutId = setTimeout(typeNext, typingSpeed);
        return;
      }

      timeoutId = setTimeout(() => {
        lineIndex = (lineIndex + 1) % lines.length;
        charIndex = 0;
        setText("");
        timeoutId = setTimeout(typeNext, typingSpeed);
      }, pauseAfterComplete);
    };

    typeNext();
    return () => clearTimeout(timeoutId);
  }, [lines, typingSpeed, pauseAfterComplete]);

  return text;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, tList } = useLanguage();

  const NAV_LINKS = [
    { label: t('header.navTopAngebote'), href: "/topaanbiedingen" },
    { label: t('header.navMarken'), href: "/merken" },
    { label: t('header.navInfluencer'), href: "/influencer" },
    { label: t('header.navKategorie'), href: "/categorie" },
    { label: t('header.navMagazine'), href: "/magazine" },
  ];

  const [query, setQuery] = useState("");
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const searchPlaceholders = tList<string>('header.searchPlaceholders');
  const animatedPlaceholder = useTypewriterPlaceholder(searchPlaceholders);
  const headerRef = useRef<HTMLDivElement>(null);

  // Expose the floating header's height as a CSS variable so pages that start
  // with a top hero image can pull it up behind the bar and pad its content.
  useEffect(() => {
    const measure = () => {
      if (!headerRef.current) return;
      document.documentElement.style.setProperty(
        "--header-height",
        `${headerRef.current.offsetHeight}px`
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The home page shows its own big AI search bar in the hero,
  // so the header search is hidden there.
  const isHome = pathname === "/";
  const headerSurfaceClass = isHome
    ? "glass-panel"
    : "bg-gradient-to-r from-primary-400/85 via-primary-500/85 to-primary-400/85 backdrop-blur-xl";
  const navLinkClass = isHome
    ? "text-gray-700 hover:text-primary-600"
    : "text-white hover:text-white/90";
  const mobileNavLinkClass = isHome
    ? "text-gray-600 hover:text-primary-600"
    : "text-white hover:text-white/90";
  const iconLinkClass = isHome
    ? "hover:bg-gray-100 text-gray-900"
    : "text-white hover:bg-white/15";
  const wishlistIconClass = isHome ? "group-hover:text-red-500" : "group-hover:text-white";
  const accountIconClass = isHome ? "group-hover:text-primary-600" : "group-hover:text-white";
  const headerDividerClass = isHome ? "border-gray-100" : "border-white/20";
  const logoSrc = isHome ? "/nl-furniture_logo_dark.png" : "/nl-furniture_logo_light.png";

  const [user, setUser] = useState<UserPayload | null>(null);
  useEffect(() => {
    setUser(getUser());
  }, []);

  const { data: wishlistData } = useSWR(
    user ? "/api/customer/wishlist" : null,
    (url: string) => userFetch(url).then((res) => res.json())
  );

  const wishlistCount = wishlistData?.products?.length || 0;

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/\s+/g, "-");

  useEffect(() => {
    setQuery("");
  }, [pathname]);

  // Scroll hide header effect
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const scrollDown = currentScrollY > lastScrollY && currentScrollY > 80;

      if (headerRef.current) {
        headerRef.current.style.transform = scrollDown
          ? 'translateY(-100%)'
          : 'translateY(0)';
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/categorie/${slugify(query)}`);
    setQuery("");
  };

  return (
    <>
      <div
        ref={headerRef}
        className="sticky top-0 z-[999] flex flex-col will-change-transform transition-transform duration-300 ease-out"
        style={{ transform: 'translateY(0)', marginBottom: 'calc(-1 * var(--header-height))' }}
      >
        {/* Ambient color aura behind the floating header — gives the glass panel's
            backdrop-blur something to actually blur so it's visibly "glass" on
            every page, not just when a photo happens to scroll underneath. */}
        <div className="pointer-events-none absolute -inset-x-2 -top-6 h-24 -z-10 overflow-visible" aria-hidden="true">
          <div className="absolute left-[8%] top-0 h-20 w-40 rounded-full bg-primary-400/50 blur-3xl" />
          <div className="absolute right-[12%] top-0 h-20 w-40 rounded-full bg-primary-600/40 blur-3xl" />
        </div>

        {/* Main Header */}
        <header className={`relative ${headerSurfaceClass} shadow-depth-2 rounded-2xl mx-3 md:mx-6 mt-3`}>
          <div className="max-w-content mx-auto px-4 md:px-6">

            {/* Top Row: logo + menu + search (not on home) + icons */}
            <div className="flex items-center gap-2 h-12 md:h-16">

              <Link href="/" className="relative h-full w-[145px] shrink-0 md:w-[215px] ml-1 md:ml-4">
                <Image
                  src={logoSrc}
                  alt="NL FURNITURE"
                  width={1000}
                  height={249}
                  priority
                  className="absolute inset-0 h-full w-full object-contain transition-all duration-300"
                />
              </Link>

              {/* Desktop Menu (ShopForward style, inline next to logo) */}
              <nav className="hidden lg:flex items-center gap-x-6 xl:gap-x-8 text-sm whitespace-nowrap shrink-0 ml-2 xl:ml-6">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${navLinkClass} hover:underline transition font-medium`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Search — inline bar (hidden on home, hero has its own) */}
              {!isHome && (
              <div className="flex md:hidden flex-1 max-w-[130px] min-w-[95px] ml-auto relative rounded-full p-[2px] bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 shadow-md shadow-primary-500/25">
                <form onSubmit={handleSearch} className="relative w-full bg-gray-100 rounded-full flex items-center">
                  <button type="submit" className="ml-3 mr-1.5 shrink-0 transition-opacity hover:opacity-80 flex items-center justify-center">
                    <DSearchIcon size={18} />
                  </button>
                  <div className="relative flex-1 min-w-0">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('header.mobileSearchPlaceholder')}
                      className="w-full bg-transparent border-none py-2 pr-2 text-xs text-gray-900 outline-none focus:ring-0"
                    />
                  </div>
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="p-1.5 mr-1 text-gray-500 hover:text-gray-800 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </form>
              </div>
              )}

              {/* Desktop Search (hidden on home, hero has its own) */}
              {!isHome ? (
              <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-6 relative group rounded-full p-[2px] bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 shadow-lg shadow-primary-500/30">
                <Spotlight size={220} className="from-white/70 via-white/25" />
                <form onSubmit={handleSearch} className="relative w-full bg-gray-100 rounded-full flex items-center">
                  <button type="submit" className="relative ml-5 mr-3 transition-opacity hover:opacity-80 flex items-center justify-center">
                    <DSearchIcon size={22} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder=""
                      className="w-full bg-transparent border-none py-3 text-sm text-gray-900 outline-none focus:ring-0"
                    />
                    {!query && (
                      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        {animatedPlaceholder}
                        <span className="animate-pulse">|</span>
                      </span>
                    )}
                  </div>
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="p-2 text-gray-500 hover:text-gray-800"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowVisualSearch(true)}
                    className="p-2 mr-3 text-gray-500 hover:text-gray-800"
                    title={t('header.visualSearchTitle')}
                  >
                    <Camera size={20} />
                  </button>
                </form>
              </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* Wishlist + Account Icons (Mobile & Desktop) */}
              <div className="flex items-center gap-2 md:gap-6 shrink-0">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className={`p-1.5 md:p-2 ${iconLinkClass} rounded-full transition group relative flex items-center justify-center`}
                  title={t('header.wishlistTitle')}
                >
                  <Heart size={22} className={`md:w-[26px] md:h-[26px] ${wishlistIconClass} transition-colors`} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 md:top-0.5 md:right-0.5 bg-primary-600 text-white text-[8px] md:text-[10px] font-extrabold h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center border-2 border-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className={`p-1.5 md:p-2 ${iconLinkClass} rounded-full transition group flex items-center justify-center`}
                  title={user ? t('header.myAccount') : t('header.login')}
                >
                  <User size={22} className={`md:w-[26px] md:h-[26px] ${accountIconClass} transition-colors`} />
                </Link>
              </div>
            </div>

            {/* Navigation Bar (mobile/tablet only — desktop menu is inline in the top row) */}
            <div className={`border-t ${headerDividerClass} lg:hidden`}>
              <div className="w-full flex justify-start md:justify-center overflow-x-auto hide-scrollbar">
                <nav className="flex items-center gap-x-6 md:gap-x-8 text-sm whitespace-nowrap py-3">
                  {NAV_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${mobileNavLinkClass} hover:underline transition font-medium`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </header>
      </div>

      <VisualSearchModal open={showVisualSearch} onClose={() => setShowVisualSearch(false)} />
    </>
  );
}
