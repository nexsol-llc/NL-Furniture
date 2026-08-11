import type { Metadata } from "next";
import { fetchCatalogEntry, humanizeSlug } from "@/lib/categoryCatalog";

type Props = {
  params: { parentslug: string; categoryslug: string; childslug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCatalogEntry(params.categoryslug);
  const sub = category?.childCategories?.find((s) => s.slug === params.childslug);

  if (!sub) {
    const name = humanizeSlug(params.childslug);
    return {
      title: `${name} | NL FURNITURE`,
      description: `Ontdek ${name} en meer meubels bij NL FURNITURE.`,
    };
  }

  return {
    title: sub.seoTitle || `${sub.name} | NL FURNITURE`,
    description:
      sub.seoDescription ||
      `Ontdek ons ${sub.name}-assortiment bij NL FURNITURE.`,
  };
}

export default function ChildCategoryLayout({ children }: Props) {
  return children;
}
