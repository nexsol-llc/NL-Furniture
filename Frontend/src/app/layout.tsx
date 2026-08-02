import type { Metadata } from "next";
import localFont from "next/font/local";
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
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