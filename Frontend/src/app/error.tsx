'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Errors caused by Google Translate / browser translation DOM mutations
// These are hydration mismatches — not real app errors. We silently recover.
const TRANSLATION_ERROR_PATTERNS = [
  'NotFoundError: Failed to execute \'removeChild\'',
  'NotFoundError: The node to be removed is not a child',
  'Minified React error #418',
  'Minified React error #423',
  'Minified React error #425',
  'hydration',
  'Hydration',
  'removeChild',
  'insertBefore',
];

function isTranslationError(error: Error): boolean {
  const msg = error?.message || '';
  const stack = error?.stack || '';
  return TRANSLATION_ERROR_PATTERNS.some(
    (pattern) => msg.includes(pattern) || stack.includes(pattern)
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Silently recover from translation-caused hydration errors
    if (isTranslationError(error)) {
      reset();
      return;
    }
    // Log real errors
    console.error('[App Error]', error);
  }, [error, reset]);

  // Don't render anything for translation errors — reset() handles it
  if (isTranslationError(error)) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
