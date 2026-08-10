"use client";

import type { SkinAnalysis } from "@/types";
import { EXPLORE_TOPICS, type ExploreTopic } from "@/lib/charme/intents";
import {
  concernsForDisplay,
  pigmentAcknowledgment,
  shouldHonorPigmentMap,
} from "@/lib/charme/skin-dignity";
import { Button } from "@/components/ui/primitives";

export function JustLearn({
  analysis,
  skinNotes,
  exploreTopics,
  onToggleTopic,
  onContinueOptional,
  onDone,
}: {
  analysis: SkinAnalysis;
  skinNotes?: string;
  exploreTopics: ExploreTopic[];
  onToggleTopic: (topic: ExploreTopic) => void;
  onContinueOptional: () => void;
  onDone: () => void;
}) {
  const honorPigment = shouldHonorPigmentMap(skinNotes);
  const pigmentNote = pigmentAcknowledgment(analysis.concerns, skinNotes);
  const noticed = concernsForDisplay(analysis.concerns, skinNotes)
    .sort((a, b) => a.uiScore - b.uiScore)
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-primary">
        Just learn
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-5xl">
        What CHARME noticed
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-charme-muted">
        Your skin snapshot shows several visible characteristics. None of these need to be changed
        unless they&apos;re something you personally want to explore.
      </p>

      {honorPigment && pigmentNote ? (
        <div className="charme-card mt-8 rounded-[2rem] border border-charme-primary/20 bg-charme-primary/[0.04] p-6">
          <p className="text-sm leading-relaxed text-charme-text">{pigmentNote}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {noticed.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl border border-charme-line bg-white/60 px-4 py-4"
          >
            <p className="text-sm font-medium text-charme-ink">{c.label}</p>
            <p className="mt-1 font-display text-3xl text-charme-ink">{c.uiScore}</p>
            <p className="mt-1 text-xs text-charme-muted">Cosmetic measurement · not a judgment</p>
          </div>
        ))}
      </div>

      <div className="charme-card mt-10 rounded-[2rem] p-6 md:p-8">
        <h3 className="font-display text-3xl text-charme-ink">Want to explore anything?</h3>
        <p className="mt-2 text-sm text-charme-muted">
          Optional. Only tap what you&apos;re curious about — CHARME won&apos;t invent a to-do list
          for everything else.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {EXPLORE_TOPICS.map((topic) => {
            const active = exploreTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onToggleTopic(topic.id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-charme-ink text-charme-cream"
                    : "border border-charme-line bg-white/60 text-charme-muted hover:text-charme-ink"
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          That&apos;s enough for now
        </Button>
        {exploreTopics.length > 0 ? (
          <Button onClick={onContinueOptional}>Explore selected topics</Button>
        ) : (
          <Button onClick={onContinueOptional}>Browse kitchen & rituals (optional)</Button>
        )}
      </div>
    </section>
  );
}
