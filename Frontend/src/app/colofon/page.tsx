// src/app/colofon/page.tsx

import ImpressumClient from './ImpressumClient';

export const metadata = {
  title: 'Impressum | Rechtliche Hinweise | NL Furniture',
  description:
    'Impressum gemäß § 5 TMG – Angaben zum Betreiber, Kontakt, Haftung und Urheberrecht von NL Furniture.',
};

export default function ImpressumPage() {
  return <ImpressumClient />;
}
