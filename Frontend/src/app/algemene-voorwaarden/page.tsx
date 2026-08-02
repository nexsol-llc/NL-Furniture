// src/app/algemene-voorwaarden/page.tsx

// WICHTIG: KEIN 'use client'; hier, weil die Seite statisch ist
// und metadata exportiert werden soll

import NutzungsbedingungenClient from './NutzungsbedingungenClient';

export const metadata = {
  title: 'Nutzungsbedingungen & Benutzervereinbarung | NL Furniture',
  description:
    'Lesen Sie unsere Nutzungsbedingungen. NL Furniture ist eine Vergleichs- und Affiliate-Plattform für Möbel in Deutschland.',
};

export default function NutzungsbedingungenPage() {
  return <NutzungsbedingungenClient />;
}
