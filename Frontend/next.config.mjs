/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Category URLs are flat now (/banken, /banken/hoekbanken, /slaapkamer).
  // Keep the old /categorie/* URLs working for bookmarks and indexed pages.
  // /categorie itself is untouched — it is still the category overview page.
  async redirects() {
    return [
      {
        source: "/categorie/groep/:slug",
        destination: "/:slug",
        permanent: true,
      },
      {
        source: "/categorie/:slug/:childslug",
        destination: "/:slug/:childslug",
        permanent: true,
      },
      {
        source: "/categorie/:slug",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error(
        "NEXT_PUBLIC_API_URL is not set. Configure it in the deployment environment (e.g. Vercel project settings)."
      );
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    // Bypass Next's built-in image optimizer. Our images come from arbitrary
    // merchant hosts and R2 uploads whose filenames contain non-ASCII
    // characters (ä/ö/ü) and parentheses; the optimizer's server-side fetch
    // fails on those ("Input Buffer is empty" -> HTTP 500), which surfaced as
    // broken images. Loading the original URL directly (like a plain <img>)
    // always works.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "people.com", pathname: "/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
      { protocol: "https", hostname: "assets.aboutamazon.com", pathname: "/**" },
      { protocol: "https", hostname: "seeklogo.com", pathname: "/**" },
      { protocol: "https", hostname: "img.freepik.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "www.2010officefurniture.com", pathname: "/**" },
      { protocol: "https", hostname: "www.caffelattehome.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "www.google.com", pathname: "/**" },
      { protocol: "https", hostname: "**" },
    ],
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
