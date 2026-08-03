import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";
import ConditionalWrapper from "./components/ConditionalWrapper";
import Script from "next/script";
import Providers from "./components/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
// Display serif for headlines only (h1-h3) — deliberately distinct from the
// clean Geist sans used everywhere else, so the brand reads differently from
// the DIEWOHNEN sibling site at a glance, not just on close CSS inspection.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NL FURNITURE - Ihr Möbelhaus",
  description: "Exklusive Möbel und Wohnaccessoires für Ihr Zuhause",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {/* CookieConsentBanner is rendered inside ConditionalWrapper for public
              routes only — admin and coupons pages must not show it */}
          <ConditionalWrapper>
            {children}
          </ConditionalWrapper>
        </Providers>
      </body>
    </html>
  );
}