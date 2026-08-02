-- Seed the current hard-coded home page FAQs into page_seo_settings (key: official-home).
-- Idempotent: inserts the full default document when absent, otherwise merges only the
-- FAQs into whatever is already stored (preserving any admin-entered title/SEO/content).
-- Text mirrors `home.defaultFaqs` in Frontend/src/locales/nl.json — keep the two in sync.
-- Apply: wrangler d1 execute nl-furniture-db --file=seed-home-seo.sql --remote

INSERT INTO page_seo_settings (id, page_key, data)
VALUES (
  'official-home-seo',
  'official-home',
  json('{
    "pageKey": "official-home",
    "pageTitle": "",
    "pageSubtitle": "",
    "longContent": "",
    "faqs": [
      { "question": "Hoe werkt cashback op dit platform?", "answer": "Als je via onze links winkelt, krijg je een deel van de aankoopprijs terug als cashback. Het exacte bedrag hangt af van de winkel en de aanbieding." },
      { "question": "Moet ik me registreren om kortingen te gebruiken?", "answer": "Nee, de meeste kortingscodes en aanbiedingen kun je direct gebruiken zonder registratie. Voor persoonlijke aanbevelingen en cashback raden we wel een gratis account aan." },
      { "question": "Hoe lang zijn kortingscodes geldig?", "answer": "De geldigheidsduur verschilt per aanbieding. De vervaldatum staat direct bij de betreffende code vermeld. Verlopen codes worden automatisch uit het systeem verwijderd." },
      { "question": "Kan ik meerdere kortingscodes combineren?", "answer": "Meestal kun je maar een code per bestelling inwisselen. Of combineren mogelijk is, hangt af van de winkel. Lees de voorwaarden bij de code goed door." },
      { "question": "Komen er regelmatig nieuwe meubeldeals bij?", "answer": "Ja, we werken onze aanbiedingen dagelijks bij. Meld je aan voor onze nieuwsbrief en hoor als eerste over nieuwe kortingen en exclusieve acties." }
    ],
    "seoTitle": "",
    "seoDescription": "",
    "seoKeywords": ""
  }')
)
ON CONFLICT(page_key) DO UPDATE SET data = json_patch(
  data,
  json('{
    "faqs": [
      { "question": "Hoe werkt cashback op dit platform?", "answer": "Als je via onze links winkelt, krijg je een deel van de aankoopprijs terug als cashback. Het exacte bedrag hangt af van de winkel en de aanbieding." },
      { "question": "Moet ik me registreren om kortingen te gebruiken?", "answer": "Nee, de meeste kortingscodes en aanbiedingen kun je direct gebruiken zonder registratie. Voor persoonlijke aanbevelingen en cashback raden we wel een gratis account aan." },
      { "question": "Hoe lang zijn kortingscodes geldig?", "answer": "De geldigheidsduur verschilt per aanbieding. De vervaldatum staat direct bij de betreffende code vermeld. Verlopen codes worden automatisch uit het systeem verwijderd." },
      { "question": "Kan ik meerdere kortingscodes combineren?", "answer": "Meestal kun je maar een code per bestelling inwisselen. Of combineren mogelijk is, hangt af van de winkel. Lees de voorwaarden bij de code goed door." },
      { "question": "Komen er regelmatig nieuwe meubeldeals bij?", "answer": "Ja, we werken onze aanbiedingen dagelijks bij. Meld je aan voor onze nieuwsbrief en hoor als eerste over nieuwe kortingen en exclusieve acties." }
    ]
  }')
);
