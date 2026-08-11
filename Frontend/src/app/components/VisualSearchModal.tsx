'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Upload, Search } from 'lucide-react';
import { useLanguage } from '@/providers/languageContext';

interface VisualSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VisualSearchModal({ open, onClose }: VisualSearchModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const STEPS = [
    { title: t('visualSearchModal.step1Title'), desc: t('visualSearchModal.step1Desc') },
    { title: t('visualSearchModal.step2Title'), desc: t('visualSearchModal.step2Desc') },
    { title: t('visualSearchModal.step3Title'), desc: t('visualSearchModal.step3Desc') },
  ];

  // Reset + free the object URL whenever the modal closes
  useEffect(() => {
    if (!open && preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [open, preview]);

  if (!open) return null;

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const handleSearch = () => {
    onClose();
    router.push('/meubels');
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-soft-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          aria-label={t('visualSearchModal.closeAriaLabel')}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary-600 text-white shadow-md">
            <Camera size={22} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('visualSearchModal.title')}</h3>
            <p className="text-xs text-gray-500">{t('visualSearchModal.subtitle')}</p>
          </div>
        </div>

        {/* How it works */}
        <ol className="space-y-3 mb-6">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Upload zone */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 mb-4">
            {/* Local object URL preview — next/image not needed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={t('visualSearchModal.previewAlt')} className="w-full h-48 object-cover" />
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow"
            >
              {t('visualSearchModal.changePhoto')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-2xl p-8 flex flex-col items-center gap-2 text-gray-500 hover:text-primary-600 transition mb-4"
          >
            <Upload size={28} />
            <span className="text-sm font-medium">{t('visualSearchModal.uploadPrompt')}</span>
            <span className="text-xs text-gray-400">{t('visualSearchModal.uploadHint')}</span>
          </button>
        )}

        <button
          onClick={handleSearch}
          disabled={!preview}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <Search size={16} />
          {t('visualSearchModal.searchCta')}
        </button>
      </div>
    </div>
  );
}
