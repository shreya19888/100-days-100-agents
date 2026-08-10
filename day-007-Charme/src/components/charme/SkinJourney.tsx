"use client";

import type { SkinAnalysis } from "@/types";
import { JOURNEY_CAUTION } from "@/lib/charme/safety";
import { Button } from "@/components/ui/primitives";

export function SkinJourney({
  previous,
  current,
  observation,
  onContinue,
}: {
  previous: SkinAnalysis;
  current: SkinAnalysis;
  observation: string;
  onContinue: () => void;
}) {
  const keys = ["hydration", "redness", "radiance"] as const;
  const rows = keys
    .map((key) => {
      const from = previous.concerns.find((c) => c.key === key);
      const to = current.concerns.find((c) => c.key === key);
      if (!from || !to) return null;
      return { label: from.label, from: from.uiScore, to: to.uiScore };
    })
    .filter(Boolean) as Array<{ label: string; from: number; to: number }>;

  return (
    <section className="mx-auto max-w-3xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-leaf">
        Longitudinal check-in
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-5xl">Your Skin Journey</h2>

      <div className="charme-card mt-8 space-y-4 rounded-[2rem] p-6 md:p-8">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-charme-line/70 pb-4 last:border-0"
          >
            <span className="text-sm text-charme-ink">{row.label}</span>
            <span className="font-display text-3xl text-charme-ink">
              {row.from} → {row.to}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-charme-muted">{JOURNEY_CAUTION}</p>

      <div className="mt-6 rounded-2xl bg-charme-leaf-soft/50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-leaf">
          CHARME noticed
        </p>
        <p className="mt-2 text-sm leading-relaxed text-charme-ink">{observation}</p>
      </div>

      <div className="mt-8">
        <Button onClick={onContinue}>Adapt my plan</Button>
      </div>
    </section>
  );
}
