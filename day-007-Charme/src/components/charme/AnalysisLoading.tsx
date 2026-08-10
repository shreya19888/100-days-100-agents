"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Looking at your photo",
  "Adjusting framing for a clearer reading",
  "Analyzing visible skin characteristics",
  "Building your skin profile",
  "Preparing your personalized guidance",
];

export function AnalysisLoading({ label = "Working quietly" }: { label?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStage((current) => (current + 1) % STAGES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center animate-fade-up">
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-charme-leaf/30 animate-pulse-ring" />
        <span
          className="absolute inset-3 rounded-full border border-charme-clay/25 animate-pulse-ring"
          style={{ animationDelay: "0.7s" }}
        />
        <span className="h-16 w-16 rounded-full bg-gradient-to-br from-charme-saffron/40 via-charme-sand to-charme-leaf-soft" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-muted">{label}</p>
      <h3 className="mt-4 font-display text-3xl text-charme-ink md:text-4xl">{STAGES[stage]}</h3>
      <p className="mt-4 text-sm text-charme-muted">
        No fake percentages — just a careful look at visible characteristics.
      </p>
    </div>
  );
}
