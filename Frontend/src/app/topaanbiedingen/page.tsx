import type { Metadata } from "next";
import TopAngeboteClient from "./TopAngeboteClient";

export const dynamic = "force-dynamic";

const defaultSettings = {
  bannerTitle: "MEGA SOMMERSALE",
  bannerSubtitle: "Bis zu 70% RABATT auf Möbel & Wohnaccessoires",
  pageTitle: "Top Angebote",
  pageSubtitle: "Die besten Deals für Ihr Zuhause",
  longContent: "",
  faqs: [],
  seoTitle: "Top Angebote - Beste Möbel-Deals",
  seoDescription: "Entdecken Sie die besten Angebote für Möbel und Wohnaccessoires.",
  seoKeywords: "",
};

async function getTopAngeboteSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/top-angebote-settings`, {
      cache: "no-store",
    });
    if (!res.ok) return defaultSettings;
    return res.json();
  } catch {
    return defaultSettings;
  }
}

async function getTopAngeboteProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/top-angebote-products`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getTopAngeboteSettings();
  const keywords =
    typeof settings.seoKeywords === "string"
      ? settings.seoKeywords
          .split(",")
          .map((keyword: string) => keyword.trim())
          .filter(Boolean)
      : [];

  return {
    title: settings.seoTitle || defaultSettings.seoTitle,
    description: settings.seoDescription || defaultSettings.seoDescription,
    keywords,
    openGraph: {
      title: settings.seoTitle || defaultSettings.seoTitle,
      description: settings.seoDescription || defaultSettings.seoDescription,
      images: settings.bannerImage ? [settings.bannerImage] : undefined,
    },
  };
}

export default async function TopAngebotePage() {
  const [products, settings] = await Promise.all([
    getTopAngeboteProducts(),
    getTopAngeboteSettings(),
  ]);

  return (
    <TopAngeboteClient initialProducts={products} initialSettings={settings} />
  );
}
