'use client';

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import CookieConsentBanner from "./CookieConsentBanner";

export default function ConditionalWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isCoupansRoute = pathname?.startsWith('/kortingscodes');
  const isAdminRoute = pathname?.startsWith('/admin');
  const showCookieBanner = !isCoupansRoute && !isAdminRoute;

  if (isCoupansRoute) {
    return <>{children}</>;
  }

  if (isAdminRoute) {
    return (
      <>
        <header className="sticky top-0 z-[999] bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center px-4">
            <Link href="/admin" className="relative h-full w-[170px] overflow-hidden">
              <Image
                src="/nl-furniture_logo_dark.png"
                alt="NL FURNITURE"
                width={500}
                height={500}
                priority
                className="absolute left-0 top-[-46px] h-[160px] w-[160px] max-w-none object-contain"
              />
            </Link>
          </div>
        </header>
        {children}
      </>
    );
  }

  return (
    <>
      <Header />
      {/* The page's own root element is padded (via .page-content) by the
          floating header's height, so its background fills the area behind the
          bar and only its content clears it. Hero pages cancel this with -mt. */}
      <div className="page-content">{children}</div>
      <Footer />
      {showCookieBanner && <CookieConsentBanner />}
    </>
  );
} 
