"use client";
import React, { useEffect } from 'react';

// Klaro config – German translations, blocks GA4 & Meta Pixel by default
const klaroConfig = {
  version: 1,
  elementID: 'klaro',
  storageMethod: 'localStorage',
  cookieDomain: '',
  cookieName: 'klaro',
  cookieExpiresAfterDays: 365,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  translations: {
    de: {
      consentModal: {
        title: 'Wir nutzen Cookies',
        description: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und personalisierte Werbung zu schalten. Bitte wählen Sie, welche Arten von Cookies Sie zulassen möchten.',
        privacyPolicy: {
          name: 'Datenschutzrichtlinie',
          text: 'Bitte lesen Sie unsere {privacyPolicy} für weitere Informationen.'
        },
        acceptAll: 'Alle akzeptieren',
        acceptSelected: 'Auswahl akzeptieren',
        decline: 'Nur notwendige',
        close: 'Schließen',
      },
      consentNotice: {
        description: 'Wir nutzen Cookies, um Ihnen ein besseres Erlebnis zu bieten.',
        learnMore: 'Mehr erfahren',
        accept: 'Alle akzeptieren',
        decline: 'Nur notwendige'
      },
      contexts: { 
        advertising: 'Werbung',
      },
      services: {
        googleAnalytics: {
          description: 'Google Analytics wird verwendet, um Besucherstatistiken zu sammeln.',
          name: 'Google Analytics',
          purposes: ['analytics']
        },
        metaPixel: {
          description: 'Meta (Facebook) Pixel sammelt Daten für Zielgruppen und Conversion-Tracking.',
          name: 'Meta Pixel',
          purposes: ['advertising']
        }
      },
      purposes: {
        analytics: 'Statistiken',
        advertising: 'Werbung'
      }
    }
  },
  services: [
    {
      name: 'googleAnalytics',
      default: false,
      optOut: true,
      cookies: [{ name: '_ga' }, { name: '_ga_' }],
    },
    {
      name: 'metaPixel',
      default: false,
      optOut: true,
      cookies: [{ name: '_fbp' }, { name: '_fbc' }],
    },
  ]
};

export default function CookieConsent() {
  useEffect(() => {
    // @ts-ignore
    window.klaroConfig = klaroConfig;

    // Load Klaro script from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/klaro/dist/klaro.js';
    script.async = true;
    document.body.appendChild(script);

    // Load Klaro stylesheet
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/klaro/dist/klaro.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return null; // Klaro renders its own banner element
}
