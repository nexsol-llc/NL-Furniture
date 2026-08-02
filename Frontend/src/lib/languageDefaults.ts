export type Language = "nl" | "de" | "en";

export const LANGUAGE_STORAGE_KEY = "nl-furniture-language";

export const DEFAULT_LANGUAGE: Language = "nl";

export const SUPPORTED_LANGUAGES: Language[] = ["nl", "en", "de"];

/** BCP 47 tag per language, for date and number formatting. */
export const LOCALE_TAG: Record<Language, string> = {
  nl: "nl-NL",
  de: "de-DE",
  en: "en-US",
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as string[]).includes(value);
}
