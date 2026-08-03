"use client";

import { Home, Umbrella } from "lucide-react";

export type IndoorOutdoorValue = "indoor" | "outdoor";

type IndoorOutdoorToggleProps = {
  value: IndoorOutdoorValue;
  onChange: (value: IndoorOutdoorValue) => void;
  indoorLabel: string;
  outdoorLabel: string;
  indoorDisabled?: boolean;
  outdoorDisabled?: boolean;
  className?: string;
};

// Pill switcher between the indoor and outdoor category sets. The active half
// carries the themeable primary gradient (never a hardcoded hue — admins pick
// the palette in admin/theme), the inactive half stays quiet grey.
export default function IndoorOutdoorToggle({
  value,
  onChange,
  indoorLabel,
  outdoorLabel,
  indoorDisabled = false,
  outdoorDisabled = false,
  className = "",
}: IndoorOutdoorToggleProps) {
  const tabs = [
    { key: "indoor" as const, label: indoorLabel, Icon: Home, disabled: indoorDisabled },
    { key: "outdoor" as const, label: outdoorLabel, Icon: Umbrella, disabled: outdoorDisabled },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-soft ring-1 ring-gray-100 ${className}`}
    >
      {tabs.map(({ key, label, Icon, disabled }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            disabled={disabled}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40
              ${
                active
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-cta"
                  : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
