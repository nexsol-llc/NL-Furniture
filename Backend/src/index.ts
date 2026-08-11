import { Hono } from "hono";
import { Env } from "./types.js";
import { corsMiddleware } from "./middleware/cors.js";

// Route modules
import auth from "./routes/auth.js";
import adminAuth from "./routes/adminAuth.js";
import staff from "./routes/staff.js";
import hero from "./routes/hero.js";
import offers from "./routes/offers.js";
import sponsors from "./routes/sponsors.js";
import brands from "./routes/brands.js";
import authors from "./routes/authors.js";
import coupons, { couponStores, couponSpecialOffers } from "./routes/coupons.js";
import { couponVotes, couponVotesBatch } from "./routes/couponVotes.js";
import couponBrandProducts from "./routes/couponBrandProducts.js";
import products, { merchants, productsAdmin } from "./routes/products.js";
import categories, { categoryCatalog, sponsored, sponsoredProducts } from "./routes/categories.js";
import parentCategories from "./routes/parentCategories.js";
import { homeProducts, homeCategories, homeInfluencer } from "./routes/homeContent.js";
import { influencerBrands, influencerLooks, influencerSettings } from "./routes/influencers.js";
import gadgets from "./routes/gadgets.js";
import blog from "./routes/blog.js";
import blogCategories from "./routes/blogCategories.js";
import furnitureBrands from "./routes/furnitureBrands.js";
import { topAngeboteProducts, topAngeboteSettings } from "./routes/topAngebote.js";
import { couponHomeSettings, couponHomeProducts } from "./routes/couponHome.js";
import newsletter from "./routes/newsletter.js";
import cookieConsent from "./routes/cookieConsent.js";
import { settings } from "./routes/settings.js";
import uploads from "./routes/uploads.js";
import media from "./routes/media.js";
import admin from "./routes/admin.js";
import customer from "./routes/customer.js";

const app = new Hono<{ Bindings: Env }>();

// ── Global CORS (handles OPTIONS preflight automatically) ─────────────────────
app.use("/*", corsMiddleware);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ ok: true, service: "NL FURNITURE API", version: "1.0.0" }));
app.get("/api/health", (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.route("/api/auth", auth);
app.route("/api/auth/admin", adminAuth);

// ── Static content ────────────────────────────────────────────────────────────
app.route("/api/hero", hero);
app.route("/api/offers", offers);
app.route("/api/sponsors", sponsors);
app.route("/api/brands", brands);
app.route("/api/authors", authors);
app.route("/api/furniture-brands", furnitureBrands);
app.route("/api/gadgets", gadgets);
app.route("/api/blog", blog);
app.route("/api/blog-categories", blogCategories);

// ── Coupons ───────────────────────────────────────────────────────────────────
app.route("/api/coupons", coupons);
app.route("/api/coupons", couponVotes);
app.route("/api/coupon-stores", couponStores);
app.route("/api/coupon-special-offers", couponSpecialOffers);
app.route("/api/coupon-home-settings", couponHomeSettings);
app.route("/api/coupon-home-products", couponHomeProducts);
app.route("/api/coupon-brand-products", couponBrandProducts);
app.route("/api/coupon-votes-batch", couponVotesBatch);

// ── Products ──────────────────────────────────────────────────────────────────
// /api/product/:id — single product lookup
app.route("/api/product", products);
// /api/products-by-category — paginated/filtered product list
// Shares the same router; GET / on this router serves the list
app.route("/api/products-by-category", products);
// Admin CRUD + rich filtering (create/update/delete, by brand/category/childCategory/price)
app.route("/api/products", productsAdmin);
app.route("/api/merchants", merchants);

// ── Categories ────────────────────────────────────────────────────────────────
app.route("/api/category", categories);            // /api/category/:slug
app.route("/api/category-catalog", categoryCatalog);
app.route("/api/parent-categories", parentCategories);
app.route("/api/sponsored", sponsored);             // /api/sponsored/:categoryId
app.route("/api/sponsored-products", sponsoredProducts);

// ── Home content ──────────────────────────────────────────────────────────────
app.route("/api/home-products", homeProducts);
app.route("/api/home-categories", homeCategories);
app.route("/api/home-influencer", homeInfluencer);

// ── Influencers ───────────────────────────────────────────────────────────────
app.route("/api/influencer-brands", influencerBrands);
app.route("/api/influencer-looks", influencerLooks);
app.route("/api/influencer-settings", influencerSettings);

// ── Top Angebote ──────────────────────────────────────────────────────────────
app.route("/api/top-angebote-products", topAngeboteProducts);
app.route("/api/top-angebote-settings", topAngeboteSettings);

// ── Engagement ────────────────────────────────────────────────────────────────
app.route("/api/newsletter", newsletter);
app.route("/api/cookie-consent", cookieConsent);

// ── Settings (flat routes: /api/section-settings, /api/kategorie-settings,
//             /api/page-seo-settings/:key) ─────────────────────────────────────
app.route("/api", settings);

// ── Media library ─────────────────────────────────────────────────────────────
app.route("/api/media", media);

// ── Uploads (/api/upload-image, /api/upload-csv, /api/upload-brand-csv) ──────
app.route("/api", uploads);

// ── R2 file serving at /uploads/* ────────────────────────────────────────────
app.route("/", uploads);

// ── Customer (user-authenticated) ────────────────────────────────────────────
app.route("/api/customer", customer);

// ── Admin (protected) ─────────────────────────────────────────────────────────
app.route("/api/admin", admin);
app.route("/api/admin/staff", staff);

// ── 404 / Error ───────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Route not found" }, 404));
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
