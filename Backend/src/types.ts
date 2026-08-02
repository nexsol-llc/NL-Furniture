export interface Env {
  // Secrets
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  /** Cloudflare Turnstile secret key — verifies anonymous coupon votes aren't bots. */
  TURNSTILE_SECRET_KEY?: string;

  // Vars
  SITE_URL: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;

  // Bindings
  IMAGES: R2Bucket;
  DB: D1Database;
}

export interface JwtPayload {
  id: string;
  email: string;
  /** 'super_admin' | 'admin' | 'editor' for admin tokens; 'user' for customer tokens */
  role: string;
  name: string;
  type: "admin" | "user";
  /** Only present on editor tokens — keys are module names, true = access granted */
  permissions?: Record<string, boolean>;
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  role: "user";
  avatarUrl?: string;
  passwordHash?: string;
  likedProducts?: string[];
  resetToken?: string;
  resetTokenExpiry?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  _id?: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "editor";
  permissions: Record<string, boolean>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  aw_product_id: number;
  product_name: string;
  aw_deep_link?: string;
  merchant_deep_link?: string;
  merchant_product_id?: string;
  merchant_image_url?: string;
  description?: string;
  merchant_category?: string;
  search_price?: number;
  merchant_name?: string;
  merchant_id?: number;
  category_name?: string;
  aw_image_url?: string;
  display_price?: string;
  data_feed_id?: number;
  brand_name?: string;
  colour?: string;
  product_short_description?: string;
  aw_thumb_url?: string;
  delivery_cost?: string;
  alternate_image?: string;
  alternate_image_two?: string;
  alternate_image_three?: string;
  alternate_image_four?: string;
  is_sponsored?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
