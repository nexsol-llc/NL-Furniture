import React from "react";
import { isEmptyRichText, looksLikeHtml } from "@/lib/richText";

type RichContentProps = {
  content?: string | null;
  className?: string;
  /** Wrapper element — use "span" inside a paragraph, "div" (default) elsewhere. */
  as?: "div" | "span";
};

/**
 * Renders a description written in the admin rich-text editor.
 *
 * Rows saved before the editor existed still hold bare text, so plain values
 * are rendered as-is with their line breaks preserved rather than being run
 * through dangerouslySetInnerHTML.
 */
export default function RichContent({ content, className = "", as = "div" }: RichContentProps) {
  if (isEmptyRichText(content)) return null;

  const Tag = as;

  if (!looksLikeHtml(content)) {
    return <Tag className={`whitespace-pre-line ${className}`}>{content}</Tag>;
  }

  return (
    <Tag
      className={`rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content as string }}
    />
  );
}
