"use client";

import { FAMILY_TEACHERS, WISDOM_CHIPS } from "@/lib/charme/knowledge";

export function FamilyWisdomInput({
  value,
  selectedChips,
  taughtBy,
  whenUsed,
  meaning,
  onChange,
  onToggleChip,
  onTaughtBy,
  onWhenUsed,
  onMeaning,
}: {
  value: string;
  selectedChips: string[];
  taughtBy: string;
  whenUsed: string;
  meaning: string;
  onChange: (value: string) => void;
  onToggleChip: (chip: string) => void;
  onTaughtBy: (value: string) => void;
  onWhenUsed: (value: string) => void;
  onMeaning: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="charme-card jaali-border rounded-[2rem] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-clay">
          Home wisdom · Ghar ka nuskha (family remedy)
        </p>
        <h3 className="mt-2 font-display text-3xl text-charme-ink md:text-4xl">
          What did home teach you?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-charme-muted md:text-base">
          A home remedy passed down through generations. Your family&apos;s wisdom isn&apos;t
          automatically wrong — let&apos;s understand it.
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder='e.g. "My mother used to make besan (chickpea flour), yogurt and turmeric before special occasions."'
          className="mt-6 w-full rounded-2xl border border-charme-line bg-white/70 px-4 py-3 text-sm text-charme-ink outline-none ring-charme-saffron/30 placeholder:text-charme-muted/70 focus:ring-2"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {WISDOM_CHIPS.map((chip) => {
            const active = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onToggleChip(chip)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-charme-ink text-charme-cream"
                    : "border border-charme-line bg-white/60 text-charme-muted hover:text-charme-ink"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      <div className="charme-card rounded-[2rem] p-6 md:p-8">
        <h3 className="font-display text-3xl text-charme-ink">Passed down to you</h3>
        <p className="mt-2 text-sm text-charme-muted">Optional — makes the ritual feel personal.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-charme-muted">
              Who taught you?
            </p>
            <div className="flex flex-wrap gap-2">
              {FAMILY_TEACHERS.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => onTaughtBy(person)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    taughtBy === person
                      ? "bg-charme-mehndi text-charme-cream"
                      : "border border-charme-line bg-white/60"
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-charme-muted">
              When did your family use it?
            </p>
            <input
              value={whenUsed}
              onChange={(e) => onWhenUsed(e.target.value)}
              placeholder="Festivals, summers, dull skin days…"
              className="w-full rounded-full border border-charme-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-charme-saffron/30"
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-charme-muted">
            What does it mean to you?
          </p>
          <input
            value={meaning}
            onChange={(e) => onMeaning(e.target.value)}
            placeholder="Care, preparation, comfort…"
            className="w-full rounded-full border border-charme-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-charme-saffron/30"
          />
        </div>
      </div>
    </div>
  );
}
