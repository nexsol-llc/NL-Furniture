"use client";

import React from "react";
import { ThemeProvider } from "@/providers/themeContext";
import { LanguageProvider } from "@/providers/languageContext";

// Monkeypatch to prevent React crashes when Google Translate or other extensions mutate the DOM
if (typeof window !== "undefined") {
  if (typeof Node === "function" && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (typeof console !== "undefined") {
          console.warn(
            "Google Translate attempted to remove a child node from the wrong parent. Skipping.",
            child,
            this
          );
        }
        return child;
      }
      return originalRemoveChild.apply(this, arguments as any) as T;
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (typeof console !== "undefined") {
          console.warn(
            "Google Translate attempted to insert before a reference node from a different parent. Skipping.",
            referenceNode,
            this
          );
        }
        return newNode;
      }
      return originalInsertBefore.apply(this, arguments as any) as T;
    };

    const originalReplaceChild = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
      if (oldChild.parentNode !== this) {
        if (typeof console !== "undefined") {
          console.warn(
            "Google Translate attempted to replace a child node from the wrong parent. Skipping.",
            oldChild,
            this
          );
        }
        return oldChild;
      }
      return originalReplaceChild.apply(this, arguments as any) as T;
    };
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // ThemeProvider loads the admin-configured theme color (localStorage first,
  // then /api/site-settings) so the public site uses the same primary-* colors
  // as the admin panel.
  return (
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );
}
