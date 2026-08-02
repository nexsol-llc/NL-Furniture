import { fromRows, type D1Row } from "../db.js";

// An authorBox on a brand only stores { authorId, bio, updatedAt } — the
// author's name/avatar/role/socials live once in the `authors` table and are
// merged in here at read time so every existing consumer (BrandPageClient,
// the admin edit form) keeps seeing the same flattened shape it always has.
export function mergeAuthorBox(authorBox: any, authorsById: Map<string, any>) {
  if (!authorBox || typeof authorBox !== "object" || !authorBox.authorId) return authorBox;
  const author = authorsById.get(authorBox.authorId);
  return {
    ...authorBox,
    name: author?.name || "",
    avatarUrl: author?.avatarUrl || "",
    role: author?.role || "",
    socialLinks: author?.socialLinks || {},
  };
}

export async function loadAuthorsById(db: D1Database): Promise<Map<string, any>> {
  const { results } = await db.prepare("SELECT id, data FROM authors").all<D1Row>();
  const map = new Map<string, any>();
  for (const a of fromRows(results)) map.set(a._id, a);
  return map;
}
