"use client";

import type { CharmeIntent, CharmePlan } from "@/types";
import { FOOD_EMOJI } from "@/data/food/ingredients";
import { Button } from "@/components/ui/primitives";
import { OpenAIInsight, OpenAIAttribution } from "@/components/charme/OpenAIInsight";
import { areasHeading } from "@/lib/charme/intents";

function VerdictBadge({ verdict }: { verdict: "KEEP" | "MODIFY" | "PAUSE" }) {
  const map = {
    KEEP: { label: "KEEP", className: "bg-charme-success/15 text-charme-success", icon: "🟢" },
    MODIFY: { label: "MODIFY", className: "bg-charme-warning/15 text-charme-warning", icon: "🟡" },
    PAUSE: { label: "PAUSE", className: "bg-charme-caution/15 text-charme-caution", icon: "🔴" },
  } as const;
  const item = map[verdict];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${item.className}`}>
      {item.icon} {item.label}
    </span>
  );
}

export function CharmeInsight({
  plan,
  intent,
  onContinue,
}: {
  plan: CharmePlan;
  intent?: CharmeIntent | null;
  onContinue: () => void;
}) {
  const fromOpenAI = plan.mode === "ai";
  const justLearn = intent === "just_learn";

  return (
    <section className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-accent">
        CHARME Guidance
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-text md:text-6xl">
        {justLearn ? "What CHARME noticed" : "Let's connect the dots."}
      </h2>
      <p className="mt-4 max-w-2xl text-base text-charme-muted">
        {justLearn
          ? "Neutral observations based on your snapshot and what you chose to explore — not a list of things to fix."
          : "YouCam provides the skin snapshot. CHARME reasons across your goal, kitchen, and home wisdom — recommending only what your intent invites."}
      </p>

      <div className="mt-8">
        <OpenAIInsight
          title="CHARME Insight"
          text={plan.overallExplanation}
          poweredBy={fromOpenAI ? "OpenAI" : false}
        />
        {!fromOpenAI ? (
          <p className="mt-2 text-xs text-charme-muted">
            {"Personalized interpretation is using CHARME's built-in guidance right now. Add an OpenAI key for richer AI reasoning."}
          </p>
        ) : null}
      </div>

      {plan.traditionalLens ? (
        <div className="charme-card lens-traditional mt-8 rounded-[2rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-accent">
            Traditional Ayurveda Lens
          </p>
          <p className="mt-3 text-sm leading-relaxed text-charme-text">{plan.traditionalLens.summary}</p>
          <p className="mt-3 text-sm text-charme-muted">{plan.traditionalLens.suggestion}</p>
          <p className="mt-4 text-xs text-charme-muted">{plan.traditionalLens.disclaimer}</p>
        </div>
      ) : null}

      <div className="mt-10 space-y-5">
        <h3 className="font-display text-3xl text-charme-text">{areasHeading(intent)}</h3>
        {plan.priorities.map((item, index) => (
          <article key={item.priority} className="charme-card rounded-[1.75rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-muted">
              {String(index + 1).padStart(2, "0")} — {item.priority}
            </p>
            <p className="mt-3 text-base leading-relaxed text-charme-text/90">{item.explanation}</p>
            {item.caution ? <p className="mt-4 text-sm text-charme-caution">{item.caution}</p> : null}
            <OpenAIAttribution show={fromOpenAI} />
          </article>
        ))}
      </div>

      <div className="charme-card lens-nourish relative mt-10 overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 peacock-pattern opacity-70" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-secondary">
            Nourish
          </p>
          <h3 className="mt-2 font-display text-3xl text-charme-text">{"Today's Nourish"}</h3>
          <p className="mt-1 text-sm text-charme-muted">
            Ahara — food as wellness: foods that can contribute to overall health and nutrition
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {plan.kitchen.todayFoods.map((food) => (
              <span
                key={food}
                className="rounded-2xl bg-charme-leaf-soft/70 px-4 py-2 text-sm capitalize text-charme-text"
              >
                {FOOD_EMOJI[food] || "✨"} {food}
              </span>
            ))}
          </div>
          {plan.kitchen.meals ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Breakfast", plan.kitchen.meals.breakfast],
                ["Lunch", plan.kitchen.meals.lunch],
                ["Snack", plan.kitchen.meals.snack],
                ["Dinner", plan.kitchen.meals.dinner],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-charme-sandalwood/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charme-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-sm text-charme-text">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mt-5 text-sm leading-relaxed text-charme-muted">{plan.kitchen.explanation}</p>
          <p className="mt-3 text-sm text-charme-muted">{plan.kitchen.note}</p>
          <OpenAIAttribution show={fromOpenAI} />
        </div>
      </div>

      {plan.remedy ? (
        <div className="charme-card mt-8 rounded-[2rem] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-secondary">
            Home Wisdom · Ghar ka nuskha (family remedy)
          </p>
          <h3 className="mt-2 font-display text-3xl text-charme-text">
            {"Let's look at the ritual through two lenses."}
          </h3>
          <p className="mt-3 font-display text-2xl text-charme-text/90">&ldquo;{plan.remedy.remedy}&rdquo;</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-charme-leaf-soft/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charme-secondary">
                Traditional wisdom
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charme-text">{plan.remedy.traditionalUse}</p>
            </div>
            <div className="rounded-2xl bg-charme-sandalwood/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charme-primary">
                Modern perspective
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charme-text">{plan.remedy.whatWeKnow}</p>
            </div>
          </div>
          {plan.remedy.skinContext ? (
            <p className="mt-4 rounded-2xl bg-charme-warning/10 px-4 py-3 text-sm text-charme-text">
              {plan.remedy.skinContext}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-charme-muted">{plan.remedy.potentialConsideration}</p>
          <div className="mt-6 rounded-2xl bg-charme-ivory p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">
                CHARME verdict · Keep the wisdom
              </p>
              <VerdictBadge verdict={plan.remedy.verdict} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-charme-text">{plan.remedy.charmeTake}</p>
            <OpenAIAttribution show={fromOpenAI} />
          </div>
        </div>
      ) : null}

      {plan.seasonNote ? (
        <p className="mt-6 text-sm text-charme-muted">
          <span className="font-semibold text-charme-text">Season: </span>
          {plan.seasonNote}
        </p>
      ) : null}

      <div className="mt-10 flex justify-end">
        <Button onClick={onContinue}>See your ritual</Button>
      </div>
    </section>
  );
}
