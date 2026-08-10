import type { SkinAnalysis, SkinConcern } from "@/types";
import { isIdentityConcern, shouldHonorPigmentMap } from "./skin-dignity";

export type SnapshotDigest = {
  analysisId: string;
  lowest: SkinConcern[];
  highest: SkinConcern[];
  /** One factual sentence unique to this scan's numbers */
  factualLead: string;
  /** Compact score table for the model */
  scoreTable: string;
};

/** Build a deterministic, score-grounded digest so insights differ per photo. */
export function buildSnapshotDigest(
  analysis: SkinAnalysis,
  skinNotes?: string,
): SnapshotDigest {
  const honor = shouldHonorPigmentMap(skinNotes);
  const ranked = [...analysis.concerns]
    .filter((c) => !(honor && isIdentityConcern(c.key)))
    .sort((a, b) => a.uiScore - b.uiScore);

  const lowest = ranked.slice(0, 3);
  const highest = [...ranked].sort((a, b) => b.uiScore - a.uiScore).slice(0, 2);

  const lowPhrase = lowest.map((c) => `${c.label} (${c.uiScore})`).join(", ");
  const highPhrase = highest.map((c) => `${c.label} (${c.uiScore})`).join(" and ");

  const factualLead =
    lowest.length > 0
      ? `In this skin snapshot, the measurements that sit lower include ${lowPhrase}${
          highPhrase ? `, while ${highPhrase} sit higher` : ""
        }.`
      : "This skin snapshot captured several visible characteristics.";

  const scoreTable = ranked.map((c) => `${c.label}: ${c.uiScore}`).join(" | ");

  return {
    analysisId: analysis.id,
    lowest,
    highest,
    factualLead,
    scoreTable,
  };
}

/** True if the text actually cites this scan's scores/labels (not generic fluff). */
export function explanationCitesSnapshot(
  text: string,
  analysis: SkinAnalysis,
  skinNotes?: string,
): boolean {
  const honor = shouldHonorPigmentMap(skinNotes);
  const concerns = analysis.concerns.filter(
    (c) => !(honor && isIdentityConcern(c.key)),
  );
  const withNumbers = concerns.filter((c) => text.includes(String(c.uiScore))).length;
  const withLabels = concerns.filter((c) =>
    new RegExp(c.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text),
  ).length;
  return withNumbers >= 2 && withLabels >= 2;
}

export function groundOverallExplanation(
  aiOrHeuristicText: string,
  analysis: SkinAnalysis,
  extras?: { pigmentNote?: string; intentNote?: string; skinNotes?: string },
): string {
  const digest = buildSnapshotDigest(analysis, extras?.skinNotes);
  const body = aiOrHeuristicText.trim();

  if (explanationCitesSnapshot(body, analysis, extras?.skinNotes)) {
    const withIntent =
      extras?.intentNote && !body.toLowerCase().includes("need to change")
        ? `${body} ${extras.intentNote}`
        : body;
    return withIntent.replace(/\s+/g, " ").trim();
  }

  // Strip pigment-honor / diagnosis-adjacent fluff unless user named a condition
  let cleaned = body
    .replace(/Your skin snapshot highlights various characteristics[^.]*\./gi, "")
    .replace(/These observations are part of your unique skin story\./gi, "")
    .replace(/The traditional Ayurvedic lens suggests[^.]*\./gi, "")
    .replace(/Natural variation in tone[^.]*\./gi, "")
    .replace(/[^.]*pigment(?:ation| variation| map)?[^.]*\./gi, "")
    .replace(/[^.]*held with care[^.]*\./gi, "")
    .replace(/[^.]*vitiligo[^.]*\./gi, "")
    .replace(/\blifelong patterns such as vitiligo\b/gi, "natural variation in tone")
    .trim();

  if (!shouldHonorPigmentMap(extras?.skinNotes)) {
    cleaned = cleaned
      .replace(/[^.]*Honou?r(?:ed|ing)? your pigment[^.]*\./gi, "")
      .replace(/[^.]*Seen with care[^.]*\./gi, "")
      .trim();
  }

  const parts = [
    digest.factualLead,
    shouldHonorPigmentMap(extras?.skinNotes) && extras?.pigmentNote && !cleaned.includes("sharing")
      ? extras.pigmentNote
      : null,
    extras?.intentNote,
    cleaned && cleaned.length > 40 ? cleaned : null,
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
