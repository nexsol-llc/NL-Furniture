import type { Metadata } from "next";
import { fetchCatalogEntry, humanizeSlug } from "@/lib/categoryCatalog";

type Props = {
  params: { slug: string; subslug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCatalogEntry(params.slug);
  const sub = category?.subcategories?.find((s) => s.slug === params.subslug);

  if (!sub) {
    const name = humanizeSlug(params.subslug);
    return {
      title: `${name} | NL FURNITURE`,
      description: `Entdecken Sie ${name} und weitere Möbel bei NL FURNITURE.`,
    };
  }

  return {
    title: sub.seoTitle || `${sub.name} | NL FURNITURE`,
    description:
      sub.seoDescription ||
      `Entdecken Sie unsere ${sub.name}-Auswahl bei NL FURNITURE.`,
  };
}

export default function SubcategoryLayout({ children }: Props) {
  return children;
}
