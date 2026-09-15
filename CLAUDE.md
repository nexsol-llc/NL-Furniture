# CLAUDE.md

Guidance for working in the **NL FURNITURE** monorepo.

## Architecture

Two independent apps:

- **`Frontend/`** — Next.js 14 (App Router, `src/app`), React 18, TypeScript, Tailwind CSS. Deployed to Vercel. Package name `nl-furniture`.
- **`Backend/`** — Cloudflare Workers API built on Hono v4. Deployed with `wrangler`. Package name `nl-furniture-api`.

The Backend replaces the old Next.js API routes. The Frontend talks to it over HTTP via `NEXT_PUBLIC_API_URL` (checked at runtime in `next.config`).

This codebase was copied from the German DIEWOHNEN project and re-localized for the Dutch market. See `SETUP.md` for provisioning steps and the remaining TODOs (placeholder Cloudflare IDs, placeholder domain, legal details).

## Localization

- **Dutch (`nl`) is the default language**; English and German are switchable in the footer. Dictionaries live in `Frontend/src/locales/{nl,en,de}.json` and must stay at **exact key parity** (currently 1032 keys each) — a missing key falls back to Dutch via `providers/languageContext.tsx`.
- `lib/languageDefaults.ts` owns the `Language` union, `DEFAULT_LANGUAGE`, and `LOCALE_TAG` (BCP 47 tags for date/number formatting). Never hardcode `'de-DE'`/`'en-US'` — use `LOCALE_TAG[language]`.
- **Public routes are Dutch** (`/categorie`, `/kortingscodes`, `/binnen`, `/buiten`, `/colofon`, `/privacybeleid`, …). **API endpoints deliberately kept their original keys** (`/api/kategorie-settings`, `/api/top-angebote-*`) — they are internal contracts; renaming them means a coordinated DB + Frontend change.
- **Slug generation strips diacritics** rather than using the German two-letter expansion (`ö→oe`), which mangles Dutch (`coördinatie` → `cooerdinatie`). `Backend/src/lib/slug.ts` and `Frontend/src/lib/parseCsvClient.ts` implement this and **must stay in sync**.
- Visitor-facing Backend strings (auth errors, cookie banner, seeded SEO defaults) are **Dutch**; admin activity-log labels are **English**, matching the English admin UI.
- Legal pages state **Dutch** law (`artikel 3:15d BW`, AVG, Nederlandse Reclame Code) in all three locales.

## Backend (`Backend/`)

**Stack:** Hono v4 (router), Cloudflare **D1 / SQLite** (database, `c.env.DB`), Cloudflare **R2** (`c.env.IMAGES`, images served at `/uploads/*`), `jose` (JWT), `bcryptjs` (password hashing), Resend API (email via `src/lib/mail.ts`).

**Entry:** `src/index.ts` mounts every route module under `/api/...`. `src/types.ts` defines `Env` (bindings/secrets) and the core interfaces (`JwtPayload`, `User`, `AdminUser`, `Product`).

**D1 conventions** (see `src/db.ts`):
- `db.prepare(sql).bind(...).run() | .first<T>() | .all<T>()`; `db.batch([...])` for bulk/parallel ops.
- Blob pattern: most tables are `id TEXT PRIMARY KEY` + a few indexed columns + `data TEXT` (JSON).
- `fromRow`/`fromRows` map `id → _id` for frontend compatibility. `newId()`, `nowIso()` helpers.
- Upserts via `INSERT ... ON CONFLICT DO UPDATE`. `LOWER(col) LIKE` for search, `json_each` for array queries.
- Singleton tables use `id = 'singleton'`.

**Auth & roles:**
- Two token types (`JwtPayload.type`): `admin` and `user`. Middleware in `src/middleware/auth.ts`: `authMiddleware`/`adminAuthMiddleware`, `requireStaff`, `requireAdmin`, `requireSuperAdmin`.
- Admin roles: `super_admin` | `admin` | `editor`. `super_admin`/`admin` have full access; **editors are gated per-module** by the `permissions` JSON blob on `admin_users` (keys defined in Frontend `lib/adminPermissions.ts`).
- Staff management: `/api/admin/staff` (`src/routes/staff.ts`) — super_admin creates any role, admin creates only editors.

**Notable routes:** `media.ts` (paginated R2 media library, `media` table), `settings.ts` (site/section/page-SEO settings, `/api/site-settings` holds the theme), `uploads.ts` (`/api/upload-image`, `/api/upload-csv`, and `/uploads/*` R2 serving), `hero.ts`, `products.ts`, `categories.ts`, `coupons.ts`, `topAngebote.ts`, `influencers.ts`, etc.

**Schema:** `Backend/schema.sql` — apply with `wrangler d1 execute <db> --file=schema.sql --remote`.

**Commands:** `npm run dev` (wrangler dev), `npm run deploy`, `npm run types`.

**Deploy setup:** create D1 db + R2 bucket, wire IDs into `wrangler.toml`, set secrets (`JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`) and vars (`SITE_URL`, `CORS_ORIGIN`, `ENVIRONMENT`), then `wrangler deploy`. CORS allowed origins live in `src/middleware/cors.ts`.

## Frontend (`Frontend/`)

**Public site:** `src/app/*` (home, category, product, coupons, influencer, blog/magazine, legal pages). Shared UI in `src/app/components/`. Generic, presentational primitives live in `src/components/ui/` (the shadcn-style path third-party snippets import as `@/components/ui/*`); this is **not** a shadcn project — no `components.json`, no Radix — and `src/lib/utils.ts` exports `cn` backed by `clsx` alone (no `tailwind-merge`).

**Admin panel:** `src/app/admin/*` — one page per manageable section. `admin/layout.tsx` renders the permission-aware sidebar. Auth helpers in `src/lib/adminAuth.ts` (`adminFetch` attaches the `Authorization: Bearer` token).

**Recent admin features:**
- **Media library** — `admin/media/page.tsx` + reusable `components/MediaPicker.tsx` for choosing/uploading images from the R2-backed library.
- **Staff & permissions** — `admin/staff/page.tsx`; permission modules/groups defined in `src/lib/adminPermissions.ts`.
- **Footer colors** — the same admin theme page sets the footer background (`footer_color`: `primary-950|900|800|700` follows the Furniture theme, or a fixed `#hex`; default `primary-950`) plus optional `footer_heading_color`, `footer_text_color`, `footer_link_color`, `footer_link_hover_color`, `footer_divider_color`, `footer_icon_bg_color` (`#hex`, or `""` = default derived from the background: light on dark, navy on light). `lib/footerColor.ts` owns the fields and `footerCssVars()`; `ThemeProvider` sets those variables on `:root` (re-applied on theme changes) and toggles `html[data-footer-light]` for the logo swap, and the admin preview feeds the same variables to its own `.site-footer`. `Footer.tsx` hardcodes no colours — it uses the `.site-footer` classes in `globals.css` (`.footer-link/-heading/-muted/-line/-chip`).
- **Compare section** — the home `CompareProducts` card pairs its copy with an optional admin photo (right 56% from `lg`, a band above the copy below it) plus decorative VS/feature badges. Both live in the generic `/api/section-settings` store under section id `compare-products` (`backgroundImage`, `""` = none; `showBadges`, absent = shown) — no dedicated table. `lib/compareSection.ts` owns the id, defaults, `normalizeCompareSection()` and the recommended size (1600 × 900); the admin preview mirrors the card's geometry — change them together.
- **Home text** — the text block just before the home FAQs is the `longContent` of the `official-home` page-SEO record (`PUT /api/page-seo-settings/official-home`), edited in Home Page Settings with `RichDescriptionEditor` (one text for all languages; blank editor HTML saves as `""`, which hides the block). SEO Content hides that editor for the home page and omits `longContent` from its save — `json_patch` then keeps the stored value — so the two pages never overwrite each other. The key and `isBlankHtml()` live in `lib/homeText.ts`. Rendered by `components/home/HomeTextSection.tsx`; its typography (two columns from `lg`, accent rule under the h2, check-mark bullets, theme-coloured links) is the `.home-text` class in `globals.css` — keep pasted HTML free of inline styles.
- **Hero slides** — `admin/hero/page.tsx` (sidebar: **Home Page Settings**; route and `hero` permission key kept) manages three slots that `CompareHero` cross-fades as its full-width background (empty slots are skipped; `GET /api/hero` returns only configured slots). Each slide carries optional `showGradient` / `showText` switches (absent = shown, saved via `PUT /api/hero/:id`) that fade the hero's gradient and headline block per slide. The recommended size (2400 × 800, 3:1) and rotation interval live in `lib/heroSlides.ts`; the admin preview's overlay geometry mirrors `CompareHero`'s layout — change them together.
- **Home chrome** — the home variant of `Header` and `components/home/HomeSidebar.tsx` are light surfaces using `.surface-tint` (in `globals.css`: white `color-mix`ed with `--primary-50`) plus a thin `border-gray-200/80` and `shadow-soft-md`; text/icons are navy (`gray-800/900`). The primary colour is reserved for the active nav row (the only gradient), the search button, the upload accent and hover/focus tints — don't add primary backgrounds elsewhere. Below `lg` the sidebar's `HomeNavList` opens as `HomeNavDrawer` from the header's menu button; the drawer renders outside the header's transformed wrapper so `fixed` targets the viewport.
- **Sponsor ads** — `admin/sponsor-ads/page.tsx` books image + link creatives into home placements: `hero_below` and `compare_below` (many — each shown one at a time in an auto-sliding `SponsorAdCarousel`, `AD_ROTATE_SECONDS` = 5, admin-ordered; under the hero and under the compare section) and `sidebar_1`…`sidebar_5` (one each — saving replaces; spread down the right rail in `HeroSideCards`, `sidebar_5` being the rail's last card, a tall 1:2 skyscraper). The public feed returns every placement key (lists for multiple, one ad or `null` for single). From `xl` the right rail floats right, pulled up over the 390px hero (`xl:-mt-[104px]`), inside a `flow-root` wrapper — so a rail taller than the main column pushes the content below down instead of overlapping it; keep that offset in step with `CompareHero`'s height. Backend `routes/sponsorAds.ts` (`sponsor_ads` table, gated by the `sponsor-ads` permission); public `GET /api/sponsor-ads` returns active ads grouped by placement. Placement keys live in both `Backend/src/routes/sponsorAds.ts` and `Frontend/src/lib/sponsorAds.ts` (which also holds the recommended sizes) and **must stay in sync**. Separate from the older placement-less `sponsors` pool, which no longer feeds the home page.
- **Theme system** — `admin/theme/page.tsx` lets admins pick a color preset or a custom hex. `src/lib/colorPresets.ts` holds the Tailwind-shade presets (pink, rose, red, orange, purple, violet, blue, teal, green + custom) and `applyTheme`/`applyCustomHex` which set CSS variables. `src/providers/themeContext.tsx` (`ThemeProvider`/`useTheme`) loads from localStorage first (no flash) then reconciles with `/api/site-settings`. Tailwind consumes the CSS variables (`tailwind.config.ts`, `globals.css`).
- **Section patterns** — the same admin theme page picks an optional background texture (`none` | `dots` | `grid` | `diagonal-stripes` | `horizontal-lines` | `vertical-lines` | `checkerboard`) plus its ink color, opacity and tile size. There are **four independent slots — one per section color** (`section_pattern_1|2`, `coupon_section_pattern_1|2`), so the alternating A/B sections can differ. `src/lib/bgPatterns.ts` owns the gradient definitions and the `PatternSlot` type, which doubles as the settings-key base (`section_pattern_1_color`) and the CSS-variable prefix (`--section-pattern-1-image`); `ThemeProvider` publishes all four. Two families of classes in `globals.css` consume them:
  - `.section-bg-1|2` / `.coupon-section-bg-1|2` — the admin **color plus its pattern**, for sections painted with a section color.
  - `.section-pattern-1|2` / `.coupon-section-pattern-1|2` — **pattern only**, for sections that keep a background of their own (`bg-white`, `bg-gray-50`, …). Pair with a `bg-*` utility; never with a gradient, which fights over `background-image`.

  Public sections alternate the 1/2 pair down each page. Cards and chips that merely borrow a section color keep `bg-[var(--section-bg-N)]` and stay flat, and photo heroes / gradient / solid-black sections are deliberately left untextured. **Never set a section color with an inline `style={{ backgroundColor }}`** — that bypasses the pattern entirely (this bug is why `/`, `/kortingscodes` and `/categorie` showed no texture) and duplicates a fetch `ThemeProvider` already makes.

**Libs of note:** `lib/imageOptimizer.ts`, `lib/csvParser.ts`, `lib/userAuth.ts`, plus catalog data in `lib/categoryCatalog.ts`, `lib/homeCategoryGroups.ts`, `lib/influencerCatalog.ts`.

**Commands:** `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Conventions

- Frontend↔Backend contract keeps Mongo-style `_id`; the Backend maps D1 `id → _id` on the way out.
- Admin pages call the Backend through `adminFetch`; never hardcode the API host.
- New editor-gated admin sections must register a permission key in `lib/adminPermissions.ts` and be enforced with `requireStaff`/permission checks on the Backend.
