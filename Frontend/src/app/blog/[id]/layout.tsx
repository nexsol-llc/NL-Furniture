import type { Metadata } from "next";

type BlogLayoutProps = {
  children: React.ReactNode;
  params: { id: string };
};

const stripHtml = (value?: string) =>
  (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function getBlog(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BlogLayoutProps): Promise<Metadata> {
  const blog: any = await getBlog(params.id);

  if (!blog) {
    return {
      title: "Artikel nicht gefunden",
      robots: { index: false, follow: false },
    };
  }

  const title = blog.seo?.metaTitle || blog.title;
  const description =
    blog.seo?.metaDescription ||
    blog.subHeading ||
    stripHtml(blog.intro).slice(0, 155);
  const ogTitle = blog.seo?.ogTitle || title;
  const ogDescription = blog.seo?.ogDescription || description;
  const keywords = blog.seo?.keywords
    ? blog.seo.keywords.split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
    : undefined;

  return {
    title,
    description,
    keywords,
    alternates: blog.seo?.canonicalUrl
      ? { canonical: blog.seo.canonicalUrl }
      : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "article",
      images: blog.heroImage ? [{ url: blog.heroImage, alt: blog.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: blog.heroImage ? [blog.heroImage] : undefined,
    },
  };
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return children;
}
