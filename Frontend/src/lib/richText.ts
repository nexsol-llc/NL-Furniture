/**
 * Helpers shared by the admin rich-text editor and the public renderers.
 *
 * Description fields were plain textareas historically, so the database still
 * holds bare text with newlines for older rows. Everything here is written so
 * that legacy text keeps rendering correctly without a data migration.
 */

/** True when the value already carries markup we should render as HTML. */
export function looksLikeHtml(value?: string | null): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** True when the value has no meaningful content (empty, or empty markup). */
export function isEmptyRichText(value?: string | null): boolean {
  if (!value) return true;
  const stripped = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();
  return stripped === "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Normalise a stored value into HTML for the editor.
 * Legacy plain text becomes paragraphs so its line breaks survive.
 */
export function toEditorHtml(value?: string | null): string {
  if (!value) return "";
  if (looksLikeHtml(value)) return value;

  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/** Flatten rich text back to plain text — for meta tags, previews and excerpts. */
export function toPlainText(value?: string | null): string {
  if (!value) return "";
  if (!looksLikeHtml(value)) return value;
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
