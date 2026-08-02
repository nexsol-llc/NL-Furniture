"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Eraser,
  Code,
  Eye,
  Loader2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Schreiben Sie Ihren Inhalt hier...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const [isCodeMode, setIsCodeMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);
  
  // Toolbar states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    quote: false,
    list: false,
    listOrdered: false,
    heading: "p",
  });

  // Track and save current text selection
  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
    updateActiveFormats();
  };

  // Restore saved selection range
  const restoreSelection = () => {
    if (savedSelectionRef.current && typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Sync value from parent (only if it differs from current editor DOM to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && !isCodeMode) {
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isCodeMode]);

  // Close heading dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(e.target as Node)) {
        setShowHeadingDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update active toolbar button states based on selection
  const updateActiveFormats = () => {
    if (typeof window === "undefined") return;
    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const isList = document.queryCommandState("insertUnorderedList");
      const isListOrdered = document.queryCommandState("insertOrderedList");

      let heading = "p";
      let isQuote = false;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node = sel.getRangeAt(0).startContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = (node as Element).tagName.toLowerCase();
            if (tagName === "blockquote") {
              isQuote = true;
            }
            if (/^h[1-9]$|^h10$/.test(tagName)) {
              heading = tagName;
            }
          }
          node = node.parentNode as Node;
        }
      }

      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike,
        quote: isQuote,
        list: isList,
        listOrdered: isListOrdered,
        heading,
      });
    } catch (e) {
      // Fail-safe
    }
  };

  // Handle typing inside contentEditable
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Apply formatting commands
  const applyFormat = (command: string, arg: string = "") => {
    restoreSelection();
    if (!savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
    updateActiveFormats();
  };

  // Apply font size via inline style on selected text
  const handleFontSize = (size: number) => {
    setFontSize(size);
    restoreSelection();
    if (!savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      // Wrap selected text in a span with font-size
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      try {
        range.surroundContents(span);
      } catch {
        // If surroundContents fails (cross-element selection), use execCommand
        document.execCommand("fontSize", false, "7");
        const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
        fontEls?.forEach((el) => {
          const s = document.createElement("span");
          s.style.fontSize = `${size}px`;
          s.innerHTML = (el as HTMLElement).innerHTML;
          el.parentNode?.replaceChild(s, el);
        });
      }
      handleInput();
    }
  };

  // Formatting custom headings H1 to H10
  // Browsers support formatBlock only for h1-h6; for h7-h10 we use insertHTML
  const handleHeadingChange = (tag: string) => {
    restoreSelection();
    if (!savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
    }

    const standardTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6"];
    if (standardTags.includes(tag)) {
      document.execCommand("formatBlock", false, tag);
    } else {
      // h7-h10: get selected text or current block text and wrap it
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // If selection is collapsed, get the whole block's text
        let text = sel.toString();
        if (!text) {
          // Try to get the current block container text
          let node: Node | null = range.startContainer;
          while (node && node !== editorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              const tn = el.tagName.toLowerCase();
              if (/^(p|h[1-9]$|h10|div|li)/.test(tn)) {
                text = el.innerHTML || el.textContent || "";
                el.outerHTML = `<${tag}>${text}</${tag}>`;
                handleInput();
                updateActiveFormats();
                return;
              }
            }
            node = node.parentNode;
          }
        }
        // Wrap selected content
        const selectedText = range.extractContents();
        const wrapper = document.createElement(tag as keyof HTMLElementTagNameMap);
        wrapper.appendChild(selectedText);
        range.insertNode(wrapper);
        // Move cursor after the new element
        range.setStartAfter(wrapper);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    handleInput();
    updateActiveFormats();
  };

  // Toggle Link popup
  const handleLinkBtnClick = () => {
    saveSelection();
    setShowLinkInput(!showLinkInput);
  };

  // Insert Link to the editor
  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      return;
    }
    restoreSelection();
    if (!savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    // If no text selected, insert the link as clickable text
    if (selection && selection.isCollapsed) {
      const formattedLink = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: underline; font-weight: 500;">${linkUrl}</a>`;
      document.execCommand("insertHTML", false, formattedLink);
    } else {
      document.execCommand("createLink", false, linkUrl);
      // Try to find the link node and style it
      const parent = selection?.anchorNode?.parentElement;
      if (parent && parent.tagName === "A") {
        parent.setAttribute("target", "_blank");
        parent.setAttribute("rel", "noopener noreferrer");
        parent.setAttribute("style", "color: #0d9488; text-decoration: underline; font-weight: 500;");
      }
    }

    handleInput();
    setLinkUrl("");
    setShowLinkInput(false);
  };

  // Trigger hidden image file uploader
  const handleImageClick = () => {
    saveSelection();
    fileInputRef.current?.click();
  };

  // Handle local image file uploading
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        restoreSelection();
        if (!savedSelectionRef.current && editorRef.current) {
          editorRef.current.focus();
        }
        
        const imgTag = `<img src="${data.url}" alt="Bilder" style="max-width: 100%; height: auto; border-radius: 12px; margin: 16px auto; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" />`;
        document.execCommand("insertHTML", false, imgTag);
        handleInput();
      } else {
        alert("❌ Fehler beim Hochladen: " + (data.error || "Unbekannter Fehler"));
      }
    } catch (err: any) {
      console.error(err);
      alert("❌ Upload-Fehler: " + (err.message || "Netzwerkfehler"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
      {/* Stylesheet for empty placeholder support */}
      <style dangerouslySetInnerHTML={{ __html: `
        .rich-editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
          display: block;
        }
        .rich-editor-content h1, .rich-editor-content h2, .rich-editor-content h3,
        .rich-editor-content h4, .rich-editor-content h5, .rich-editor-content h6,
        .rich-editor-content h7, .rich-editor-content h8, .rich-editor-content h9,
        .rich-editor-content h10 {
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #111827;
          line-height: 1.3;
        }
        .rich-editor-content h1  { font-size: 2.25rem; }
        .rich-editor-content h2  { font-size: 1.875rem; }
        .rich-editor-content h3  { font-size: 1.5rem; }
        .rich-editor-content h4  { font-size: 1.25rem; }
        .rich-editor-content h5  { font-size: 1.125rem; }
        .rich-editor-content h6  { font-size: 1rem; }
        .rich-editor-content h7  { font-size: 0.9rem; }
        .rich-editor-content h8  { font-size: 0.85rem; }
        .rich-editor-content h9  { font-size: 0.8rem; }
        .rich-editor-content h10 { font-size: 0.75rem; }
        .rich-editor-content a { color: #0d9488; text-decoration: underline; }
      `}} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border-b border-gray-200 select-none">
        
        {/* Headings — custom visual dropdown */}
        <div ref={headingDropdownRef} className="relative">
          <button
            type="button"
            disabled={isCodeMode}
            onMouseDown={(e) => { e.preventDefault(); setShowHeadingDropdown((v) => !v); }}
            className="flex items-center gap-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-300 focus:outline-none disabled:opacity-50 cursor-pointer min-w-[90px] justify-between"
          >
            <span>
              {activeFormats.heading === "p" ? "Paragraph"
                : activeFormats.heading.toUpperCase()}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 flex-shrink-0">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showHeadingDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-[250px] min-w-[200px]">
              {[
                { tag: "p",   label: "Paragraph",  style: { fontSize: "0.85rem", fontWeight: 400, color: "#6b7280" } },
                { tag: "h1",  label: "H1 Heading", style: { fontSize: "1.6rem",  fontWeight: 800, color: "#111827", lineHeight: 1.2 } },
                { tag: "h2",  label: "H2 Heading", style: { fontSize: "1.35rem", fontWeight: 700, color: "#111827" } },
                { tag: "h3",  label: "H3 Heading", style: { fontSize: "1.15rem", fontWeight: 700, color: "#1f2937" } },
                { tag: "h4",  label: "H4 Heading", style: { fontSize: "1rem",    fontWeight: 700, color: "#1f2937" } },
                { tag: "h5",  label: "H5 Heading", style: { fontSize: "0.9rem",  fontWeight: 600, color: "#374151" } },
                { tag: "h6",  label: "H6 Heading", style: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" } },
                { tag: "h7",  label: "H7 Heading", style: { fontSize: "0.78rem", fontWeight: 600, color: "#4b5563" } },
                { tag: "h8",  label: "H8 Heading", style: { fontSize: "0.74rem", fontWeight: 600, color: "#4b5563" } },
                { tag: "h9",  label: "H9 Heading", style: { fontSize: "0.7rem",  fontWeight: 600, color: "#6b7280" } },
                { tag: "h10", label: "H10 Heading",style: { fontSize: "0.66rem", fontWeight: 600, color: "#6b7280" } },
              ].map(({ tag, label, style }) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleHeadingChange(tag);
                    setShowHeadingDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-teal-50 transition flex items-center gap-2 ${
                    activeFormats.heading === tag ? "bg-teal-50 border-l-2 border-teal-500" : "border-l-2 border-transparent"
                  }`}
                >
                  <span style={style as React.CSSProperties} className="flex-1">
                    {label}
                  </span>
                  {activeFormats.heading === tag && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-teal-500 flex-shrink-0">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-gray-200 mx-1" />

        {/* Font Size Slider */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isCodeMode}
            onMouseDown={(e) => { e.preventDefault(); handleFontSize(Math.max(8, fontSize - 1)); }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition text-sm font-bold disabled:opacity-40 select-none"
            title="Font size decrease"
          >−</button>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={8}
              max={72}
              step={1}
              value={fontSize}
              disabled={isCodeMode}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleFontSize(Number(e.target.value))}
              className="w-20 h-1.5 accent-teal-500 cursor-pointer disabled:opacity-40"
              title={`Font size: ${fontSize}px`}
            />
            <span className="text-xs font-mono text-gray-500 w-7 text-center">{fontSize}px</span>
          </div>
          <button
            type="button"
            disabled={isCodeMode}
            onMouseDown={(e) => { e.preventDefault(); handleFontSize(Math.min(72, fontSize + 1)); }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition text-sm font-bold disabled:opacity-40 select-none"
            title="Font size increase"
          >+</button>
        </div>

        <div className="h-6 w-[1px] bg-gray-200 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Fett (Bold)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.bold ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Kursiv (Italic)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.italic ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => applyFormat("underline")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Unterstrichen (Underline)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.underline ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <Underline size={16} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => applyFormat("strikeThrough")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Durchgestrichen (Strikethrough)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.strike ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <Strikethrough size={16} />
        </button>

        {/* Quote / Blockquote */}
        <button
          type="button"
          onClick={() => applyFormat("formatBlock", "blockquote")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Zitat (Blockquote)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.quote ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <Quote size={16} />
        </button>

        {/* Bullet Points */}
        <button
          type="button"
          onClick={() => applyFormat("insertUnorderedList")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Aufzählung (Bullets)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.list ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <List size={16} />
        </button>

        {/* Numbering */}
        <button
          type="button"
          onClick={() => applyFormat("insertOrderedList")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Nummerierung (Numbers)"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            activeFormats.listOrdered ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <ListOrdered size={16} />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={handleLinkBtnClick}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Link einfügen"
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ${
            showLinkInput ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          } disabled:opacity-50`}
        >
          <LinkIcon size={16} />
        </button>

        {/* Image upload */}
        <button
          type="button"
          onClick={handleImageClick}
          disabled={isCodeMode || uploading}
          onMouseDown={(e) => e.preventDefault()}
          title="Bild hochladen"
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin text-teal-500" /> : <ImageIcon size={16} />}
        </button>

        {/* Eraser / Clear Formatting */}
        <button
          type="button"
          onClick={() => applyFormat("removeFormat")}
          disabled={isCodeMode}
          onMouseDown={(e) => e.preventDefault()}
          title="Formatierung löschen"
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition disabled:opacity-50"
        >
          <Eraser size={16} />
        </button>

        <div className="h-6 w-[1px] bg-gray-200 mx-1 flex-grow md:flex-grow-0" />

        {/* Source Code Toggle */}
        <button
          type="button"
          onClick={() => setIsCodeMode(!isCodeMode)}
          title={isCodeMode ? "Visueller Editor" : "HTML-Code bearbeiten"}
          className={`p-1.5 rounded-lg hover:bg-gray-200 transition ml-auto ${
            isCodeMode ? "bg-teal-50 text-teal-600 border border-teal-200" : "text-gray-600"
          }`}
        >
          {isCodeMode ? <Eye size={16} /> : <Code size={16} />}
        </button>
      </div>

      {/* Inline Link input box */}
      {showLinkInput && (
        <div className="flex gap-2 p-2 bg-teal-50 border-b border-gray-200 items-center">
          <input
            type="text"
            placeholder="Link URL eingeben (z.B. https://example.com)..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 border border-teal-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInsertLink();
            }}
          />
          <button
            type="button"
            onClick={handleInsertLink}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            Hinzufügen
          </button>
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
            className="text-gray-500 hover:text-gray-700 text-xs px-2"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Editing Area */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        {isCodeMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full flex-1 min-h-[300px] p-4 font-mono text-sm focus:outline-none bg-gray-50 resize-y"
            placeholder="HTML-Quellcode bearbeiten..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            data-placeholder={placeholder}
            className="rich-editor-content w-full flex-1 min-h-[300px] max-h-[650px] overflow-y-auto p-4 focus:outline-none bg-white prose prose-sm max-w-none text-gray-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          />
        )}
      </div>
    </div>
  );
}
