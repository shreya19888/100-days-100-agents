"use client";

import type { SkinAnalysis } from "@/types";
import { SkinConcernCard } from "./SkinConcernCard";
import { Button } from "@/components/ui/primitives";
import {
  concernsForDisplay,
  isIdentityConcern,
  pigmentAcknowledgment,
  shouldHonorPigmentMap,
} from "@/lib/charme/skin-dignity";

export function SkinStory({
  analysis,
  skinNotes,
  onSkinNotes,
  onContinue,
}: {
  analysis: SkinAnalysis;
  skinNotes?: string;
  onSkinNotes?: (value: string) => void;
  onContinue: () => void;
}) {
  const honorPigment = shouldHonorPigmentMap(skinNotes);
  const pigmentNote = pigmentAcknowledgment(analysis.concerns, skinNotes);
  const visibleConcerns = concernsForDisplay(analysis.concerns, skinNotes);

  return (
    <section className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-clay">
        Your Skin Snapshot
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-6xl">
        What CHARME noticed
      </h2>
      <p className="mt-4 max-w-2xl text-base text-charme-muted">
        Cosmetic measurements from YouCam — visible characteristics, not a medical diagnosis, and
        not a judgment. Understanding what is visible is different from deciding what to change.
      </p>

      {honorPigment && pigmentNote ? (
        <div className="charme-card mt-8 rounded-[2rem] border border-charme-primary/20 bg-charme-primary/[0.04] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-primary">
            Seen with care
          </p>
          <p className="mt-3 text-base leading-relaxed text-charme-text md:text-lg">
            {pigmentNote}
          </p>
        </div>
      ) : null}

      <div className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charme-muted">
          Areas you may want to explore
        </h3>
        <p className="mt-2 text-sm text-charme-muted">
          Observations only — CHARME will ask what you want before suggesting change.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {analysis.priorities
            .filter((c) => !isIdentityConcern(c.key) || honorPigment)
            .map((concern, index) => (
            <SkinConcernCard
              key={concern.key}
              concern={concern}
              index={index}
              honorPigment={honorPigment}
            />
          ))}
        </div>
      </div>

      <div className="charme-card jaali-border mt-10 rounded-[2rem] p-6 md:p-8">
        <h3 className="font-display text-3xl text-charme-ink">The big picture</h3>
        <p className="mt-4 text-base leading-relaxed text-charme-muted md:text-lg">
          {analysis.storySummary}
        </p>
        <p className="mt-5 text-sm text-charme-muted">{analysis.disclaimer}</p>
      </div>

      {onSkinNotes ? (
        <div className="charme-card mt-10 rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-3xl text-charme-ink">Anything we should know?</h3>
          <p className="mt-2 text-sm text-charme-muted">
            Optional. If you live with a named skin condition, you can share it here. We only
            mention it when you do — never from the photo alone.
          </p>
          <textarea
            value={skinNotes || ""}
            onChange={(e) => onSkinNotes(e.target.value)}
            rows={3}
            placeholder={'e.g. "I have a birthmark I\'m not trying to change."'}
            className="mt-5 w-full rounded-2xl border border-charme-line bg-white/70 px-4 py-3 text-sm text-charme-ink outline-none ring-charme-primary/25 placeholder:text-charme-muted/70 focus:ring-2"
          />
        </div>
      ) : null}

      <div className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-charme-muted">
          Full Skin Snapshot
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleConcerns.map((concern) => {
            const honored = honorPigment && isIdentityConcern(concern.key);
            return (
              <div
                key={concern.key}
                className="flex items-center justify-between rounded-2xl border border-charme-line bg-white/50 px-4 py-3"
              >
                <span className="text-sm text-charme-ink">
                  {concern.label}
                  {honored ? (
                    <span className="mt-0.5 block text-[11px] text-charme-primary">
                      Honored · not a change target
                    </span>
                  ) : null}
                </span>
                <span className="font-display text-2xl text-charme-ink">
                  {honored ? "—" : concern.uiScore}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={onContinue}>Choose what you&apos;d like help with</Button>
      </div>
    </section>
  );
}
