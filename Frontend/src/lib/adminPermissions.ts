// Editor permission modules — each key can be granted/revoked per editor.
// super_admin and admin implicitly have access to everything; only editors
// are gated by these flags (stored on the admin_users.permissions JSON blob).

export interface PermissionModule {
  key: string;
  label: string;
  group: string;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  // Content
  { key: "hero", label: "Hero Section", group: "Content" },
  { key: "indoor-outdoor", label: "Indoor/Outdoor", group: "Content" },
  { key: "home-influencer", label: "Home Influencer", group: "Content" },
  { key: "sponsors", label: "Sponsors", group: "Content" },
  { key: "gadgets", label: "Gadgets", group: "Content" },
  { key: "top-angebote", label: "Top Angebote", group: "Content" },
  { key: "blog", label: "Blog/Magazine", group: "Content" },
  { key: "influencers", label: "Influencers", group: "Content" },
  { key: "newsletter", label: "Newsletter", group: "Content" },
  { key: "authors", label: "Authors", group: "Content" },
  // Shop
  { key: "coupons-home", label: "Coupons Home", group: "Shop" },
  { key: "categories", label: "Categories Manager", group: "Shop" },
  { key: "brands", label: "Coupon Brands", group: "Shop" },
  { key: "coupons", label: "Coupons", group: "Shop" },
  { key: "coupon-stores", label: "Coupon Stores", group: "Shop" },
  { key: "sonderangebote", label: "Sonder Angebote", group: "Shop" },
  { key: "upload", label: "Upload CSV", group: "Shop" },
  // Settings
  { key: "media", label: "Media Library", group: "Settings" },
  { key: "cookie-consent", label: "Cookie Consent", group: "Settings" },
  { key: "settings", label: "SEO Content", group: "Settings" },
];

export const PERMISSION_GROUPS = ["Content", "Shop", "Settings"] as const;
