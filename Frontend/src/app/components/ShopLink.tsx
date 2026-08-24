"use client";

import type { ReactNode } from "react";
import { normalizeLink } from "@/lib/productFormat";

// Every product link on the site goes straight out to the merchant's shop, in a
// new tab so the visitor keeps their place in the listing. There is no product
// page of our own to send them to. A product whose feed row carries no deep link
// renders as a plain element rather than an anchor pointing nowhere.
export default function ShopLink({
  href,
  className,
  children,
}: {
  href?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const url = normalizeLink(href);
  if (url === "#") return <div className={className}>{children}</div>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
