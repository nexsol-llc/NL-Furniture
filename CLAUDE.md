# CLAUDE.md

Guidance for working in the **NL FURNITURE** monorepo.

## Architecture

Two independent apps:

- **`Frontend/`** — Next.js 14 (App Router, `src/app`), React 18, TypeScript, Tailwind CSS. Deployed to Vercel. Package name `nl-furniture`.
- **`Backend/`** — Cloudflare Workers API built on Hono v4. Deployed with `wrangler`. Package name `nl-furniture-api`.

The Backend replaces the old Next.js API routes. The Frontend talks to it over HTTP via `NEXT_PUBLIC_API_URL` (checked at runtime in `next.config`).

This codebase was copied from the German DIEWOHNEN project and re-localized for the Dutch market. See `SETUP.md` for provisioning steps and the remaining TODOs (placeholder Cloudflare IDs, placeholder domain, legal details).

## Localization

- **Dutch (`nl`) is the default language**; English and German are switchable in the footer. Dictionaries live in `Frontend/src/locales/{nl,en,de}.json` and must stay at **exact key parity** (currently 915 keys each) — a missing key falls back to Dutch via `providers/languageContext.tsx`.
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

**Public site:** `src/app/*` (home, category, product, coupons, influencer, blog/magazine, legal pages). Shared UI in `src/app/components/`.

**Admin panel:** `src/app/admin/*` — one page per manageable section. `admin/layout.tsx` renders the permission-aware sidebar. Auth helpers in `src/lib/adminAuth.ts` (`adminFetch` attaches the `Authorization: Bearer` token).

**Recent admin features:**
- **Media library** — `admin/media/page.tsx` + reusable `components/MediaPicker.tsx` for choosing/uploading images from the R2-backed library.
- **Staff & permissions** — `admin/staff/page.tsx`; permission modules/groups defined in `src/lib/adminPermissions.ts`.
- **Theme system** — `admin/theme/page.tsx` lets admins pick a color preset or a custom hex. `src/lib/colorPresets.ts` holds the Tailwind-shade presets (pink, rose, red, orange, purple, violet, blue, teal, green + custom) and `applyTheme`/`applyCustomHex` which set CSS variables. `src/providers/themeContext.tsx` (`ThemeProvider`/`useTheme`) loads from localStorage first (no flash) then reconciles with `/api/site-settings`. Tailwind consumes the CSS variables (`tailwind.config.ts`, `globals.css`).

**Libs of note:** `lib/imageOptimizer.ts`, `lib/csvParser.ts`, `lib/userAuth.ts`, plus catalog data in `lib/categoryCatalog.ts`, `lib/homeCategoryGroups.ts`, `lib/influencerCatalog.ts`.

**Commands:** `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Conventions

- Frontend↔Backend contract keeps Mongo-style `_id`; the Backend maps D1 `id → _id` on the way out.
- Admin pages call the Backend through `adminFetch`; never hardcode the API host.
- New editor-gated admin sections must register a permission key in `lib/adminPermissions.ts` and be enforced with `requireStaff`/permission checks on the Backend.
