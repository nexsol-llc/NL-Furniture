import type { Metadata } from "next";
import { fetchParentCategory, humanizeSlug } from "@/lib/categoryCatalog";

type Props = {
  params: { parentslug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parent = await fetchParentCategory(params.parentslug);

  if (!parent) {
    const name = humanizeSlug(params.parentslug);
    return {
      title: `${name} | NL FURNITURE`,
      description: `Ontdek ${name} en meer meubels bij NL FURNITURE.`,
    };
  }

  return {
    title: parent.seoTitle || `${parent.name} | NL FURNITURE`,
    description:
      parent.seoDescription ||
      `Ontdek onze ${parent.name}-categorieën bij NL FURNITURE.`,
  };
}

export default function ParentCategoryLayout({ children }: Props) {
  return children;
}
