import { clsx, type ClassValue } from "clsx";

/**
 * Conditional class-name join.
 *
 * `clsx` only — `tailwind-merge` is not a dependency here, so a caller that
 * needs to override a base utility should replace the base class rather than
 * relying on conflicting classes resolving in its favour.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
