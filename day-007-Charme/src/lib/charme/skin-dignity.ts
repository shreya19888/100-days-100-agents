import type { SkinConcern, SkinConcernKey } from "@/types";

/** Spots stay out of default UI unless the user names a condition. */
export const IDENTITY_CONCERN_KEYS: SkinConcernKey[] = ["spots"];

export function isIdentityConcern(key: SkinConcernKey): boolean {
  return IDENTITY_CONCERN_KEYS.includes(key);
}

/**
 * Only when the user explicitly names a condition in notes.
 * Never infer from YouCam scores alone.
 */
export function shouldHonorPigmentMap(skinNotes?: string): boolean {
  return Boolean(detectSkinConditionNotes(skinNotes));
}

export function dignityLabel(key: SkinConcernKey, fallback: string): string {
  if (key === "spots") return "Visible spots";
  return fallback;
}

export function dignitySeverityLabel(_key: SkinConcernKey, fallback: string): string {
  return fallback;
}

/** Named conditions only — keep this list tight to avoid false positives. */
const CONDITION_HINT =
  /\b(vitiligo|leucoderma|leukoderma|birthmark|birth\s*mark|melasma|eczema|psoriasis|rosacea|albinism)\b/i;

export function detectSkinConditionNotes(...texts: Array<string | undefined>): string | undefined {
  const joined = texts.filter(Boolean).join(" ");
  if (!joined.trim()) return undefined;
  const matches = joined.match(
    new RegExp(CONDITION_HINT.source, `${CONDITION_HINT.flags}g`),
  );
  if (!matches?.length) return undefined;
  const unique = Array.from(new Set(matches.map((m) => m.toLowerCase())));
  return unique.join(", ");
}

export function hasPigmentVariation(concerns: SkinConcern[]): boolean {
  return concerns.some((c) => c.key === "spots");
}

/** Only when user named a condition — otherwise undefined (no pigment copy). */
export function pigmentAcknowledgment(
  _concerns: SkinConcern[],
  skinNotes?: string,
): string | undefined {
  const named = detectSkinConditionNotes(skinNotes);
  if (!named) return undefined;

  return (
    `Thanks for sharing that (${named}). CHARME won't treat your skin difference as something that needs to be corrected. ` +
    `We can focus on whatever you're personally interested in — wellness, appearance, nutrition, or simply learning more.`
  );
}

/** Default care ranking never uses spots unless a named condition is being honored (then still excluded from "fix" ranking). */
export function careFocusConcerns(
  concerns: SkinConcern[],
  limit = 3,
): SkinConcern[] {
  return [...concerns]
    .filter((c) => !isIdentityConcern(c.key))
    .sort((a, b) => a.uiScore - b.uiScore)
    .slice(0, limit);
}

/**
 * Snapshot list for UI:
 * - Default: hide spots entirely
 * - Named condition: show spots with honored framing
 */
export function concernsForDisplay(
  concerns: SkinConcern[],
  skinNotes?: string,
): SkinConcern[] {
  if (shouldHonorPigmentMap(skinNotes)) return concerns;
  return concerns.filter((c) => !isIdentityConcern(c.key));
}

export function buildDignityStorySummary(
  concerns: SkinConcern[],
  skinNotes?: string,
): { priorities: SkinConcern[]; storySummary: string; pigmentNote?: string } {
  const pigmentNote = pigmentAcknowledgment(concerns, skinNotes);
  const priorities = careFocusConcerns(concerns, 3);
  const names = priorities.map((p) => p.label.toLowerCase());

  const storySummary =
    names.length > 0
      ? `Your skin snapshot highlights visible characteristics around ${names.join(", ")}. These are observations — not a list of things that are wrong with you. None of these need to change unless they're something you personally want to explore. Next, you choose what CHARME should help with.`
      : `Your skin snapshot shows a mix of visible characteristics. None of these need to change unless they're something you personally want to explore. Next, you choose what CHARME should help with.`;

  return { priorities, storySummary, pigmentNote };
}

/** Only used when shouldHonorPigmentMap is true. */
export const SPOTS_PRIORITY_HEURISTIC = {
  priority: "Holding your shared skin difference with care",
  explanation:
    "You shared a named skin difference. CHARME will not treat it as something that must be corrected. If you'd like, we can focus on comfort, sun kindness, and hydration instead.",
  ritualSuggestions: [
    "Speak kindly to your reflection",
    "Use gentle sun care you tolerate",
    "Moisturize for comfort",
  ],
  caution:
    "CHARME does not diagnose conditions from photos. If something is new, changing, painful, or worrying, a dermatologist can offer clarity.",
  confidence: "high" as const,
};
