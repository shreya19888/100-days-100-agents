"use client";

import { useState } from "react";
import type { CharmePlan } from "@/types";
import { Button } from "@/components/ui/primitives";
import { OpenAIAttribution } from "@/components/charme/OpenAIInsight";
import { findGlossaryHits } from "@/lib/charme/glossary";

export function SignatureMoment({ plan }: { plan: CharmePlan }) {
  if (!plan.signature) return null;
  const s = plan.signature;
  return (
    <div className="charme-card jaali-border mt-10 rounded-[2rem] p-6 md:p-8">
      <div className="ornament-line mb-5 max-w-[10rem]">
        <span className="ornament-dot" />
      </div>
      <h3 className="font-display text-3xl text-charme-ink md:text-4xl">
        What your skin may need today
      </h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["LOOK", s.look],
          ["NOURISH", s.nourish],
          ["RITUAL", s.ritual],
          ["RECHECK", s.recheck],
        ].map(([label, copy]) => (
          <div key={label} className="rounded-2xl bg-charme-sand/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-clay">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-charme-ink">{copy}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 font-display text-2xl leading-snug text-charme-ink">{s.closing}</p>
      <OpenAIAttribution show={plan.mode === "ai"} />
    </div>
  );
}

export function RitualPlan({
  plan,
  onRecheck,
}: {
  plan: CharmePlan;
  onRecheck: () => void;
}) {
  const [activeDay, setActiveDay] = useState(1);
  const day = plan.ritual.find((d) => d.day === activeDay) || plan.ritual[0];
  const gloss =
    day.gloss ||
    findGlossaryHits(`${day.focus} ${day.ritual} ${day.why}`)
      .slice(0, 3)
      .map((g) => `${g.term}: ${g.meaning}`)
      .join(" · ") ||
    undefined;
  const termHits = findGlossaryHits(`${day.focus} ${day.ritual} ${day.gloss || ""}`);

  return (
    <section className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-clay">
        Ritual, not routine
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-6xl">Your CHARME Ritual</h2>
      <p className="mt-4 max-w-2xl text-base text-charme-muted">
        A routine is something you repeat. A ritual is something you connect with. Each day offers a
        different Ayurveda-inspired kitchen practice — soft homemade pastes (ubtan), masks, mists,
        light oil massage (abhyanga) — always optional, always patch-tested. Unfamiliar words get a
        plain-English note below.
      </p>

      {plan.dailyRhythm ? (
        <div className="charme-card mt-8 rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-3xl text-charme-ink">Your Daily Rhythm</h3>
          <p className="mt-2 text-sm text-charme-muted">
            Dinacharya — Ayurveda&apos;s idea of a kind daily rhythm (not a medical prescription)
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-charme-leaf-soft/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charme-leaf">
                Morning
              </p>
              <ul className="mt-3 space-y-2 text-sm text-charme-ink">
                {plan.dailyRhythm.morning.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-charme-sand/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charme-clay">
                Evening
              </p>
              <ul className="mt-3 space-y-2 text-sm text-charme-ink">
                {plan.dailyRhythm.evening.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-charme-muted">{plan.dailyRhythm.note}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {plan.ritual.map((item) => (
          <button
            key={item.day}
            type="button"
            onClick={() => setActiveDay(item.day)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeDay === item.day
                ? "bg-charme-ink text-charme-cream"
                : "border border-charme-line bg-white/60 text-charme-muted"
            }`}
          >
            Day {item.day}
          </button>
        ))}
      </div>

      <div className="charme-card lens-ritual mt-8 rounded-[2rem] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-highlight">
          Ritual
        </p>
        <h3 className="mt-2 font-display text-3xl text-charme-ink md:text-4xl">{day.focus}</h3>
        {gloss ? (
          <p className="mt-4 rounded-2xl bg-charme-sand/50 px-4 py-3 text-sm leading-relaxed text-charme-ink">
            <span className="font-semibold text-charme-clay">In plain words: </span>
            {gloss}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-charme-muted">
          <span className="font-semibold text-charme-ink">Why CHARME chose it: </span>
          {day.why}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-charme-leaf-soft/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-leaf">Morning</p>
            <ul className="mt-3 space-y-2 text-sm text-charme-ink">
              {day.morning.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-charme-secondary/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-secondary">
              Nourish
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charme-ink">{day.food}</p>
          </div>
          <div className="rounded-2xl bg-charme-highlight/15 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-highlight">
              Ritual
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charme-ink">{day.ritual}</p>
          </div>
          <div className="rounded-2xl bg-charme-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">Evening</p>
            <ul className="mt-3 space-y-2 text-sm text-charme-ink">
              {day.evening.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {termHits.length > 0 ? (
          <div className="mt-6 border-t border-charme-line/60 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">
              Word guide
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {termHits.map((entry) => (
                <div key={entry.term}>
                  <dt className="text-sm font-semibold capitalize text-charme-ink">{entry.term}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-charme-muted">{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      <SignatureMoment plan={plan} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={onRecheck}>Check in again</Button>
      </div>
    </section>
  );
}
