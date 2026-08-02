// src/app/privacybeleid/page.tsx

import DatenschutzbestimmungenClient from './DatenschutzbestimmungenClient';

export const metadata = {
  title: 'Datenschutzbestimmungen & Datensicherheit | NL Furniture',
  description:
    'Unsere Datenschutzbestimmungen erklären, wie wir Ihre Daten schützen. DSGVO-konform – Affiliate-Vergleichsplattform für Möbel in Deutschland.',
};

export default function DatenschutzbestimmungenPage() {
  return <DatenschutzbestimmungenClient />;
}
