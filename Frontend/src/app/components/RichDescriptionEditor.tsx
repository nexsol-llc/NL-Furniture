"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Link2, Image as ImageIcon, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/adminAuth";
import { toEditorHtml } from "@/lib/richText";

export type RichEditorMode = "rich" | "html";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Height of the writing area. ~120 for short fields, 240+ for long content. */
  minHeight?: number;
  /** Hides H1–H5 — for short fields where headings make no sense. */
  headings?: boolean;
  className?: string;
}

const HEADINGS = ["h1", "h2", "h3", "h4", "h5"] as const;

const INLINE_BUTTONS = [
  { label: "B", cmd: "bold", cls: "font-semibold", title: "Bold" },
  { label: "I", cmd: "italic", cls: "italic", title: "Italic" },
  { label: "U", cmd: "underline", cls: "underline", title: "Underline" },
] as const;

export default function RichDescriptionEditor({
  value,
  onChange,
  placeholder = "Write description text...",
  minHeight = 240,
  headings = true,
  className = "",
}: RichDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  // What we last handed to the parent. Lets us tell an external value change
  // (must be written into the DOM) from our own echo (must not be, or the
  // caret jumps to the start on every keystroke).
  const lastEmittedRef = useRef<string | null>(null);

  const [mode, setMode] = useState<RichEditorMode>("rich");
  const [uploading, setUploading] = useState(false);

  // Push external value changes into the contentEditable.
  useEffect(() => {
    if (mode !== "rich") return;
    const el = editorRef.current;
    if (!el) return;
    if (value === lastEmittedRef.current) return;

    const html = toEditorHtml(value);
    if (html !== el.innerHTML) el.innerHTML = html;
    lastEmittedRef.current = value;
  }, [value, mode]);

  const emit = useCallback(
    (html: string) => {
      lastEmittedRef.current = html;
      onChange(html);
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    // An emptied contentEditable leaves <br>/<div> crumbs behind; report those
    // as "" so required-field checks still see the field as empty.
    const html = el.innerHTML;
    emit(html === "<br>" || html === "<div><br></div>" ? "" : html);
  }, [emit]);

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(cmd, false, arg);
      handleInput();
    },
    [handleInput]
  );

  const insertLink = useCallback(() => {
    const url = window.prompt("Enter link URL (https://...):");
    if (url) exec("createLink", url);
  }, [exec]);

  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await adminFetch("/api/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "Image upload failed");
        exec(
          "insertHTML",
          '<img src="' +
            data.url +
            '" alt="" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;display:block;" />'
        );
      } catch (error: any) {
        alert(error.message || "Image upload failed");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [exec]
  );

  // Paste as plain text so Word/website copy does not drag its styling along.
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleInput();
    },
    [handleInput]
  );

  const switchMode = (next: RichEditorMode) => {
    // Returning to rich mode: force the effect above to rewrite the DOM.
    if (next === "rich") lastEmittedRef.current = null;
    setMode(next);
  };

  const btn =
    "h-8 rounded-lg text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition disabled:opacity-40";

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {mode === "rich" && (
          <>
            {INLINE_BUTTONS.map(({ label, cmd, cls, title }) => (
              <button
                key={cmd}
                type="button"
                title={title}
                onMouseDown={(e) => {
                  e.preventDefault();
                  exec(cmd);
                }}
                className={`${btn} w-8 text-sm ${cls}`}
              >
                {label}
              </button>
            ))}

            {headings && (
              <>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                {HEADINGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    title={`Heading ${tag.slice(1)}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      exec("formatBlock", tag);
                    }}
                    className={`${btn} px-2 text-xs font-semibold`}
                  >
                    {tag.toUpperCase()}
                  </button>
                ))}
              </>
            )}

            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              type="button"
              title="Bullet list"
              onMouseDown={(e) => {
                e.preventDefault();
                exec("insertUnorderedList");
              }}
              className={`${btn} px-2 text-xs`}
            >
              • List
            </button>
            <button
              type="button"
              title="Insert link"
              onMouseDown={(e) => {
                e.preventDefault();
                insertLink();
              }}
              className={`${btn} px-2 text-xs flex items-center gap-1`}
            >
              <Link2 size={12} /> Link
            </button>
            <button
              type="button"
              title="Insert image"
              disabled={uploading}
              onMouseDown={(e) => {
                e.preventDefault();
                imageInputRef.current?.click();
              }}
              className={`${btn} px-2 text-xs flex items-center gap-1`}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} Img
            </button>
          </>
        )}

        {mode === "html" && (
          <span className="text-[11px] text-gray-500 px-1">
            Paste or edit raw HTML — saved exactly as written.
          </span>
        )}

        {/* Rich Text / HTML switch */}
        <div className="ml-auto flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
          {([["rich", "Rich Text"], ["html", "HTML"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={`px-2.5 h-7 text-[11px] font-semibold rounded-md transition ${
                mode === key ? "bg-primary-600 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />

      {mode === "rich" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className="rich-desc-editor p-4 text-sm text-gray-800 outline-none overflow-y-auto prose prose-sm max-w-none
            [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-5 [&_h1]:mb-3
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
            [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1
            [&_h5]:text-xs [&_h5]:font-semibold [&_h5]:mt-3 [&_h5]:mb-1
            [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
            [&_a]:text-primary-600 [&_a]:underline
            [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2"
          style={{ minHeight, maxHeight: Math.max(minHeight, 650) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => emit(e.target.value)}
          placeholder={"<h2>Heading</h2>\n<p>Your HTML here...</p>"}
          className="w-full p-4 font-mono text-xs text-gray-800 outline-none bg-gray-50 resize-y block"
          style={{ minHeight }}
        />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html:
            ".rich-desc-editor:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none;}",
        }}
      />
    </div>
  );
}
