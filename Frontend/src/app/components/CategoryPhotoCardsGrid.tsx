import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CategoryImage from "./CategoryImage";
import { Reveal, RevealGroup, RevealItem } from "./motion/Reveal";
import type { HomeCategoryItem } from "@/lib/homeCategoryGroups";

// Photo-first alternative to CategoryCardsGrid: a cropped category shot with a
// white footer carrying the name, an optional caption and an arrow affordance.
// Six per row on desktop (hence the compact card), horizontal snap scroller on
// mobile — same `hrefBase` contract as the tile grid.
function PhotoCard({ cat, href }: { cat: HomeCategoryItem; href: string }) {
  return (
    <Link href={href} className="group block h-full">
      <article className="h-full overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-depth-3 group-hover:ring-primary-200">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
          <CategoryImage src={cat.image} alt={cat.name} fill />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{cat.name}</p>
            {cat.caption && (
              <p className="mt-0.5 truncate text-[11px] text-gray-500">{cat.caption}</p>
            )}
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-gray-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary-600"
            strokeWidth={2}
          />
        </div>
      </article>
    </Link>
  );
}

export default function CategoryPhotoCardsGrid({
  categories,
  hrefBase = "/categorie",
}: {
  categories: HomeCategoryItem[];
  hrefBase?: string;
}) {
  return (
    <>
      <RevealGroup className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <RevealItem key={cat.slug}>
            <PhotoCard cat={cat} href={`${hrefBase}/${cat.slug}`} />
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="md:hidden">
        <Reveal className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          {categories.map((cat) => (
            <div key={cat.slug} className="flex-shrink-0 w-[190px] snap-start">
              <PhotoCard cat={cat} href={`${hrefBase}/${cat.slug}`} />
            </div>
          ))}
        </Reveal>
      </div>
    </>
  );
}
