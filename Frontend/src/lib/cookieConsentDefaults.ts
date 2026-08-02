export type CookieConsentSettings = {
  heading: string;
  bodyText: string;
  detailsLinkText: string;
  detailsLinkUrl: string;
  link1Text: string;
  link1Url: string;
  link2Text: string;
  link2Url: string;
  link3Text: string;
  link3Url: string;
  refuseButtonText: string;
  acceptButtonText: string;
  delaySeconds: number;
  isActive: boolean;
};

export const defaultCookieConsent: CookieConsentSettings = {
  heading: "Einwilligung zur Verwendung von Cookies 🍪",
  bodyText:
    'Wir verwenden Cookies, um Ihre Identität zu erfassen, die Nutzung unseres Dienstes zu verfolgen und Ihnen personalisierte Werbung anzuzeigen. Durch Klicken auf "Assume" stimmen Sie der Verwendung von Cookies zu.',
  detailsLinkText: "Details und Rechtsgrundlage",
  detailsLinkUrl: "/privacybeleid",
  link1Text: "Datenschutzerklärung",
  link1Url: "/privacybeleid",
  link2Text: "Impressum",
  link2Url: "/colofon",
  link3Text: "Nutzungsbedingungen",
  link3Url: "/algemene-voorwaarden",
  refuseButtonText: "Refuse",
  acceptButtonText: "Assume",
  delaySeconds: 2,
  isActive: true,
};

export const COOKIE_CONSENT_STORAGE_KEY = "nl-furniture-cookie-consent";
