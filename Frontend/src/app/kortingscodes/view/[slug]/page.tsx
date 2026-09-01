import type { Metadata } from "next";
import BrandPageClient from "./BrandPageClient";
import { toPlainText } from "@/lib/richText";

type PageProps = {
  params: { slug: string };
};

async function getBrand(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const brand: any = await getBrand(slug);
  const brandName = brand?.name || slug;
  const title = brand?.seoTitle || `${brandName} Gutscheine & Rabattcodes`;
  const description =
    brand?.seoDescription ||
    toPlainText(brand?.description) ||
    `Aktuelle ${brandName} Gutscheine, Rabattcodes und Angebote entdecken.`;
  const keywords =
    typeof brand?.seoKeywords === "string" && brand.seoKeywords.trim()
      ? brand.seoKeywords.split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
      : undefined;
  const canonical = brand?.canonicalUrl || `/kortingscodes/view/${slug}`;
  const image = brand?.ogImage || brand?.contentImage || brand?.logo || undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function Page() {
  return <BrandPageClient />;
}
