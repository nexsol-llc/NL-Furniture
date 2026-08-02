-- Furniture brand directory (title, slug, logo, description, …).
CREATE TABLE IF NOT EXISTS furniture_brands (
  id TEXT NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_furniture_brands_slug ON furniture_brands(slug);

-- Demo data (idempotent via fixed ids + INSERT OR REPLACE).
INSERT OR REPLACE INTO furniture_brands (id, slug, title, sort_order, created_at, data) VALUES
('demo-fb-1', 'ikea', 'IKEA', 1, '2026-07-05T00:00:01.000Z', json('{"title":"IKEA","slug":"ikea","logo":"https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=300&q=80","description":"Affordable Scandinavian furniture and home accessories for every room.","website":"https://www.ikea.com/de","featured":true,"sortOrder":1,"seoTitle":"IKEA Furniture & Home","seoDescription":"Shop IKEA furniture, storage and decor.","createdAt":"2026-07-05T00:00:01.000Z","updatedAt":"2026-07-05T00:00:01.000Z"}')),
('demo-fb-2', 'home24', 'Home24', 2, '2026-07-05T00:00:02.000Z', json('{"title":"Home24","slug":"home24","logo":"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80","description":"One of Europes largest online shops for furniture and home living.","website":"https://www.home24.de","featured":true,"sortOrder":2,"seoTitle":"Home24 Furniture","seoDescription":"Discover furniture and decor at Home24.","createdAt":"2026-07-05T00:00:02.000Z","updatedAt":"2026-07-05T00:00:02.000Z"}')),
('demo-fb-3', 'westwing', 'Westwing', 3, '2026-07-05T00:00:03.000Z', json('{"title":"Westwing","slug":"westwing","logo":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80","description":"Curated interior design pieces and inspiration for a beautiful home.","website":"https://www.westwing.de","featured":false,"sortOrder":3,"seoTitle":"Westwing Home & Living","seoDescription":"Curated furniture and decor from Westwing.","createdAt":"2026-07-05T00:00:03.000Z","updatedAt":"2026-07-05T00:00:03.000Z"}'));
