'use client';

import { useEffect } from 'react';

// Errors caused by Google Translate / browser translation DOM mutations
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Silently recover from translation-caused hydration errors
    if (error && isTranslationError(error)) {
      reset();
      return;
    }
    // Log real errors
    console.error('[Global App Error]', error);
  }, [error, reset]);

  // Don't render error UI for translation errors — reset() handles it
  if (error && isTranslationError(error)) {
    return (
      <html lang="nl" suppressHydrationWarning>
        <body suppressHydrationWarning></body>
      </html>
    );
  }

  return (
    <html lang="nl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: '#FFF0EB' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: 'var(--primary-600, #E8431A)' }}
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
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: '#111' }}
            >
              Seite konnte nicht geladen werden
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-xl text-sm transition-colors"
              style={{ background: 'var(--primary-600, #E8431A)' }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
