# NL Furniture — setup

This project was copied from the DIEWOHNEN codebase and re-localized for the
Dutch market. The code runs and builds as-is, but it points at **placeholder**
Cloudflare resources and a **placeholder domain**. Work through the TODOs below
before deploying.

---

## 1. Decide the brand name and domain

Everything currently uses the working name **NL Furniture** and the placeholder
domain **nl-furniture.nl**. Neither is final. When you decide, search and replace:

| Placeholder | Appears in |
|---|---|
| `NL Furniture` / `NL FURNITURE` | UI copy, locale files, email templates |
| `nl-furniture.nl` | legal pages, SEO copy, CORS, `wrangler.toml` |
| `nl-furniture-api` | `Backend/wrangler.toml`, `Backend/package.json` |
| `noreply@nl-furniture.nl`, `admin@nl-furniture.nl` | `.dev.vars.example`, `Backend/src/lib/mail.ts` |

```bash
# from the repo root, after picking the real values
grep -ril "nl-furniture" Frontend/src Backend/src Backend/*.toml
```

The logo files are the **old DIEWOHNEN artwork**, renamed only:

- `Frontend/public/nl-furniture_logo_dark.png`
- `Frontend/public/nl-furniture_logo_light.png`

Replace both with real artwork. Keep the filenames or update the references in
`Header.tsx`, `Footer.tsx`, `CookieConsentBanner.tsx`, `ConditionalWrapper.tsx`
and `admin/cookie-consent/page.tsx`.

---

## 2. Cloudflare — DONE (2026-08-01)

### Which account

The `rvgdrogo@gmail.com` login can see **three** accounts, but the OAuth token
only authorizes one — the other two return `Authentication error [code: 10000]`:

| Account | ID | Usable |
|---|---|---|
| `Abdullahtraders128@gmail.com's Account` | `13542b1d89489091829944b397af5baf` | ✅ **this is the one** |
| `Affilinks.io@gmail.com's Account` | `16990d0e0dbb8de4461929fc167b1824` | ❌ no access |
| `Rvgdrogo@gmail.com's Account` | `609b382ed609baa86417f5f8d47df4ee` | ❌ no access |

Because more than one account is visible, wrangler refuses to pick one in
non-interactive mode. `account_id` is therefore **pinned in `wrangler.toml`** —
leave it there, it is what stops a command landing on the wrong account.

**This account already hosts other live projects.** Do not touch:

- D1 `platform-db` (`e040b48c…`) + R2 `platform-media`
- D1 `skin_choice` (`f9914ffb…`) + R2 `skin-choice-media`

Always name `nl-furniture-db` explicitly in `d1 execute` — `schema.sql:179` runs
a `DROP INDEX`, which is harmless in the right database and not in the wrong one.

### Resources created

| Resource | Name | ID / region |
|---|---|---|
| D1 | `nl-furniture-db` | `aa92d4a2-b6c5-41c7-b918-756c35d26fda`, **WEUR** |
| R2 | `nl-furniture-images` | location hint **weur**, Standard class |

Both were created with `--location weur` (Western Europe) rather than the default,
which resolved to APAC — wrong for a Dutch site on both latency and AVG grounds.
**A D1 primary region is fixed at creation**; changing it means creating a new
database and migrating.

### Schema — applied

```bash
npx wrangler d1 execute nl-furniture-db --file=schema.sql --remote -y        # 93 queries, 43 tables
npx wrangler d1 execute nl-furniture-db --file=seed-home-seo.sql --remote -y # Dutch home FAQs, 3 rows
```

Verified: 44 rows in `sqlite_master` (43 tables + `sqlite_sequence`), served by
`WEUR/CDG`. No demo seeds were applied — see §6, they are still German.

### Set secrets — NOT DONE

Secrets are per-Worker, so these cannot collide with the other projects' secrets.

```bash
npx wrangler secret put JWT_SECRET        # long random string, 32+ chars
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM       # e.g. noreply@<your-domain>
npx wrangler secret put ADMIN_EMAIL
```

### Deploy — NOT DONE

```bash
npx wrangler deploy
```

The Worker name `nl-furniture-api` is confirmed free on this account, so the
first deploy creates it rather than overwriting anything. Keep the `routes`
line in `wrangler.toml` **commented out** until the real domain exists — an
uncommented route pattern is the one setting here that could intercept traffic
for an existing zone. With it commented, the API is reachable only at
`https://nl-furniture-api.<subdomain>.workers.dev`.

`SITE_URL` and `CORS_ORIGIN` in `wrangler.toml` are still the placeholder
domain; fix them before the deploy is used for anything real.

---

## 3. Frontend (Vercel)

Set one environment variable:

```
NEXT_PUBLIC_API_URL = https://nl-furniture-api.<subdomain>.workers.dev
```

The build fails fast if it is missing (`next.config.mjs` throws). Locally,
`Frontend/.env.local` already points at `http://localhost:8787` for `wrangler dev`.

Also update the allowed origins in `Backend/src/middleware/cors.ts` — they
currently list the placeholder domain.

---

## 4. Local development

```bash
cd Backend  && npm install && npm run dev     # wrangler dev, port 8787
cd Frontend && npm install && npm run dev     # next dev, port 3000
```

`Backend/.dev.vars` was created with a generated dev `JWT_SECRET`. It is
gitignored. `RESEND_API_KEY` in it is a placeholder — outgoing email will fail
locally until you set a real key.

---

## 5. What changed from the source project

**Language.** Dutch (`nl`) is now a real locale and the default. `Frontend/src/locales/nl.json`
holds all 915 keys, verified at exact parity with `en.json`. German and English
remain switchable in the footer. Missing keys fall back to Dutch rather than
rendering a raw dot-path.

**Routes** are Dutch. German slugs were renamed and every internal link updated:

| Old | New |
|---|---|
| `/kategorie` | `/categorie` |
| `/gutscheine` | `/kortingscodes` |
| `/gutscheine/geschaeft` | `/kortingscodes/winkels` |
| `/gutscheine/spring-savecation` | `/kortingscodes/lente-deals` |
| `/marken` | `/merken` |
| `/innen` · `/aussen` | `/binnen` · `/buiten` |
| `/impressum` | `/colofon` |
| `/datenschutzbestimmungen` | `/privacybeleid` |
| `/nutzungsbedingungen` | `/algemene-voorwaarden` |
| `/werbekennzeichnung` | `/advertentieverklaring` |
| `/kontakt` | `/contact` |
| `/top-angebote` | `/topaanbiedingen` |
| `/partner-mit-uns` | `/partner-worden` |
| `/uberdiewohnen` | `/over-ons` |
| `/sell-on-die-wohnen` | `/verkopen-op-nl-furniture` |

API endpoints were **not** renamed (`/api/kategorie-settings`, `/api/top-angebote-*`
still use the original keys) — they are internal contracts, and renaming them
would mean a coordinated DB + Frontend change for no user-visible gain.

**Slug generation** no longer uses the German two-letter expansion (`ö→oe`),
which mangles Dutch: `coördinatie` produced `cooerdinatie`. It now strips
diacritics, so `coördinatie → coordinatie` and `geïnstalleerd → geinstalleerd`.
Changed in both `Backend/src/lib/slug.ts` and `Frontend/src/lib/parseCsvClient.ts`,
which must stay in sync.

**Legal pages** were rewritten for Dutch law in **all three locales**, not just
Dutch: references to `§ 5 TMG` / `RStV` became `artikel 3:15d BW`, `UWG` became
the Nederlandse Reclame Code, GDPR became AVG, and German jurisdiction became
Dutch. The market references followed (Germany → Netherlands, German partner
retailers → Dutch ones). A visitor switching to English or German now gets the
same legal facts in their language, rather than a page claiming German
jurisdiction for a Dutch business.

**Admin activity-log labels** are now English (they were German) to match the
rest of the admin UI, which is English.

---

## 6. Open TODOs

**Legal — needs real company data.** The Dutch entity's details are not known,
so `impressum.summaryText` in **each** of `nl.json`, `en.json` and `de.json`
carries an explicit marker, e.g.:

```
[TODO: KVK-nummer en btw-identificatienummer toevoegen zodra de Nederlandse entiteit bekend is.]
```

Search for `TODO` across `Frontend/src/locales/` to find all three.

The pages still name **Nexsol LLC, Denver, VS** and **Muhammad Ammad** as the
operator, carried over from the source project. A Dutch webshop must publish its
KVK number, BTW-identificatienummer and a real address. Confirm whether the
operating entity is the US LLC or a Dutch one, then update `impressum.*` and
`kontakt.*` in all three locale files. **Have a lawyer review these pages** —
they were translated, not legally reviewed.

**Two pre-existing broken links** were inherited from the source project (both
were already broken in `diewohnen`, they are not new):

1. `/privacy` — fixed. Now points at `/privacybeleid`.
2. `/search?q=...` in `Frontend/src/app/kortingscodes/components/CoupanHeader.tsx`
   — **still broken**. There is no `/search` route anywhere in the project. Either
   build a search page or remove the search box from that header. I did not
   invent a page for it.

**German demo seeds — do not apply as-is.** These still contain German content
and German product/category names:

```
Backend/migrations/seed_kategorie_demo.sql        (20 German lines)
Backend/migrations/seed_top_angebote_demo.sql     (12)
Backend/migrations/seed_products_demo.sql          (7)
Backend/migrations/2026-07-05_blog_categories.sql  (3)
Backend/migrations/seed_sonderangebote_page.sql    (2)
Backend/migrations/seed_influencers_demo.sql       (1)
```

Translate them first or skip them and enter real Dutch catalog data through the
admin panel. `schema.sql` itself is clean (its only German is in comments).

**Retailer names in copy.** Dutch-market retailers (IKEA, Leen Bakker, Beter Bed)
were substituted for the German ones (XXXLutz, Höffner) in FAQ and hero copy.
Verify these are retailers you actually have affiliate relationships with.

**Cashback page** referenced a competitor, **RetailMeNot**, by name in the source
(`bannerTagline`, `affiliateNoticePrefix`). Changed to NL Furniture — worth
knowing that string was in the original.

**English technical routes** were left as-is: `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/dashboard`, `/product`, `/blog`,
`/magazine`, `/brands`, `/admin`. They are not German, and renaming
`/reset-password` in particular would need the Backend's password-reset URL
updated in lockstep. Say the word if you want them Dutch too.

---

## 7. Verification status

| Check | Result |
|---|---|
| `Frontend` — `npm run build` | passes, 70 routes |
| `Backend` — `npx tsc --noEmit` | passes |
| `nl.json` key parity vs `en.json` | 915 / 915, no missing or extra |
| Internal link check (all `href` / `router.push`) | 1 unresolved: the pre-existing `/search` |
| Brand-string sweep for `diewohnen` variants | 0 remaining |

Not verified: nothing was run against a live D1/R2 instance, and no page was
opened in a browser. The database is empty until you apply the schema.
