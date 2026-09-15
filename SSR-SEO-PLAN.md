# SSR & indexing plan — port from DIEWOHNEN

**Status:** not started. Do this before NL-Furniture goes live (the production domain
is not decided yet; nothing below hardcodes it).

**Reference implementation:** the same work is done in the DIEWOHNEN repo
(`diewohnen/Frontend`). Most NL files started as copies of the DIEWOHNEN ones, so the
fastest route is to diff each DIEWOHNEN file below against its NL counterpart and
port the change. Where the NL file has drifted, the notes say so.

---

## Why

The Frontend is Next.js 14 App Router, so the framework already does server
rendering. The first HTML is still empty because of one component.

- **Every page ships as an empty spinner.** `ThemeProvider`
  (`src/providers/themeContext.tsx:324-334`) renders a spinner in place of `children`
  until `/api/site-settings` has loaded in the browser. The server HTML of every
  page is therefore just `<div role="status" aria-label="Wird geladen">`, with no
  header, footer or text. This is true even for server components like `/colofon`.
  Crawlers, link previews and affiliate-network review tools see a blank site.
- **Category pages return soft 404s.** `app/[parentslug]/**` resolve the slug in a
  `useEffect` and call `notFound()` from the client, so every invalid URL answers
  **HTTP 200**.
- **The home, blog, categorie, merken, influencer and magazine pages** fetch all of
  their content in the browser.

Result on DIEWOHNEN after the fix (local production build, fetched with a Googlebot
user agent):

| URL | Before | After |
|---|---|---|
| `/` | 200, spinner only | 200, 168 KB, header/footer, 66 shop links, admin SEO title |
| `/impressum` | 200, spinner only | 200, full text |
| `/<parent>` · `/<parent>/<cat>` · `/<parent>/<cat>/<child>` | 200, spinner only | 200, `<h1>`, first 20 products, SEO text + FAQs |
| `/<cat>` (legacy URL) | 200, client redirect | **308** to `/<parent>/<cat>` |
| `/gibtesnicht-xyz` | **200** (soft 404) | **404** |
| `/blog/<missing-id>` | 200 "not found" page | **404** |
| `/product/<id>` | 308 to `/kategorie` | **410 Gone** + `X-Robots-Tag: noindex` |

---

## Step 0 — `/product/*` answers 410 Gone

There is no product page (products link straight to the merchant). Old `/product/<id>`
URLs should tell crawlers the page is gone for good. A redirect to the category
overview gets read as a soft 404 and keeps the URL indexed.

- Copy `diewohnen/Frontend/src/middleware.ts` to `src/middleware.ts` and translate
  the small HTML body to Dutch. It should link to `/categorie`.
- Delete the `/product/:id → /categorie` entry from `next.config.mjs`. Config
  redirects run **before** middleware, so while it exists the 410 never fires.
- **Don't** add `Disallow: /product/` to `public/robots.txt`. A blocked crawler never
  sees the 410, and the URL stays indexed.
- If any `/product/` URLs were ever indexed under the final domain, use Search
  Console → Removals → "Remove all URLs with this prefix". On a fresh domain this is
  probably unnecessary.

## Step 1 — remove the spinner gate and render the theme on the server

This is the big one. After it, every page's HTML contains the header, footer and
whatever the page renders with its initial state.

1. **`src/lib/siteSettings.ts`** — copy from DIEWOHNEN. It provides:
   - `fetchSiteSettings()`, a server fetch with `revalidate: 60`
   - `themeFromSettings()`
   - `sectionBgsFromSettings()`
   - `themeCss()`, which builds a `:root:root{…}` string with the `--primary-*`
     and `--section-bg-*` variables. Colour values are validated because they go
     into a `<style>` tag.

   NL also publishes **section patterns** and **footer colours** at runtime. Add both
   to `themeCss()`, or those areas will flash on load:
   - **Patterns:** `readAllPatterns(settings)`, then for each slot
     `patternCssValues(...)`, emitted as `--<slot with - instead of _>-image/-size/-position`.
     This is the same thing `applyPatternVars` does (`lib/bgPatterns.ts:159`), and
     `patternCssValues` is already pure.
   - **Footer:** `footerCssVars(readFooterTheme(settings))` (`lib/footerColor.ts:136`).
     **Catch:** `isLightFooter()` → `resolveBgHex()` reads `getComputedStyle`, which
     returns `null` on the server. A `primary-NNN` footer background would then always
     get white text. Give `footerCssVars`/`isLightFooter` an optional `shades`
     argument, and when the background is a primary shade, look its hex up in
     `resolveShades(theme, customHex)`. Also set `data-footer-light` on `<html>` from
     the root layout, since `applyFooterTheme` normally toggles it on the client.
2. **`src/providers/themeContext.tsx`** — port the DIEWOHNEN change:
   - Add an **optional** `initialSettings` prop.
   - Start every piece of state from it, including `footerTheme`, via
     `readFooterTheme(initialSettings)`.
   - Run the cached-`localStorage` block only when `initialSettings` is missing.
   - Keep the reconcile fetch.
   - Delete `loaded` and the spinner.

   The prop must stay optional: `app/admin/layout.tsx` uses `ThemeProvider` directly,
   three times.
3. **`src/app/components/Providers.tsx`** — accept `initialSettings` and pass it to
   `ThemeProvider`. Keep `CompareProvider` where it is. It is already SSR-safe: it
   starts empty and reads `localStorage` in an effect.
4. **`src/app/layout.tsx`** — make it `async` and `await fetchSiteSettings()`. Render
   `<head><style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss(s) }} /></head>`
   and pass `initialSettings` to `Providers`.
   **Also fix the root metadata.** It is German ("NL FURNITURE - Ihr Möbelhaus",
   "Exklusive Möbel…") on a `lang="nl"` site.

## Step 2 — category pages resolved on the server

- **`app/[parentslug]/page.tsx`, `[categoryslug]/page.tsx`, `[childslug]/page.tsx`** are
  identical to the DIEWOHNEN originals. Copy the new DIEWOHNEN versions verbatim.
  They are async server components that:
  - resolve the slug
  - `permanentRedirect()` legacy/non-canonical URLs
  - `notFound()` unknown ones
  - fetch the first page of products
- **`src/lib/categoryListing.ts`** — copy. It holds the shared product-query scope, so
  the server's first page matches what the client would fetch. It also has
  `fetchFirstProductsPage()` and `toCardFields()`.
- **`src/lib/categoryCatalog.ts`** — port `fetchInit()` (60 s cache on the server,
  `no-store` in the browser) and `routeSlug()`. The NL file differs from DIEWOHNEN's
  by 4 lines, so merge by hand.
- **`CategoryListingPage.tsx` / `FurnitureListingPage.tsx`** — the NL files have
  drifted by about 35 lines (layout tweaks), so **apply the diff by hand** rather
  than copying:
  - new optional `initialCategory` / `initialCategories` / `initialParents` /
    `initialProducts` props
  - state initialised from them
  - the first category and first products fetch skipped when present, but still run
    if the URL carries filters
  - `buildScopeParams` using `categoryScopeParams()`
  - `FurnitureListingPage`'s `filterCategories` function prop replaced by
    `parentCategoryId`, because a server component can't pass a function to a
    client component

## Step 3 — home page

The NL home page is a different design from DIEWOHNEN's (comparison layout), so port
the **pattern**, not the file:

- `git mv src/app/page.tsx src/app/HomePageClient.tsx`. Give it an
  `initial: HomeInitialData | null` prop, start every `useState` from it (and
  `loading` from `!initial`), and return early from the mount effect when `initial`
  is set.
- New `src/lib/homeData.ts` (see DIEWOHNEN's). Use NL's own fetch list:
  - `hero`
  - `sponsor-ads` (through `normalizeSponsorAds`)
  - `parent-categories` + `fetchCatalogList()` (for the per-parent counts)
  - `top-angebote-products`
  - `furniture-brands/featured?limit=30`
  - `home-products`
  - `sponsored-products`
  - `blog?summary=true&featured=true` (first 12)
  - `home-influencer`
  - `page-seo-settings/official-home`

  Apply the same mapping the client does today.
- New server `src/app/page.tsx`: `generateMetadata()` from `official-home`
  (`seoTitle` / `seoDescription` / `seoKeywords`), then
  `<HomePageClient initial={await fetchHomeData()} />`.

## Step 4 — remaining content pages

Copy `src/lib/serverApi.ts` (`serverGet`) and `src/lib/blogData.ts` first.

| Page | What to do |
|---|---|
| `blog/[id]` | `page.tsx` → `BlogDetailClient.tsx` (props: `blog`, `sectionSettings`, `socialLinks`; drop its fetches, loading/not-found branches and client meta-tag patching). New server `page.tsx` calls `notFound()` for a missing article. `layout.tsx` uses `fetchBlog()` so metadata and page share one request. The NL page differs by 44 lines, so port by hand. |
| `not-found.tsx` | New, in Dutch. It renders inside the root layout (header + footer) and keeps the 404 status. |
| `categorie` | Same as DIEWOHNEN `kategorie`: `KategorieClient` + server page that fetches settings, parent tiles and section products; `generateMetadata` from `kategorie-settings`. |
| `magazine`, `merken`, `influencer` | Server page fetches the list, client keeps the search box. Static `metadata` from `src/locales/nl.json`, not `de.json`. |

Static and legal pages (`colofon`, `privacybeleid`, `algemene-voorwaarden`,
`over-ons`, …) need nothing beyond step 1.

**Not converted in DIEWOHNEN yet either** — follow-ups for both sites:
`kortingscodes/**`, `merken/[slug]`, `influencer/[username]`,
`influencer/[username]/posts/[id]`.

## Step 5 — verify before deploying

```bash
cd Frontend
npm run build
npx next start -p 3100
# in another shell, for each URL type:
curl -s -A Googlebot -o page.html -w "%{http_code}\n" http://localhost:3100/<url>
grep -c '<footer' page.html; grep -c 'Wird geladen' page.html   # expect 1 and 0
```

Expect the "After" column of the table above. Bad slugs return 404, legacy category
URLs 308, and `/product/x` returns 410. Then open a few pages in a real browser with
DevTools open and confirm there are **no hydration errors** (React #418 / #423 / #425).
The site's `error.tsx` silently swallows those, so check the console.

## Gotchas learned on DIEWOHNEN

- **Server-render crashes.** Components never ran on the server while the spinner hid
  them. Anything that touches `window`/`document`/`localStorage` *during render* now
  crashes the server render with a 500. Effects are fine. Check the NL-only
  components (`components/home/*`, `SponsorAd`, `CompareProducts`) before shipping.
- **`notFound()` / `permanentRedirect()` throw** by design. Don't call them inside
  `try/catch`.
- **Caching.** Server fetches use `revalidate` (60 s for theme/catalog/home, 300 s for
  products/blog), so admin edits reach the server HTML within that window. The
  browser still fetches fresh data whenever a visitor filters.
- **Dates.** Keep dates and `Date.now()` out of the server render where possible
  (e.g. the "last updated" date on legal pages). They can differ between server and
  client and cause hydration warnings.
