import Link from "next/link";
import CategoryImage from "./CategoryImage";
import { Reveal, RevealGroup, RevealItem } from "./motion/Reveal";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";

// The responsive grid of category tiles (desktop grid + mobile horizontal
// scroller). Shared by CategoryGroupGrid and the indoor/outdoor tab switcher.
// `hrefBase` controls what each tile links to — defaults to individual
// category pages (/categorie/[slug]); pass "/categorie/parent" when
// `categories` holds Parent Categories instead.
export default function CategoryCardsGrid({
  categories,
  hrefBase = "/categorie",
}: {
  categories: HomeCategoryItem[];
  hrefBase?: string;
}) {
  return (
    <>
      <RevealGroup className="hidden md:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
        {categories.map((cat) => (
          <RevealItem key={cat.slug}>
            <Link
              href={`${hrefBase}/${cat.slug}`}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white shadow-soft group-hover:shadow-depth-3 transition-all flex items-center justify-center overflow-hidden rounded-2xl">
                <CategoryImage src={cat.image} alt={cat.name} size={86} />
              </div>
              <p className="text-[11px] sm:text-xs font-medium mt-2 text-gray-700 group-hover:text-gray-900 line-clamp-2">
                {cat.name}
              </p>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="md:hidden">
        <Reveal className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`${hrefBase}/${cat.slug}`}
              className="flex-shrink-0 flex flex-col items-center text-center group snap-start w-[100px]"
            >
              <div className="w-24 h-24 bg-white shadow-soft group-hover:shadow-depth-3 transition-all flex items-center justify-center overflow-hidden rounded-2xl">
                <CategoryImage src={cat.image} alt={cat.name} size={80} />
              </div>
              <p className="text-[11px] font-medium mt-2.5 text-gray-700 group-hover:text-gray-900 line-clamp-2">
                {cat.name}
              </p>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}
