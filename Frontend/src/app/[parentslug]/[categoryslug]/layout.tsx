import type { Metadata } from "next";
import { fetchCatalogEntry, humanizeSlug } from "@/lib/categoryCatalog";

type Props = {
  params: { parentslug: string; categoryslug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCatalogEntry(params.categoryslug);

  if (!category) {
    const name = humanizeSlug(params.categoryslug);
    return {
      title: `${name} | NL FURNITURE`,
      description: `Ontdek ${name} en meer meubels bij NL FURNITURE.`,
    };
  }

  return {
    title: category.seoTitle || `${category.name} | NL FURNITURE`,
    description:
      category.seoDescription ||
      `Ontdek onze ${category.name}-collectie bij NL FURNITURE.`,
  };
}

export default function CategoryLayout({ children }: Props) {
  return children;
}
