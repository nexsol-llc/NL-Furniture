import type { Metadata } from "next";
import { fetchCatalogEntry, humanizeSlug } from "@/lib/categoryCatalog";

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCatalogEntry(params.slug);

  if (!category) {
    const name = humanizeSlug(params.slug);
    return {
      title: `${name} | NL FURNITURE`,
      description: `Entdecken Sie ${name} und weitere Möbel bei NL FURNITURE.`,
    };
  }

  return {
    title: category.seoTitle || `${category.name} | NL FURNITURE`,
    description:
      category.seoDescription ||
      `Entdecken Sie unsere ${category.name}-Kollektion bei NL FURNITURE.`,
  };
}

export default function CategoryLayout({ children }: Props) {
  return children;
}
