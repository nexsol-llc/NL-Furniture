// src/app/advertentieverklaring/page.tsx

// WICHTIG: KEIN 'use client'; hier, weil die Seite statisch ist
// und metadata exportiert werden soll

import WerbekennzeichnungClient from './WerbekennzeichnungClient';

export const metadata = {
  title: 'Werbekennzeichnung | NL Furniture',
  description:
    'Informationen zur Werbekennzeichnung auf nl-furniture.nl: Affiliate-Links, Kooperationen mit Partnershops und die Unabhängigkeit unserer redaktionellen Inhalte.',
};

export default function WerbekennzeichnungPage() {
  return <WerbekennzeichnungClient />;
}
