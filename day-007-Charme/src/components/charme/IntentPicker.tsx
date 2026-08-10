"use client";

import {
  CHARME_INTENTS,
  PERSONAL_GOAL_PRESETS,
  type CharmeIntent,
} from "@/lib/charme/intents";
import { Button } from "@/components/ui/primitives";

export function IntentPicker({
  intents,
  personalGoals,
  onToggleIntent,
  onTogglePersonalGoal,
  onContinue,
}: {
  intents: CharmeIntent[];
  personalGoals: string[];
  onToggleIntent: (intent: CharmeIntent) => void;
  onTogglePersonalGoal: (goal: string) => void;
  onContinue: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-primary">
        CHARME doesn&apos;t judge your skin
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-5xl">
        What would you like CHARME to help with?
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-charme-muted">
        Choose one or more. Understanding what is visible is different from deciding what—if
        anything—you want to change.
      </p>

      <div className="mt-8 space-y-3">
        {CHARME_INTENTS.map((item) => {
          const active = intents.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleIntent(item.id)}
              aria-pressed={active}
              className={`w-full rounded-[1.5rem] border px-5 py-4 text-left transition ${
                active
                  ? "border-charme-primary bg-charme-primary/[0.06] shadow-sm"
                  : "border-charme-line bg-white/60 hover:border-charme-primary/30"
              }`}
            >
              <p className="font-display text-xl text-charme-ink">
                <span className="mr-2" aria-hidden>
                  {item.emoji}
                </span>
                {item.title}
                {active ? (
                  <span className="ml-2 text-xs font-sans font-semibold uppercase tracking-[0.14em] text-charme-primary">
                    Selected
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-charme-muted">{item.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <h3 className="font-display text-2xl text-charme-ink">Personal goals (optional)</h3>
        <p className="mt-2 text-sm text-charme-muted">
          Multi-select is fine — this helps CHARME know which suggestions are welcome.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERSONAL_GOAL_PRESETS.map((g) => {
            const active = personalGoals.includes(g.label);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onTogglePersonalGoal(g.label)}
                aria-pressed={active}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-charme-ink text-charme-cream"
                    : "border border-charme-line bg-white/60 text-charme-muted hover:text-charme-ink"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={onContinue} disabled={intents.length === 0}>
          Continue
        </Button>
      </div>
    </section>
  );
}
