import type { ReactNode } from "react";
import type { Metadata } from "next";
import CoupanHeader from "./components/CoupanHeader";
import CouponsThemeScope from "./components/CouponsThemeScope";
import Footer from "../components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupon-home-settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const s: any = await res.json();
    const title = s?.seoTitle || undefined;
    const description = s?.seoDescription || undefined;
    const keywords =
      typeof s?.seoKeywords === "string" && s.seoKeywords.trim()
        ? s.seoKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : undefined;
    return {
      title,
      description,
      keywords,
      openGraph: { title, description },
    };
  } catch {
    return {};
  }
}

export default function CoupansLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CouponsThemeScope>
      <CoupanHeader />
      {children}
      <Footer/>
    </CouponsThemeScope>
  );
}