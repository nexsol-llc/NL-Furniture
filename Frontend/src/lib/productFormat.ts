// Formatting helpers for merchant/affiliate product data, which arrives from
// arbitrary feeds and admin forms with inconsistent price and link shapes.

// Normalize a product link so external URLs missing a scheme (e.g. "www.google.com")
// don't resolve against our own origin ("http://localhost:3001/www.google.com").
// Internal app paths ("/kortingscodes/...") and anchors ("#") are left untouched.
export const normalizeLink = (raw: unknown): string => {
  const l = String(raw ?? "").trim();
  if (!l || l === "#" || l.startsWith("/") || l.startsWith("#")) return l || "#";
  if (/^https?:\/\//i.test(l) || /^mailto:|^tel:/i.test(l)) return l;
  return `https://${l}`;
};

// The shop a product links to. Products have no page of their own on this
// site — every product link goes straight out to the merchant — so this is
// the one place that picks between the two feed columns. A row carrying
// neither resolves to "#", which the cards render unlinked.
export const shopLink = (product: {
  aw_deep_link?: string | null;
  merchant_deep_link?: string | null;
}): string => normalizeLink(product.aw_deep_link || product.merchant_deep_link || "#");

// Normalize prices coming from the product feed ("EUR 100", "EUR100", "89", "€89")
// into the German "…€" form (symbol after the amount, e.g. "282€").
export const formatPrice = (raw: unknown): string => {
  const amount = String(raw ?? "")
    .replace(/€/g, "")
    .replace(/eur/gi, "")
    .trim();
  return amount ? `${amount}€` : "";
};
