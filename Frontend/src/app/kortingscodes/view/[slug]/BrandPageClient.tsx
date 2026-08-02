"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Star, StarHalf, ThumbsUp, ThumbsDown, Lightbulb, Twitter, Instagram, Linkedin, Globe as GlobeIcon } from "lucide-react";
import FAQSection from "@/app/components/FAQSection";
import NewsletterSection from "@/app/components/NewsletterSection";
import { getVisitorId } from "@/lib/visitorId";
import { useTurnstileToken } from "@/lib/useTurnstileToken";
import { useLanguage } from "@/providers/languageContext";
import { LOCALE_TAG } from "@/lib/languageDefaults";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CouponKind = "code" | "sale" | "free-shipping";

function getCouponKind(coupon: any): CouponKind {
  const type = (coupon.type || "").toLowerCase();
  if (type === "sale") return "sale";
  if (type === "free-shipping") return "free-shipping";

  const badge = (coupon.badge || "").toUpperCase();
  if (badge === "SALE" || badge === "VERKAUF") return "sale";
  if (badge === "VERSAND" || badge === "FREE SHIPPING" || badge === "ANGEBOT") return "free-shipping";

  return "code";
}

// The vertical dashed separator between the discount box and the offer details.
// Darker + thicker than a hairline and stretched to the full height of the row so
// it clearly reads as a divider (light-grey gaps keep it looking like one line).
function DottedDivider() {
  return (
    <div
      className="hidden sm:block w-0.5 shrink-0 self-stretch -my-4 sm:-my-6 pointer-events-none"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 10px, transparent 10px, transparent 18px)",
      }}
      aria-hidden
    />
  );
}

function normalizeExternalUrl(url?: string) {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Localized month names so a stored date (ISO or "9.7.2026") always renders as
// "9. Juli 2026" / "July 9, 2026" instead of a locale-dependent numeric string.
function formatBrandDate(input: string | undefined, monthNames: string[]): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  let d: Date | null = null;
  const dotMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dotMatch) {
    const day = Number(dotMatch[1]);
    const month = Number(dotMatch[2]);
    let year = Number(dotMatch[3]);
    if (year < 100) year += 2000;
    d = new Date(year, month - 1, day);
  } else if (isoMatch) {
    // Build from local components — `new Date(isoString)` parses as UTC
    // midnight, which can shift a day back in negative-offset timezones.
    d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  } else {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) d = parsed;
  }

  if (!d || isNaN(d.getTime())) return raw; // leave whatever the admin typed
  return `${d.getDate()}. ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

// Links inside the admin-authored long description must escape our own site.
// A schemeless href like "facebook.com/x" would otherwise resolve relative to
// the current route and keep the user trapped inside our domain, so we upgrade
// external links to absolute https URLs and force them to open in a new tab.
function processBrandContent(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (href.startsWith("//")) {
        a.setAttribute("href", `https:${href}`);
      } else if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) {
        // Bare domain (e.g. "facebook.com/x") — treat as external.
        a.setAttribute("href", `https://${href}`);
      }
      // Root-relative "/..." links stay internal; everything else opens externally.
      if (!href.startsWith("/") || href.startsWith("//")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer nofollow");
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

const DISPLAY_RATING = "4.9";

// Votes are anonymous — every request carries the device's visitor id so the
// backend can cap it at one vote per coupon (no login involved).
const votesFetcher = (url: string) =>
  fetch(url, { headers: { "X-Visitor-Id": getVisitorId() } }).then((res) => res.json());

export default function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, tList, language } = useLanguage();
  const monthNames = tList<string>('brandPage.months');
  const couponViewFAQs = [
    { question: t('brandPage.defaultFaq1Q'), answer: t('brandPage.defaultFaq1A') },
    { question: t('brandPage.defaultFaq2Q'), answer: t('brandPage.defaultFaq2A') },
    { question: t('brandPage.defaultFaq3Q'), answer: t('brandPage.defaultFaq3A') },
    { question: t('brandPage.defaultFaq4Q'), answer: t('brandPage.defaultFaq4A') },
    { question: t('brandPage.defaultFaq5Q'), answer: t('brandPage.defaultFaq5A') },
  ];

  const [openId, setOpenId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [closedCoupons, setClosedCoupons] = useState<string[]>([]);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Interactive rating: the visitor can click to rate, but the headline score
  // stays pinned at 4.9 regardless of what they pick.
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const { data: couponData, isLoading: couponsLoading } = useSWR(
    `/api/coupons?brandSlug=${slug}`,
    fetcher
  );
  const { data: brandData } = useSWR("/api/brands", fetcher);
  const { data: brandProductsData } = useSWR(
    slug ? `/api/coupon-brand-products?brandSlug=${slug}` : null,
    fetcher
  );

  const brand = brandData?.brands?.find((b: any) => b.slug === slug);
  const coupons = couponData?.coupons || [];
  const activeCoupons = coupons.filter((c: any) => !c.isExpired);
  const expiredCoupons = coupons.filter((c: any) => c.isExpired);
  const brandProducts: any[] = Array.isArray(brandProductsData) ? brandProductsData : [];
  const popularStores: any[] = (brandData?.brands || []).filter((b: any) => b.featured && b.slug !== slug);

  // Real visitor likes/dislikes — batched so the whole coupon list is one request.
  const couponIds = useMemo(() => coupons.map((c: any) => c._id).filter(Boolean), [coupons]);
  const votesKey = couponIds.length ? `/api/coupon-votes-batch?ids=${couponIds.join(",")}` : null;
  const { data: votesData, mutate: mutateVotes } = useSWR(votesKey, votesFetcher);
  const votesMap: Record<string, { likes: number; dislikes: number; myVote: string | null }> = votesData?.votes || {};

  // Invisible Cloudflare Turnstile widget — proves a vote came from a human
  // without requiring an account or a visible challenge in the normal case.
  const { containerRef: turnstileRef, consumeToken } = useTurnstileToken();

  const handleVote = useCallback(
    async (couponId: string, type: "like" | "dislike") => {
      const prevEntry = votesMap[couponId] || { likes: 0, dislikes: 0, myVote: null };
      const nextEntry = { ...prevEntry };
      if (prevEntry.myVote === type) {
        nextEntry.myVote = null;
        if (type === "like") nextEntry.likes = Math.max(0, nextEntry.likes - 1);
        else nextEntry.dislikes = Math.max(0, nextEntry.dislikes - 1);
      } else {
        if (prevEntry.myVote === "like") nextEntry.likes = Math.max(0, nextEntry.likes - 1);
        if (prevEntry.myVote === "dislike") nextEntry.dislikes = Math.max(0, nextEntry.dislikes - 1);
        nextEntry.myVote = type;
        if (type === "like") nextEntry.likes += 1;
        else nextEntry.dislikes += 1;
      }

      mutateVotes(
        { votes: { ...(votesData?.votes || {}), [couponId]: nextEntry } },
        false
      );

      try {
        const res = await fetch(`/api/coupons/${couponId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Visitor-Id": getVisitorId() },
          body: JSON.stringify({ type, turnstileToken: consumeToken() }),
        });
        if (res.ok) {
          const fresh = await res.json();
          mutateVotes(
            (curr: any) => ({ votes: { ...(curr?.votes || {}), [couponId]: fresh } }),
            false
          );
        } else {
          toast.error(t('brandPage.voteError'));
          mutateVotes();
        }
      } catch {
        mutateVotes();
      }
    },
    [votesMap, votesData, mutateVotes, consumeToken]
  );

  const openAffiliateInBackground = useCallback((url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleShowCode = useCallback((coupon: any) => {
    setOpenId(coupon._id);
    setActiveCoupon(coupon);
    setCodeRevealed(true);
    setCodeCopied(false);
    setShowPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    if (activeCoupon) {
      setClosedCoupons((prev) => [...prev, activeCoupon._id]);
    }
    setShowPopup(false);
    setActiveCoupon(null);
    setOpenId(null);
    setCodeRevealed(false);
    setCodeCopied(false);
  }, [activeCoupon]);

  const handleCopyCode = useCallback((code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCodeCopied(true);
    }
    // Open the shop in a new tab (keeps the user on this page).
    if (activeCoupon?.url) {
      openAffiliateInBackground(activeCoupon.url);
    }
  }, [activeCoupon, openAffiliateInBackground]);

  const handleInlineCopyCode = useCallback((code: string, url?: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
    }
    if (url) {
      window.location.href = url;
    }
  }, []);

  const handleShopNow = useCallback(() => {
    if (activeCoupon?.url) {
      window.open(activeCoupon.url, "_blank", "noopener,noreferrer");
    }
  }, [activeCoupon]);

  // Provide default empty brand while loading to ensure instant render
  const safeBrand = brand || {
    name: slug,
    logo: "",
    description: "",
    longContent: "",
    contentImage: "",
    sidebarText: "",
    verifiedCoupons: "",
    avgSavings: "",
    totalOffers: "",
    lastUpdated: "",
    publishDate: "",
    faqs: [],
    tips: [] as string[],
    authorBox: null as any,
  };
  const brandTips: string[] = Array.isArray(safeBrand.tips) ? safeBrand.tips.filter(Boolean) : [];
  const authorBox = safeBrand.authorBox && safeBrand.authorBox.name ? safeBrand.authorBox : null;
  const storeFaqs = Array.isArray(safeBrand.faqs)
    ? safeBrand.faqs.filter((faq: any) => faq?.question?.trim() && faq?.answer?.trim())
    : [];
  const displayedFaqs = storeFaqs.length > 0 ? storeFaqs : couponViewFAQs;
  const sidebarLines =
    typeof safeBrand.sidebarText === "string"
      ? safeBrand.sidebarText.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean)
      : [];
  const totalOffersText = safeBrand.totalOffers || String(activeCoupons.length);
  const verifiedCouponsText = safeBrand.verifiedCoupons || t('brandPage.verifiedFallback');
  const avgSavingsText = safeBrand.avgSavings || "98%";
  const lastUpdatedText =
    formatBrandDate(safeBrand.publishDate, monthNames) ||
    new Date().toLocaleDateString(LOCALE_TAG[language], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const logoHref = normalizeExternalUrl(safeBrand.url);
  const processedLongContent = useMemo(
    () => (safeBrand.longContent ? processBrandContent(safeBrand.longContent) : ""),
    [safeBrand.longContent]
  );

  // Single card renderer, reused for both active and (muted) expired coupons.
  const renderCoupon = (coupon: any, index: number, expired: boolean) => {
    const kind = getCouponKind(coupon);
    const isCodeCoupon = kind === "code";
    const isFreeShipping = kind === "free-shipping";

    const badgeLabel = isFreeShipping ? t('brandPage.offerBadge') : kind === "sale" ? t('brandPage.saleBadge') : t('brandPage.codeBadge');
    const discountValue = coupon.discountText
      ? coupon.discountText
      : coupon.discount
        ? `${coupon.discount}%`
        : "20%";
    // The source discountText is admin-authored German text (e.g. "20% Rabatt"),
    // so the word stripped out here must stay German regardless of UI language —
    // `subtitle` below is the separately-translated label actually displayed.
    const germanWord = isCodeCoupon ? "Gutschein" : "Rabatt";
    const subtitle = isCodeCoupon ? t('brandPage.couponSubtitle') : t('brandPage.saleSubtitle');
    // Keep only the number (e.g. "10%") big; the word goes on the smaller
    // subtitle line so it fits on one line instead of breaking mid-word.
    const bigValue = discountValue.replace(new RegExp(germanWord, "ig"), "").trim();
    const actionLabel = isCodeCoupon ? t('brandPage.showCodeAction') : t('brandPage.activateOfferAction');

    return (
      <div
        key={coupon._id}
        className={`relative rounded-2xl transition-all duration-300 ${
          expired
            ? "opacity-80"
            : "drop-shadow-[0_2px_6px_rgba(0,0,0,0.10)] hover:drop-shadow-[0_12px_22px_rgba(0,0,0,0.13)] hover:-translate-y-1"
        }`}
      >
        {/* Black "top angebot" strip stays OUTSIDE the masked ticket body, so the
            notch is cut into the white card just below it — never into the strip. */}
        {!expired && index === 0 && (
          <div className="rounded-t-2xl bg-gradient-to-r from-black to-gray-900 text-white text-xs font-medium px-4 py-2 flex items-center gap-2">
            <span>🔥</span> {t('brandPage.topOfferRibbon')}
          </div>
        )}

        {/* Masked white body — .ticket-card punches the transparent notches at its
            own top & bottom edges (the top edge sits under the strip on card #1). */}
        <div
          className={`ticket-card relative overflow-hidden border ${
            !expired && index === 0 ? "rounded-b-2xl" : "rounded-2xl"
          } ${expired ? "border-gray-200 bg-gray-100" : "border-gray-200 bg-white"}`}
        >
          {/* Full-height tinted left stub (desktop): fills the whole left side up
              to the dashed divider. It's inside the masked body, so the ticket
              notches get cut through it too. 221px = divider x-position. */}
          {!expired && (
            <div
              className="hidden sm:block absolute inset-y-0 left-0 w-[221px] bg-primary-50 pointer-events-none"
              aria-hidden
            />
          )}
          <div className={`relative z-10 p-4 sm:p-6 ${expired ? "grayscale" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-[176px_2px_minmax(0,1fr)_160px] items-center gap-4 sm:gap-5">

            {/* Discount / Angebot Area */}
            <div
              className={`flex min-h-[92px] sm:min-h-[112px] flex-col justify-center overflow-hidden rounded-xl px-2 text-center ${
                expired ? "" : "bg-primary-50 sm:bg-transparent"
              }`}
            >
              {isFreeShipping ? (
                <div
                  className={`text-xl sm:text-3xl font-black leading-tight whitespace-nowrap ${
                    expired ? "text-gray-500" : "text-primary-600"
                  }`}
                >
                  {t('brandPage.offerSingular')}
                </div>
              ) : (
                <>
                  <div
                    className={`text-4xl sm:text-5xl font-black leading-none break-words ${
                      expired ? "text-gray-500" : "text-primary-600"
                    }`}
                  >
                    {bigValue}
                  </div>
                  <div
                    className={`text-xl sm:text-3xl font-black leading-tight whitespace-nowrap mt-1 ${
                      expired ? "text-gray-500" : "text-primary-600"
                    }`}
                  >
                    {subtitle}
                  </div>
                </>
              )}
            </div>

            <DottedDivider />

            <div className="flex min-w-0 flex-col items-start gap-2">
              {/* Badge — always the brand/theme colour so the card reads as one system */}
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded w-fit text-white ${
                  expired ? "bg-gray-400" : "bg-primary-500"
                }`}
              >
                {expired ? t('brandPage.expiredLabel') : badgeLabel}
              </span>

              <h3
                className={`font-semibold text-lg sm:text-xl leading-snug text-left ${
                  expired ? "text-gray-500" : "text-gray-900"
                }`}
              >
                {coupon.title}
              </h3>

              {expired ? (
                <div className="inline-flex w-fit items-center gap-1.5 bg-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
                  {t('brandPage.noLongerValid')}
                </div>
              ) : (
                <div className="inline-flex w-fit items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="text-base leading-none">✓</span>
                  {t('brandPage.verifiedToday')}
                </div>
              )}
            </div>

            {/* Action column — expiry date, the button, then like/dislike below it.
                self-stretch + justify-center centers this group vertically within
                the row regardless of how tall the middle (badge/title) column is. */}
            <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-40 self-stretch">
              {!expired && coupon.expiresAt && (
                <span className="text-[11px] text-gray-400 font-medium">
                  {t('brandPage.validUntil', { date: formatBrandDate(coupon.expiresAt, monthNames) })}
                </span>
              )}

              {expired ? (
                <button
                  type="button"
                  disabled
                  className="h-12 w-full rounded-full px-5 text-sm font-semibold text-white bg-gray-400 cursor-not-allowed whitespace-nowrap"
                >
                  {t('brandPage.expiredLabel')}
                </button>
              ) : (
                <button
                  onClick={() => handleShowCode(coupon)}
                  className="h-12 w-full rounded-full px-5 text-sm font-semibold transition-all text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 whitespace-nowrap"
                >
                  {actionLabel}
                </button>
              )}

              {/* Like / Dislike — one segmented chip, split evenly in half */}
              <div className="inline-flex items-stretch rounded-full border border-gray-200 bg-gray-50 overflow-hidden">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleVote(coupon._id, "like"); }}
                  className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 transition ${
                    votesMap[coupon._id]?.myVote === "like"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <ThumbsUp size={13} /> {votesMap[coupon._id]?.likes ?? 0}
                </button>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleVote(coupon._id, "dislike"); }}
                  className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 transition ${
                    votesMap[coupon._id]?.myVote === "dislike"
                      ? "bg-red-100 text-red-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <ThumbsDown size={13} /> {votesMap[coupon._id]?.dislikes ?? 0}
                </button>
              </div>
            </div>
          </div>

          {!expired && isCodeCoupon && openId === coupon._id && !closedCoupons.includes(coupon._id) && (
            <div className="mt-5 p-4 sm:p-5 bg-gray-100 border border-dashed border-gray-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-gray-900 tracking-widest break-all">
                {coupon.code || "SAVE20"}
              </span>
              <button
                onClick={() => handleInlineCopyCode(coupon.code || "SAVE20", coupon.url)}
                className="h-11 w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 rounded-xl text-sm font-semibold shadow-cta transition"
              >
                {t('brandPage.copyCode')}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Invisible bot-verification widget backing the like/dislike buttons below */}
      <div ref={turnstileRef} />

      {/* ==================== HERO SECTION ==================== */}
      <div className="pt-4 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 md:gap-10">

              {/* Logo */}
              <div className="flex-shrink-0">
                {logoHref ? (
                  <a
                    href={logoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl overflow-hidden bg-transparent flex items-center justify-center transition hover:opacity-90"
                    aria-label={t('brandPage.websiteOpenAriaLabel', { name: safeBrand.name })}
                  >
                    <img
                      src={safeBrand.logo || "https://placehold.co/400?text=Logo"}
                      alt={safeBrand.name}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl overflow-hidden bg-transparent flex items-center justify-center">
                    <img
                      src={safeBrand.logo || "https://placehold.co/400?text=Logo"}
                      alt={safeBrand.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-gray-900 leading-tight tracking-tight flex flex-wrap items-baseline justify-center md:justify-start gap-x-3 gap-y-1">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold capitalize">{safeBrand.name}</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray-500">{t('brandPage.couponsAndDiscounts')}</span>
                </h1>

                {safeBrand.description && (
                  <p className="text-base sm:text-lg text-gray-600 mt-3 max-w-2xl">
                    {safeBrand.description}
                  </p>
                )}

                <p className="mt-3 text-sm sm:text-base text-gray-700 font-semibold">
                  {t('brandPage.activeOffersStatus', { count: totalOffersText, date: lastUpdatedText })}
                </p>

                {/* Interactive rating — clickable, but the score stays at 4.9 */}
                <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                  <div className="flex text-amber-400" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const isHovering = hoverRating > 0;
                      const showHalf = !isHovering && i === 5; // 4.9 → last star half
                      const filled = isHovering ? i <= hoverRating : i <= 4;

                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setHoverRating(i)}
                          onClick={() => setUserRating(i)}
                          aria-label={t('brandPage.rateStarsAriaLabel', { count: i })}
                          className="transition-transform hover:scale-110"
                        >
                          {showHalf ? (
                            <StarHalf size={24} fill="currentColor" strokeWidth={1.5} />
                          ) : (
                            <Star
                              size={24}
                              fill={filled ? "currentColor" : "none"}
                              strokeWidth={1.5}
                              className={filled ? "" : "text-gray-300"}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-lg font-semibold text-gray-800 ml-1">{DISPLAY_RATING}</span>
                  <span className="text-sm text-gray-500">
                    • {userRating ? t('brandPage.thanksForRating') : t('brandPage.veryGood')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT SIDEBAR */}
          <div className="hidden lg:block lg:col-span-4 space-y-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-soft">
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">{t('brandPage.topOffersHeading')}</h3>
              <ul className="space-y-3 text-[15px] text-gray-600">
                {sidebarLines.length > 0 ? (
                  sidebarLines.map((line: string, index: number) => (
                    <li key={`${line}-${index}`} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">• {t('brandPage.sidebarFallback1', { name: safeBrand.name })}</li>
                    <li className="flex items-start gap-2">• {t('brandPage.sidebarFallback2')}</li>
                    <li className="flex items-start gap-2">• {t('brandPage.sidebarFallback3')}</li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
              <h4 className="font-semibold text-lg mb-4">{t('brandPage.offerOverviewHeading')}</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">{t('brandPage.totalOffersLabel')}</dt>
                  <dd className="font-semibold text-gray-900">{totalOffersText}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{t('brandPage.couponCodesLabel')}</dt>
                  <dd className="font-semibold text-emerald-600">{verifiedCouponsText}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{t('brandPage.avgSavingsLabel')}</dt>
                  <dd className="font-semibold text-emerald-600">{avgSavingsText}</dd>
                </div>
              </dl>
            </div>

            {authorBox && (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                <div className="flex items-center gap-3">
                  {authorBox.avatarUrl ? (
                    <img
                      src={authorBox.avatarUrl}
                      alt={authorBox.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-semibold">
                      {authorBox.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{authorBox.name}</p>
                    {authorBox.role && <p className="text-xs text-gray-500 truncate">{authorBox.role}</p>}
                  </div>
                </div>
                {authorBox.bio && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-4">{authorBox.bio}</p>
                )}
                {(authorBox.socialLinks?.twitter || authorBox.socialLinks?.instagram || authorBox.socialLinks?.linkedin || authorBox.socialLinks?.website) && (
                  <div className="flex items-center gap-3 mt-3 text-gray-400">
                    {authorBox.socialLinks?.twitter && (
                      <a href={authorBox.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition"><Twitter size={16} /></a>
                    )}
                    {authorBox.socialLinks?.instagram && (
                      <a href={authorBox.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition"><Instagram size={16} /></a>
                    )}
                    {authorBox.socialLinks?.linkedin && (
                      <a href={authorBox.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition"><Linkedin size={16} /></a>
                    )}
                    {authorBox.socialLinks?.website && (
                      <a href={authorBox.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition"><GlobeIcon size={16} /></a>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-3">
                  {t('brandPage.writtenBy', { name: authorBox.name })}
                  {authorBox.updatedAt ? t('brandPage.updatedOn', { date: formatBrandDate(authorBox.updatedAt, monthNames) }) : ""}
                </p>
              </div>
            )}

            {brandTips.length > 0 && (
              <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900">
                  <Lightbulb size={18} className="text-primary-500" /> {t('brandPage.tipsHeading')}
                </h4>
                <ul className="space-y-3 text-sm text-gray-700">
                  {brandTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {popularStores.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                <h4 className="font-semibold text-lg mb-4">{t('brandPage.popularStoresHeading')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {popularStores.map((s: any) => (
                    <Link
                      key={s._id}
                      href={`/kortingscodes/view/${s.slug}`}
                      className="bg-white border border-gray-200 rounded-xl h-16 flex items-center justify-center p-2 hover:border-primary-300 hover:shadow-soft transition"
                      title={s.name}
                    >
                      {s.logo ? (
                        <img src={s.logo} alt={s.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs font-semibold text-gray-400 truncate">{s.name}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COUPONS SECTION */}
          <div className="lg:col-span-8 space-y-6">
            {!couponsLoading && coupons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-soft text-center py-20 px-6">
                <p className="text-gray-500 text-lg">
                  {t('brandPage.noActiveOffers', { name: safeBrand.name })}
                </p>
              </div>
            ) : (
              <>
                {activeCoupons.map((coupon: any, index: number) => renderCoupon(coupon, index, false))}

                {activeCoupons.length === 0 && expiredCoupons.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-soft text-center py-12 px-6">
                    <p className="text-gray-500 text-lg">
                      Derzeit sind keine aktiven Angebote für {safeBrand.name} verfügbar.
                    </p>
                  </div>
                )}

                {/* Brand products — under the (active) coupons, above expired coupons */}
                {brandProducts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                      {t('brandPage.popularProductsHeading', { name: safeBrand.name })}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      {brandProducts.map((p: any) => (
                        <a
                          key={p._id}
                          href={p.link || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-soft-md transition"
                        >
                          <div className="relative h-32 bg-gray-50 flex items-center justify-center p-3">
                            {p.productLogo ? (
                              <img src={p.productLogo} alt={p.title} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100" />
                            )}
                            {p.saleValue && (
                              <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {p.saleValue}
                              </span>
                            )}
                          </div>
                          <div className="p-3 flex flex-col flex-grow">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">{p.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {p.price && <span className="text-sm font-bold text-gray-900">{p.price}</span>}
                              {p.oldPrice && <span className="text-xs text-gray-400 line-through">{p.oldPrice}</span>}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expired coupons stay on the page, greyed out, below everything else */}
                {expiredCoupons.length > 0 && (
                  <div className="pt-4">
                    <h2 className="text-lg font-bold text-gray-500 mb-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-300" />
                      {t('brandPage.expiredCouponsHeading')}
                      <span className="h-px flex-1 bg-gray-300" />
                    </h2>
                    <div className="space-y-6">
                      {expiredCoupons.map((coupon: any, index: number) => renderCoupon(coupon, index, true))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== PREMIUM POPUP ==================== */}
      {showPopup && activeCoupon && (() => {
        const popupKind = getCouponKind(activeCoupon);
        const isCodePopup = popupKind === "code";

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-soft-lg">
              <button
                onClick={handleClosePopup}
                className="absolute top-5 right-5 text-3xl text-gray-400 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-transparent flex items-center justify-center">
                  <img
                    src={safeBrand.logo}
                    alt={safeBrand.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-center text-gray-900">
                {t('brandPage.offerActivatedHeading', { name: safeBrand.name })}
              </h2>

              <p className="text-center text-gray-600 mt-3 mb-6">
                {activeCoupon.title}
              </p>

              {isCodePopup ? (
                <>
                  <div className="relative mb-6 rounded-3xl overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-4xl sm:text-5xl font-mono font-black tracking-[3px] py-7 text-center select-all"
                      onCopy={() => {
                        setCodeCopied(true);
                        if (activeCoupon?.url) {
                          openAffiliateInBackground(activeCoupon.url);
                        }
                      }}
                    >
                      {activeCoupon.code || t('brandPage.noCode')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCode(activeCoupon.code || "")}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-cta transition-all active:scale-[0.985]"
                  >
                    {t('brandPage.copyCode')}
                  </button>

                  {codeCopied && (
                    <p className="text-center text-emerald-600 font-medium mt-4 text-sm">
                      {t('brandPage.codeCopied')}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-center py-6 px-5 rounded-3xl mb-6">
                    <p className="text-lg font-semibold leading-relaxed">
                      {popupKind === "free-shipping"
                        ? t('brandPage.freeShippingActivated')
                        : t('brandPage.offerAppliedSuccess')}
                    </p>
                    <p className="text-sm mt-2 text-emerald-700">
                      {t('brandPage.shopNowAndSave')}
                    </p>
                  </div>

                  <button
                    onClick={handleShopNow}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-cta transition-all active:scale-[0.985]"
                  >
                    {t('brandPage.shopNow')}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ==================== LONG BRAND CONTENT ==================== */}
      {(safeBrand.longContent || safeBrand.description) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 sm:p-8 md:p-10">
            {safeBrand.longContent ? (
              <div
                className="brand-long-content max-w-4xl mx-auto text-gray-600 leading-relaxed space-y-4 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:text-gray-900 [&_h1]:mt-10 [&_h1]:mb-5 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-2 [&_h5]:text-lg [&_h5]:font-semibold [&_h5]:text-gray-900 [&_h5]:mt-5 [&_h5]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-2 [&_a]:text-primary-600 [&_a]:underline [&_img]:rounded-2xl [&_img]:shadow-soft-lg [&_img]:my-8 [&_img]:w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: processedLongContent }}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {t('brandPage.moreAboutBrand', { name: safeBrand.name })}
                  </h2>
                  <div className="text-gray-600 leading-relaxed space-y-4">
                    <p>{safeBrand.description}</p>
                    <p>
                      {t('brandPage.brandDescriptionExtra', { name: safeBrand.name })}
                    </p>
                  </div>
                </div>
                {(safeBrand.contentImage || safeBrand.logo) && (
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-soft-lg bg-gray-100 flex items-center justify-center p-8">
                    <img
                      src={safeBrand.contentImage || safeBrand.logo}
                      alt={safeBrand.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== NEWSLETTER (admin-managed) ==================== */}
      <NewsletterSection
        sectionClassName="pb-12"
        cardClassName="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-200 max-w-7xl mx-auto"
        inputClassName="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        buttonClassName="bg-primary-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-primary-700 transition whitespace-nowrap"
      />

      <FAQSection
        faqs={displayedFaqs}
        title={storeFaqs.length > 0 ? t('brandPage.faqTitleWithBrand', { name: safeBrand.name }) : t('brandPage.faqTitleGeneric')}
        sectionClassName="bg-gray-100 py-14 md:py-20 pb-16"
      />
    </div>
  );
}
