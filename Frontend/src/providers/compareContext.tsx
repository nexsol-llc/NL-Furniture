"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** How many products can sit in the comparison tray at once. */
export const COMPARE_MAX = 4;

const STORAGE_KEY = "nl-furniture:compare";

export interface CompareItem {
  /** Stable identity — a catalog `_id` when we have one, otherwise the link/title. */
  id: string;
  title: string;
  image?: string;
  price?: string;
  oldPrice?: string;
  brand?: string;
  /** Merchant/affiliate target, so the tray can still send a visitor to the shop. */
  link?: string;
}

interface CompareContextValue {
  items: CompareItem[];
  /** Slots including the empty ones — the tray renders a fixed row of {{COMPARE_MAX}}. */
  slots: (CompareItem | null)[];
  count: number;
  isFull: boolean;
  has: (id: string) => boolean;
  add: (item: CompareItem) => boolean;
  remove: (id: string) => void;
  /** Adds when absent, removes when present. Returns the resulting membership. */
  toggle: (item: CompareItem) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue>({
  items: [],
  slots: Array(COMPARE_MAX).fill(null),
  count: 0,
  isFull: false,
  has: () => false,
  add: () => false,
  remove: () => {},
  toggle: () => false,
  clear: () => {},
});

function readStored(): CompareItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry: any) => entry && typeof entry.id === "string" && typeof entry.title === "string")
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  // Starts empty on both server and first client render so the markup matches;
  // the stored selection is merged in after mount.
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const stored = readStored();
    if (stored.length) setItems(stored);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode / quota — the tray still works for this page view */
    }
  }, [items]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const add = useCallback((item: CompareItem) => {
    let accepted = false;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      if (prev.length >= COMPARE_MAX) return prev;
      accepted = true;
      return [...prev, item];
    });
    return accepted;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggle = useCallback((item: CompareItem) => {
    let selected = false;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= COMPARE_MAX) {
        selected = true; // tray is full — leave the existing selection untouched
        return prev;
      }
      selected = true;
      return [...prev, item];
    });
    return selected;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareContextValue>(() => {
    const slots: (CompareItem | null)[] = Array.from(
      { length: COMPARE_MAX },
      (_, i) => items[i] ?? null
    );
    return {
      items,
      slots,
      count: items.length,
      isFull: items.length >= COMPARE_MAX,
      has,
      add,
      remove,
      toggle,
      clear,
    };
  }, [items, has, add, remove, toggle, clear]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  return useContext(CompareContext);
}
