// The home page's text block (shown just before the FAQs) is the `longContent`
// of this page-SEO record. It is edited in Admin → Home Page Settings; the SEO
// Content page hides that field for this key and leaves it out of its save, so
// the two editors never overwrite each other.
export const HOME_PAGE_SEO_KEY = "official-home";

/** True when editor HTML holds no visible content (e.g. "<p><br></p>"). */
export function isBlankHtml(html: string): boolean {
  if (/<(img|iframe|video)\b/i.test(html)) return false;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}
