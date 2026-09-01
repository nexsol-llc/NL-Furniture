"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plus, Scale, X } from "lucide-react";
import PlaceholderImage from "../PlaceholderImage";
import { HomeCard } from "./HomeUi";
import { useCompare, COMPARE_MAX, type CompareItem } from "@/providers/compareContext";
import { formatPrice, normalizeLink } from "@/lib/productFormat";
import { useLanguage } from "@/providers/languageContext";

/**
 * Right-rail comparison tray. Products are added from the product cards' own
 * "Compare" checkbox; the selection lives in CompareProvider (localStorage), so
 * it survives a reload and the header pill shows the same count.
 */
export default function CompareTray() {
  const { t } = useLanguage();
  const { slots, count, remove } = useCompare();
  const [open, setOpen] = useState(false);

  const canCompare = count >= 2;

  return (
    <>
      <HomeCard className="p-4">
        <div id="vergelijken" className="scroll-mt-[calc(var(--header-height)+1rem)]">
          <h2 className="text-[15px] font-bold text-gray-900">{t("homeCompare.compareTray.title")}</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">{t("homeCompare.compareTray.subtitle")}</p>
        </div>

        <div className="mt-3.5 flex items-stretch">
          {slots.map((item, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-center">
              <CompareSlot item={item} onRemove={remove} removeLabel={t("homeCompare.compareTray.remove")} emptyLabel={t("homeCompare.compareTray.emptySlot")} />
              {i < slots.length - 1 && (
                <span className="shrink-0 px-1 text-[9px] font-bold uppercase text-gray-300">
                  {t("homeCompare.compareTray.vs")}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!canCompare}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-cta transition-all hover:from-primary-600 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          <Scale className="h-3.5 w-3.5" />
          {t("homeCompare.compareTray.cta")}
        </button>

        {canCompare ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2.5 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            {t("homeCompare.compareTray.viewList")}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <p className="mt-2.5 text-center text-[10px] leading-snug text-gray-400">
            {t("homeCompare.compareTray.hint", { max: COMPARE_MAX })}
          </p>
        )}
      </HomeCard>

      {open && <CompareModal onClose={() => setOpen(false)} />}
    </>
  );
}

function CompareSlot({
  item,
  onRemove,
  removeLabel,
  emptyLabel,
}: {
  item: CompareItem | null;
  onRemove: (id: string) => void;
  removeLabel: string;
  emptyLabel: string;
}) {
  if (!item) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-300">
          <Plus className="h-4 w-4" />
        </div>
        <span className="w-full truncate text-center text-[9px] text-gray-400">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="group relative flex min-w-0 flex-1 flex-col items-center gap-1">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-200">
        <PlaceholderImage
          src={item.image}
          alt={item.title}
          fill
          className="h-full w-full object-contain p-1"
          iconClassName="w-1/2 h-1/2"
        />
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={removeLabel}
          title={removeLabel}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-white opacity-0 shadow-soft-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="h-2.5 w-2.5" strokeWidth={3} />
        </button>
      </div>
      <span className="w-full truncate text-center text-[9px] font-medium text-gray-600">
        {item.title}
      </span>
      {formatPrice(item.price) && (
        <span className="-mt-0.5 text-[10px] font-bold text-primary-600">
          {formatPrice(item.price)}
        </span>
      )}
    </div>
  );
}

/** Side-by-side table for the selected products. */
function CompareModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { items, remove, clear } = useCompare();

  // Close on Escape, and stop the page behind the dialog from scrolling.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // An empty tray has nothing to show — e.g. the last row was removed in place.
  useEffect(() => {
    if (items.length === 0) onClose();
  }, [items.length, onClose]);

  const rows: { label: string; render: (item: CompareItem) => React.ReactNode }[] = [
    {
      label: t("homeCompare.compareCta.priceTitle"),
      render: (item) => (
        <span className="text-sm font-bold text-primary-600">{formatPrice(item.price) || "—"}</span>
      ),
    },
    {
      label: t("homeCompare.compareTray.oldPriceLabel"),
      render: (item) =>
        formatPrice(item.oldPrice) ? (
          <span className="text-xs text-gray-400 line-through">{formatPrice(item.oldPrice)}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      label: t("homeCompare.compareTray.brandLabel"),
      render: (item) => <span className="text-xs text-gray-600">{item.brand || "—"}</span>,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("homeCompare.compareTray.title")}
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-depth-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {t("homeCompare.compareTray.title")}
          </h2>
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-[11px] font-semibold text-gray-400 transition-colors hover:text-primary-600"
          >
            {t("homeCompare.compareTray.clear")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className="w-24" />
                {items.map((item) => (
                  <th key={item.id} className="p-2 align-top">
                    <div className="relative mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
                      <PlaceholderImage
                        src={item.image}
                        alt={item.title}
                        fill
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-center text-xs font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="mx-auto mt-1 block text-[10px] font-medium text-gray-400 transition-colors hover:text-primary-600"
                    >
                      {t("homeCompare.compareTray.remove")}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <th className="py-3 pr-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {row.label}
                  </th>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-center align-middle">
                      {row.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-gray-100">
                <th className="py-3 pr-3" />
                {items.map((item) => (
                  <td key={item.id} className="p-3 text-center">
                    {normalizeLink(item.link) !== "#" && (
                      <a
                        href={normalizeLink(item.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-primary-700"
                      >
                        {t("homeCompare.compareTray.toShop")}
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
