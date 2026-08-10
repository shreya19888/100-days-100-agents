"use client";

import type { SkinAnalysis, TraditionalLensAnswers } from "@/types";
import { Button } from "@/components/ui/primitives";

const QUESTIONS: Array<{
  key: keyof TraditionalLensAnswers;
  label: string;
  options: Array<{ value: TraditionalLensAnswers[keyof TraditionalLensAnswers]; label: string }>;
}> = [
  {
    key: "heatSensitivity",
    label: "How does your skin respond to heat or spice-heavy days?",
    options: [
      { value: "low", label: "Usually fine" },
      { value: "medium", label: "Sometimes reactive" },
      { value: "high", label: "Often feels heated" },
    ],
  },
  {
    key: "digestionFeel",
    label: "How do meals usually sit with you?",
    options: [
      { value: "light", label: "Light / quick" },
      { value: "variable", label: "Variable" },
      { value: "heavy", label: "Heavy / slow" },
    ],
  },
  {
    key: "energyPattern",
    label: "Your everyday energy feels mostly…",
    options: [
      { value: "scattered", label: "Scattered" },
      { value: "intense", label: "Intense" },
      { value: "steady", label: "Steady" },
    ],
  },
  {
    key: "climateComfort",
    label: "You feel most comfortable in…",
    options: [
      { value: "cool", label: "Cooler spaces" },
      { value: "neutral", label: "Neutral weather" },
      { value: "warm", label: "Warmer spaces" },
    ],
  },
  {
    key: "sleepQuality",
    label: "Sleep tends to be…",
    options: [
      { value: "light", label: "Light" },
      { value: "mixed", label: "Mixed" },
      { value: "deep", label: "Deep" },
    ],
  },
];

export function TwoLenses({
  analysis,
  answers,
  onChange,
  onContinue,
  onSkip,
}: {
  analysis: SkinAnalysis;
  answers: TraditionalLensAnswers;
  onChange: (next: TraditionalLensAnswers) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const snapshot = analysis.priorities.slice(0, 4);

  return (
    <section className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-clay">
        Two ways of understanding
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-5xl">
        Two ways of understanding your skin
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charme-muted md:text-base">
        CHARME holds modern visual observation and traditional wellness frameworks side by side —
        never as the same thing.
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className="charme-card lens-modern rounded-[1.75rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-primary">
            Modern Lens
          </p>
          <h3 className="mt-2 font-display text-2xl text-charme-ink">Skin Snapshot</h3>
          <p className="mt-2 text-sm text-charme-muted">
            Visible characteristics from YouCam — observations, not a problem list.
          </p>
          <div className="mt-5 space-y-3">
            {snapshot.map((c) => (
              <div key={c.key} className="flex items-center justify-between border-b border-charme-line/60 pb-2">
                <span className="text-sm text-charme-ink">{c.label}</span>
                <span className="font-display text-2xl text-charme-ink">{c.uiScore}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-charme-muted">{analysis.disclaimer}</p>
        </article>

        <article className="charme-card lens-traditional rounded-[1.75rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-accent">
            Traditional Lens
          </p>
          <h3 className="mt-2 font-display text-2xl text-charme-ink">Ayurveda-inspired questions</h3>
          <p className="mt-2 text-sm text-charme-muted">
            Optional. About routine, food, environment, and rest — not a diagnosis.
          </p>
          <div className="mt-5 space-y-4">
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-sm text-charme-ink">{q.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const active = answers[q.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange({ ...answers, [q.key]: opt.value })}
                        className={`rounded-full px-3 py-1.5 text-xs transition ${
                          active
                            ? "bg-charme-mehndi text-charme-cream"
                            : "border border-charme-line bg-white/60 text-charme-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-charme-muted">
            Ayurvedic concepts shown here are traditional wellness frameworks and are not medical
            diagnoses.
          </p>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onContinue}>Continue with both lenses</Button>
        <Button variant="secondary" onClick={onSkip}>
          Continue with modern lens only
        </Button>
      </div>
    </section>
  );
}
