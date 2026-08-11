-- Demo data for the /categorie page (settings singleton) + category catalogs.
-- Idempotent: fixed ids + INSERT OR REPLACE.

-- ── Kategorie page settings ───────────────────────────────────────────────────
INSERT OR REPLACE INTO kategorie_page_settings (id, data) VALUES (
  'singleton',
  json('{
    "seoTitle": "Möbel-Kategorien | NL FURNITURE",
    "seoDescription": "Entdecken Sie unsere breite Auswahl an Möbelkategorien – Sofas, Betten, Tische, Schränke und mehr bei NL FURNITURE.",
    "longContent": "<h2>Alle Möbel-Kategorien auf einen Blick</h2><p>Von gemütlichen Sofas über erholsame Betten bis hin zu praktischen Stauraumlösungen – bei <strong>NL FURNITURE</strong> finden Sie kuratierte Möbel für jeden Raum. Vergleichen Sie Angebote führender Händler und entdecken Sie täglich neue Produkte.</p>",
    "sections": [
      { "key": "sofas", "title": "Sofas", "desc": "Komfortable Sofas und Couches für Ihr Wohnzimmer" },
      { "key": "beds", "title": "Betten", "desc": "Gemütliche Betten für erholsamen Schlaf" },
      { "key": "chairs", "title": "Stühle", "desc": "Stühle, Sessel und Barhocker in verschiedenen Designs" },
      { "key": "tables", "title": "Tische", "desc": "Esstische, Couchtische und Nachttische" }
    ],
    "categories": [
      { "type": "indoor", "name": "Betten", "slug": "beds", "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80" },
      { "type": "indoor", "name": "Sofas", "slug": "sofas", "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80" },
      { "type": "indoor", "name": "Stühle", "slug": "chairs", "image": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=200&q=80" },
      { "type": "indoor", "name": "Tische", "slug": "tables", "image": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=200&q=80" },
      { "type": "indoor", "name": "Schränke", "slug": "storage", "image": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=200&q=80" },
      { "type": "indoor", "name": "Beleuchtung", "slug": "lighting", "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=200&q=80" },
      { "type": "outdoor", "name": "Gartenmöbel", "slug": "outdoor", "image": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=200&q=80" },
      { "type": "outdoor", "name": "Loungesets", "slug": "lounge-sets", "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80" },
      { "type": "outdoor", "name": "Sonnenschirme", "slug": "parasols", "image": "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=200&q=80" }
    ],
    "faqs": [
      { "question": "Welche Kategorien finde ich auf nl-furniture.nl?", "answer": "Wir bieten Sofas, Betten, Tische, Stühle, Schränke, Beleuchtung sowie Outdoor-Möbel und Wohnaccessoires." },
      { "question": "Wie finde ich die passenden Möbel?", "answer": "Nutzen Sie die Filteroptionen in den Kategorien oder stöbern Sie im Magazin für Inspiration." },
      { "question": "Kommen regelmäßig neue Produkte hinzu?", "answer": "Ja, die Sortimente unserer Partner werden täglich aktualisiert." }
    ],
    "createdAt": "2026-07-05T00:00:00.000Z",
    "updatedAt": "2026-07-05T00:00:00.000Z"
  }')
);

-- ── Category catalogs ─────────────────────────────────────────────────────────
INSERT OR REPLACE INTO category_catalogs (id, slug, aliases, data) VALUES
('demo-cc-beds', 'beds', json('["beds","betten","bett"]'), json('{
  "name": "Betten",
  "slug": "beds",
  "aliases": ["beds","betten","bett"],
  "seoTitle": "Betten kaufen | NL FURNITURE",
  "seoDescription": "Gemütliche Betten in allen Größen und Stilen – vergleichen Sie Angebote führender Händler.",
  "description": "<p>Finden Sie das perfekte Bett für erholsamen Schlaf – von Massivholzbetten bis Polsterbetten.</p>",
  "faqs": [ { "question": "Welche Bettgrößen gibt es?", "answer": "Von 90x200 (Einzelbett) bis 180x200 (Familienbett) und mehr." } ],
  "childCategories": [
    { "slug": "polsterbetten", "name": "Polsterbetten", "imageUrl": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=200&q=80", "iconName": "Bed", "seoTitle": "Polsterbetten", "seoDescription": "Weiche Polsterbetten.", "description": "Gepolsterte Betten für gemütlichen Komfort.", "searchTerms": ["polsterbett","upholstered bed"], "faqs": [] },
    { "slug": "massivholzbetten", "name": "Massivholzbetten", "imageUrl": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80", "iconName": "Bed", "seoTitle": "Massivholzbetten", "seoDescription": "Robuste Betten aus Massivholz.", "description": "Zeitlose Betten aus massivem Holz.", "searchTerms": ["massivholzbett","solid wood bed"], "faqs": [] }
  ],
  "createdAt": "2026-07-05T00:00:01.000Z",
  "updatedAt": "2026-07-05T00:00:01.000Z"
}')),
('demo-cc-sofas', 'sofas', json('["sofas","sofa","couch","couches"]'), json('{
  "name": "Sofas",
  "slug": "sofas",
  "aliases": ["sofas","sofa","couch","couches"],
  "seoTitle": "Sofas & Couches kaufen | NL FURNITURE",
  "seoDescription": "Komfortable Sofas und Couches für jedes Wohnzimmer – Ecksofas, Schlafsofas und mehr.",
  "description": "<p>Entdecken Sie Sofas in allen Formen und Farben – vom kompakten 2-Sitzer bis zur großen Wohnlandschaft.</p>",
  "faqs": [ { "question": "Welche Sofatypen gibt es?", "answer": "Ecksofas, Schlafsofas, 2- und 3-Sitzer sowie Wohnlandschaften." } ],
  "childCategories": [
    { "slug": "ecksofas", "name": "Ecksofas", "imageUrl": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80", "iconName": "Sofa", "seoTitle": "Ecksofas", "seoDescription": "Platzsparende Ecksofas.", "description": "L-förmige Sofas für mehr Sitzplätze.", "searchTerms": ["ecksofa","corner sofa"], "faqs": [] },
    { "slug": "schlafsofas", "name": "Schlafsofas", "imageUrl": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=200&q=80", "iconName": "Sofa", "seoTitle": "Schlafsofas", "seoDescription": "Sofas mit Schlaffunktion.", "description": "Praktische Sofas mit Bettfunktion für Gäste.", "searchTerms": ["schlafsofa","sofa bed"], "faqs": [] }
  ],
  "createdAt": "2026-07-05T00:00:02.000Z",
  "updatedAt": "2026-07-05T00:00:02.000Z"
}'));
