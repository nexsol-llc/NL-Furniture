import { redirect } from "next/navigation";

// The brand detail page now lives under /merken/[slug]. Keep this old path
// working (bookmarks, admin-advertised URLs, SEO) by redirecting to the new one.
export default function BrandSlugRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/merken/${params.slug}`);
}
