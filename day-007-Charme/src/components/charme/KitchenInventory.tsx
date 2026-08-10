"use client";

import { useState } from "react";
import { FOOD_CATEGORIES, FOOD_EMOJI } from "@/data/food/ingredients";
import type { Season } from "@/types";
import { kitchenDisplayLabel } from "@/lib/charme/glossary";

const SEASONS: Array<{ id: Season; label: string }> = [
  { id: "summer", label: "Summer" },
  { id: "monsoon", label: "Monsoon" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
  { id: "spring", label: "Spring" },
];

export function KitchenInventoryPicker({
  selected,
  custom,
  season,
  onToggle,
  onAddCustom,
  onRemoveCustom,
  onSeason,
}: {
  selected: string[];
  custom: string[];
  season?: Season;
  onToggle: (ingredient: string) => void;
  onAddCustom: (ingredient: string) => void;
  onRemoveCustom: (ingredient: string) => void;
  onSeason: (season: Season) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-6">
      <div className="charme-card lens-nourish jaali-border rounded-[2rem] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-secondary">
          Nourish · Ahara (food as wellness)
        </p>
        <h3 className="mt-2 font-display text-3xl text-charme-ink md:text-4xl">
          Your kitchen is part of your ritual.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-charme-muted md:text-base">
          What do you already have? CHARME works with Indian staples and everyday ingredients — names
          include a plain-English hint when helpful.
        </p>

        <div className="mt-8 space-y-6">
          {FOOD_CATEGORIES.map((category) => (
            <div key={category.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">
                {category.title}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {category.items.map((item) => {
                  const active = selected.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onToggle(item)}
                      className={`rounded-2xl px-3 py-3 text-left text-sm capitalize transition ${
                        active
                          ? "bg-charme-mehndi text-white"
                          : "border border-charme-line bg-white/60 text-charme-ink hover:bg-charme-leaf-soft/40"
                      }`}
                    >
                      <span className="mr-2">{FOOD_EMOJI[item] || "•"}</span>
                      {kitchenDisplayLabel(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a custom ingredient"
            className="min-w-[220px] flex-1 rounded-full border border-charme-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-charme-saffron/30"
          />
          <button
            type="button"
            className="rounded-full bg-charme-ink px-5 py-2.5 text-sm font-semibold text-charme-cream"
            onClick={() => {
              const value = draft.trim().toLowerCase();
              if (!value) return;
              onAddCustom(value);
              setDraft("");
            }}
          >
            Add
          </button>
        </div>
        {custom.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {custom.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onRemoveCustom(item)}
                className="rounded-full bg-charme-sand px-3 py-1.5 text-xs capitalize text-charme-ink"
              >
                {item} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="charme-card rounded-[2rem] p-6 md:p-8">
        <h3 className="font-display text-2xl text-charme-ink">Season</h3>
        <p className="mt-2 text-sm text-charme-muted">
          Subtle seasonal wellness — general guidance, not medical claims.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSeason(s.id)}
              className={`rounded-full px-4 py-2 text-sm ${
                season === s.id
                  ? "bg-charme-clay text-white"
                  : "border border-charme-line bg-white/60 text-charme-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
