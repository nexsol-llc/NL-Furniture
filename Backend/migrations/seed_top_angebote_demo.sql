-- Demo data for the Top Angebote page (products + singleton settings).
-- Idempotent: fixed ids + INSERT OR REPLACE so re-running just refreshes it.

-- ── Settings singleton ────────────────────────────────────────────────────────
INSERT OR REPLACE INTO top_angebote_settings (id, data) VALUES (
  'singleton',
  json('{
    "pageTitle": "Top Angebote",
    "pageSubtitle": "Die besten Deals für Ihr Zuhause – handverlesen und täglich aktualisiert",
    "bannerTitle": "MEGA SOMMERSALE",
    "bannerSubtitle": "Bis zu 70% RABATT auf Möbel & Wohnaccessoires",
    "bannerImage": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&h=600&q=80",
    "longContent": "<h2>Die besten Möbel-Deals an einem Ort</h2><p>Bei <strong>NL Furniture</strong> sammeln wir täglich die stärksten Angebote führender Händler. Von Sofas über Betten bis hin zu Beleuchtung – hier finden Sie geprüfte Rabatte für jeden Raum.</p><ul><li>Täglich neue Blitzangebote</li><li>Geprüfte Händler & echte Preisnachlässe</li><li>Kuratiert vom NL-Furniture-Team</li></ul>",
    "faqs": [
      { "question": "Wie oft werden die Angebote aktualisiert?", "answer": "Unsere Angebote werden täglich aktualisiert. Blitzangebote können sich stündlich ändern, daher lohnt es sich, regelmäßig vorbeizuschauen." },
      { "question": "Sind die rabattierten Preise dauerhaft?", "answer": "Nein, viele Angebote sind zeitlich begrenzt. Besonders Blitzangebote laufen oft nur wenige Stunden." },
      { "question": "Kann ich Artikel aus den Angeboten zurückgeben?", "answer": "Ja, es gilt das gesetzliche Widerrufsrecht von 14 Tagen. Bitte beachten Sie die Rückgabebedingungen des jeweiligen Händlers." }
    ],
    "seoTitle": "Top Angebote – Beste Möbel-Deals | NL Furniture",
    "seoDescription": "Entdecken Sie täglich die besten Angebote für Möbel und Wohnaccessoires. Bis zu 70% Rabatt bei geprüften Händlern.",
    "seoKeywords": "Möbel Sale, Wohnen Rabatt, Top Angebote, Möbel Deals"
  }')
);

-- ── Demo products ─────────────────────────────────────────────────────────────
INSERT OR REPLACE INTO top_angebote_products (id, category, sort_order, created_at, data) VALUES
('demo-ta-1', 'Blitzangebote', 1, '2026-07-05T00:00:01.000Z', json('{"category":"Blitzangebote","title":"Modernes Samt-Sofa 3-Sitzer","brandName":"Home24","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80","saleValue":"-37%","price":"€ 499,00","oldPrice":"€ 799,00","link":"https://www.home24.de","sortOrder":1}')),
('demo-ta-2', 'Blitzangebote', 2, '2026-07-05T00:00:02.000Z', json('{"category":"Blitzangebote","title":"Eichenholz Esstisch 180cm","brandName":"OTTO","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80","saleValue":"-24%","price":"€ 349,00","oldPrice":"€ 459,00","link":"https://www.otto.de","sortOrder":2}')),
('demo-ta-3', 'Blitzangebote', 3, '2026-07-05T00:00:03.000Z', json('{"category":"Blitzangebote","title":"Bouclé Loungesessel","brandName":"Wayfair","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80","saleValue":"-24%","price":"€ 189,00","oldPrice":"€ 249,00","link":"https://www.wayfair.de","sortOrder":3}')),
('demo-ta-4', 'Sale Highlights', 1, '2026-07-05T00:00:04.000Z', json('{"category":"Sale Highlights","title":"Massivholzbett 180x200","brandName":"IKEA","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80","saleValue":"-33%","price":"€ 599,00","oldPrice":"€ 899,00","link":"https://www.ikea.com/de","sortOrder":1}')),
('demo-ta-5', 'Sale Highlights', 2, '2026-07-05T00:00:05.000Z', json('{"category":"Sale Highlights","title":"Bogen-Stehlampe Gold","brandName":"Amazon","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80","saleValue":"-34%","price":"€ 79,00","oldPrice":"€ 119,00","link":"https://www.amazon.de","sortOrder":2}')),
('demo-ta-6', 'Sale Highlights', 3, '2026-07-05T00:00:06.000Z', json('{"category":"Sale Highlights","title":"Bücherregal Industrial","brandName":"OTTO","brandLogo":"","productLogo":"https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=600&q=80","saleValue":"-28%","price":"€ 129,00","oldPrice":"€ 179,00","link":"https://www.otto.de","sortOrder":3}'));
