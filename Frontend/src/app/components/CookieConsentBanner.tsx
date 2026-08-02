"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  type CookieConsentSettings,
  defaultCookieConsent,
} from "@/lib/cookieConsentDefaults";
import { useLanguage } from "@/providers/languageContext";

export default function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [fetchedSettings, setFetchedSettings] = useState<CookieConsentSettings | null>(null);

  const localizedDefaults: CookieConsentSettings = {
    ...defaultCookieConsent,
    heading: t('cookieConsent.heading'),
    bodyText: t('cookieConsent.bodyText'),
    detailsLinkText: t('cookieConsent.detailsLinkText'),
    link1Text: t('footer.privacy'),
    link2Text: t('footer.imprint'),
    link3Text: t('footer.termsOfUse'),
    refuseButtonText: t('cookieConsent.refuse'),
    acceptButtonText: t('cookieConsent.accept'),
  };
  const settings = fetchedSettings ?? localizedDefaults;

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (stored) return;

    let timer: ReturnType<typeof setTimeout>;

    fetch("/api/cookie-consent")
      .then((res) => res.json())
      .then((data: CookieConsentSettings) => {
        setFetchedSettings(data);
        if (!data.isActive) return;
        const delay = (data.delaySeconds ?? 2) * 1000;
        timer = setTimeout(() => setVisible(true), delay);
      })
      .catch(() => {
        timer = setTimeout(() => setVisible(true), 2000);
      });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleChoice = async (choice: "accepted" | "refused") => {
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ choice, date: new Date().toISOString() })
    );
    setVisible(false);

    try {
      const params = new URLSearchParams(window.location.search);
      const logData = {
        choice,
        referrer: document.referrer || "",
        utmSource: params.get("utm_source") || "",
        utmMedium: params.get("utm_medium") || "",
        utmCampaign: params.get("utm_campaign") || "",
        gclid: params.get("gclid") || "",
        fbclid: params.get("fbclid") || "",
      };

      await fetch("/api/cookie-consent/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });

      if (choice === "accepted" && typeof window !== "undefined") {
        // Trigger Meta Pixel track if installed
        if ((window as any).fbq) {
          (window as any).fbq("track", "ConsentAccepted", logData);
        }
        // Update Google Analytics consent mode if installed
        if ((window as any).gtag) {
          (window as any).gtag("consent", "update", {
            ad_storage: "granted",
            analytics_storage: "granted",
          });
        }
      }
    } catch (error) {
      console.error("Failed to log cookie consent:", error);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-heading"
        className="relative w-full max-w-[620px] bg-white rounded-2xl border border-gray-200 shadow-soft-lg px-8 py-7 md:px-10 md:py-8"
      >
        {/* Logo */}
        <div className="mb-5">
          <Image
            src="/nl-furniture_logo_dark.png"
            alt="NL FURNITURE"
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
            priority
          />
          <div className="mt-1 h-[3px] w-[110px] bg-primary-500 rounded-full" />
        </div>

        {/* Heading */}
        <h2
          id="cookie-consent-heading"
          className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-snug"
        >
          {settings.heading}
        </h2>

        {/* Body */}
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          {settings.bodyText}
        </p>

        <Link
          href={settings.detailsLinkUrl}
          className="text-sm text-gray-800 underline underline-offset-2 hover:text-primary-700 transition-colors"
          onClick={() => handleChoice("refused")}
        >
          {settings.detailsLinkText}
        </Link>

        {/* Footer links */}
        <div className="mt-5 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
          <Link
            href={settings.link1Url}
            className="underline underline-offset-2 hover:text-gray-900"
          >
            {settings.link1Text}
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href={settings.link2Url}
            className="underline underline-offset-2 hover:text-gray-900"
          >
            {settings.link2Text}
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href={settings.link3Url}
            className="underline underline-offset-2 hover:text-gray-900"
          >
            {settings.link3Text}
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleChoice("refused")}
            className="px-6 py-2.5 text-sm font-semibold text-primary-700 border border-primary-200 rounded-lg bg-white shadow-soft-sm hover:bg-primary-50 hover:border-primary-300 transition-colors"
          >
            {settings.refuseButtonText}
          </button>
          <button
            type="button"
            onClick={() => handleChoice("accepted")}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 border border-primary-600 rounded-lg shadow-cta hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98] transition-all duration-200"
          >
            {settings.acceptButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
