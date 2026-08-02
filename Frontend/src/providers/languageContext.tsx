"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  Language,
  isLanguage,
} from "@/lib/languageDefaults";
import nlDict from "@/locales/nl.json";
import deDict from "@/locales/de.json";
import enDict from "@/locales/en.json";

const dictionaries: Record<Language, typeof nlDict> = {
  nl: nlDict,
  de: deDict as typeof nlDict,
  en: enDict as typeof nlDict,
};

// Any key still missing from a translation falls back to Dutch rather than
// rendering the raw dot-path to the visitor.
const FALLBACK_LANGUAGE: Language = "nl";

function lookup(language: Language, key: string): unknown {
  const read = (lang: Language) =>
    key.split(".").reduce<any>((obj, part) => obj?.[part], dictionaries[lang]);
  const value = read(language);
  return value === undefined && language !== FALLBACK_LANGUAGE ? read(FALLBACK_LANGUAGE) : value;
}

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tList: <T = any>(key: string) => T[];
};

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  tList: () => [],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const raw = lookup(language, key);
      if (typeof raw !== "string") {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Missing translation key: ${key}`);
        }
        return key;
      }
      if (!params) return raw;
      return Object.entries(params).reduce(
        (str, [paramKey, value]) => str.replaceAll(`{{${paramKey}}}`, String(value)),
        raw
      );
    },
    [language]
  );

  const tList = useCallback(
    <T,>(key: string): T[] => {
      const raw = lookup(language, key);
      if (!Array.isArray(raw)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Missing translation list key: ${key}`);
        }
        return [];
      }
      return raw as T[];
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tList }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
